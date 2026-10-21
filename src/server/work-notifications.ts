import { checked, service } from "./auth.ts";
import { sendEmail } from "./mail.ts";
import { origin, required } from "./security.ts";

/** Durable outbox; callers receive a notice, never lose an upload/review on mail failure. */
export async function deliverWorkNotifications(workId?: string): Promise<boolean> {
  const db = service();
  let query = db
    .from("work_notifications")
    .select("*")
    .neq("state", "sent")
    .lt("attempts", 8)
    .lte("next_attempt", new Date().toISOString())
    .order("created_at")
    .limit(8);
  if (workId) query = query.eq("work_id", workId);
  const jobs = checked(await query);
  let pending = false;
  for (const job of jobs) {
    const claim = await db
      .from("work_notifications")
      .update({
        state: "sending",
        attempts: job.attempts + 1,
        lease_until: new Date(Date.now() + 60000).toISOString(),
      })
      .eq("id", job.id)
      .eq("attempts", job.attempts)
      .or(`lease_until.is.null,lease_until.lt.${new Date().toISOString()}`)
      .select("id")
      .maybeSingle();
    if (claim.error || !claim.data) {
      pending = true;
      continue;
    }
    try {
      const work = checked(
        await db.from("works").select("id,title,owner_id,feedback").eq("id", job.work_id).single(),
      );
      const team = required("MAIL_TO_TEAM");
      let to = team;
      if (job.event !== "pending") {
        const result = await db.auth.admin.getUserById(work.owner_id);
        if (result.error || !result.data.user?.email_confirmed_at || !result.data.user.email)
          throw new Error("verified_recipient_unavailable");
        to = result.data.user.email;
      }
      const link =
        job.event === "pending"
          ? `${origin()}/en/admin/review/${work.id}/`
          : `${origin()}/en/account/`;
      await sendEmail(
        to,
        `Red Lark Workshop: ${job.event === "pending" ? "new submission" : job.event.replaceAll("_", " ")}`,
        `${work.title}\nStatus: ${job.event.replaceAll("_", " ")}\n${job.event === "pending" ? "A submission is ready for private review." : work.feedback}\n\n${link}\n\nDo not forward private review links.`,
        team,
        `work-${job.id}`,
      );
      checked(
        await db
          .from("work_notifications")
          .update({ state: "sent", lease_until: null, last_error: null })
          .eq("id", job.id),
      );
    } catch {
      pending = true;
      checked(
        await db
          .from("work_notifications")
          .update({
            state: "failed",
            lease_until: null,
            last_error: "delivery_pending",
            next_attempt: new Date(
              Date.now() + Math.min(21600000, 60000 * 2 ** job.attempts),
            ).toISOString(),
          })
          .eq("id", job.id),
      );
    }
  }
  if (workId) {
    const remaining = await db
      .from("work_notifications")
      .select("id", { count: "exact", head: true })
      .eq("work_id", workId)
      .neq("state", "sent");
    pending ||= !!remaining.error || !!remaining.count;
  }
  return pending;
}

export async function notificationNotice(workId: string) {
  try {
    return await deliverWorkNotifications(workId);
  } catch {
    return true; /* The transactional outbox remains available for the maintenance retry. */
  }
}
