import { deliverWorkNotifications } from "./work-notifications.ts";
import { checked, service } from "./auth.ts";
import { remove } from "./storage.ts";
import { deliver } from "./mail.ts";
export async function maintenance() {
  const db = service();
  let cleaned = 0,
    mail = 0;
  const expired = checked(
    await db
      .from("uploads")
      .select("id,object_key")
      .lt("expires_at", new Date(Date.now() - 3600000).toISOString())
      .limit(20),
  );
  for (const upload of expired) {
    await remove(upload.object_key);
    checked(await db.from("uploads").delete().eq("id", upload.id));
    cleaned++;
  }
  checked(await db.from("app_sessions").delete().lt("expires_at", new Date().toISOString()));
  checked(await db.from("rate_limits").delete().lt("expires_at", new Date().toISOString()));
  // Read-only guest receipts expire independently of publication; remove their
  // optional private contact details with the capability after 90 days.
  const expiredReceipts = checked(
    await db
      .from("guest_submissions")
      .select("work_id,works(status)")
      .lt("expires_at", new Date().toISOString())
      .limit(2),
  );
  for (const receipt of expiredReceipts) {
    // Drafts have never entered review; remove their abandoned private files too.
    const work = checked(
      await db.from("works").select("status").eq("id", receipt.work_id).single(),
    );
    if (work.status === "draft") {
      const files = checked(
        await db.from("work_files").select("object_key").eq("work_id", receipt.work_id),
      );
      for (const file of files) await remove(file.object_key);
      checked(await db.from("works").delete().eq("id", receipt.work_id).eq("status", "draft"));
    } else checked(await db.from("guest_submissions").delete().eq("work_id", receipt.work_id));
  }
  const jobs = checked(
    await db
      .from("mail_jobs")
      .select("message_id")
      .neq("state", "sent")
      .lt("attempts", 8)
      .lte("next_attempt", new Date().toISOString())
      .limit(2),
  );
  for (const id of new Set(jobs.map((job) => job.message_id)))
    try {
      await deliver(String(id));
      mail++;
    } catch {
      /* Persisted outbox retries without logging personal content. */
    }
  const workMailPending = await deliverWorkNotifications();
  return { cleaned, mail, workMailPending };
}
