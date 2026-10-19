import { checked, limit, service } from "./auth.ts";
import { ApiError, email, json, locale, required, text } from "./security.ts";
const topics = [
  "General",
  "Contribute/Join the network",
  "Commission a design",
  "Takedown",
  "Report a problem",
];
export function mailFrom() {
  const from = required("MAIL_FROM");
  const match = from.match(/(?:<|^)([^<>\s]+@([^<>\s]+))>?$/);
  if (!match || match[2].toLowerCase() !== "mail.redlarkworkshop.com" || /[\r\n]/.test(from))
    throw new ApiError(503, "mail_not_ready");
  return from;
}
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  replyTo: string,
  key: string,
  transport: typeof fetch = fetch,
) {
  if (!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(to))
    throw new ApiError(503, "mail_not_ready");
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("MAIL_PROVIDER_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: [to],
      subject,
      text: content,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw Object.assign(new ApiError(503, "mail_delivery_pending"), {
      providerStatus: response.status,
    });
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string")
    throw new ApiError(503, "mail_delivery_pending");
  return result.id;
}
export async function deliver(messageId: string) {
  const db = service();
  const message = checked(await db.from("messages").select("*").eq("id", messageId).single());
  const jobs = checked(
    await db
      .from("mail_jobs")
      .select("*")
      .eq("message_id", messageId)
      .neq("state", "sent")
      .lt("attempts", 8),
  );
  let failed = false;
  for (const job of jobs) {
    const claim = await db
      .from("mail_jobs")
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
    if (claim.error) throw new ApiError(503, "service_unavailable");
    if (!claim.data) {
      failed = true;
      continue;
    }
    try {
      const team = required("MAIL_TO_TEAM");
      const provider = await sendEmail(
        job.kind === "team" ? team : message.reply_email,
        job.kind === "team"
          ? `Red Lark Workshop: ${message.topic}`
          : "Red Lark Workshop — message received",
        job.kind === "team"
          ? `${message.body}\n\nReference: ${message.id}`
          : `We received your ${message.topic.toLowerCase()} message.\nReference: ${message.id}\n\nPlease do not send sensitive personal details. Reply to this email if you need to follow up.\n\nAcknowledgement confirms receipt, not a review decision.`,
        job.kind === "team" ? message.reply_email : team,
        `message-${job.id}`,
      );
      checked(
        await db
          .from("mail_jobs")
          .update({ state: "sent", provider_id: provider, lease_until: null, last_error: null })
          .eq("id", job.id),
      );
    } catch {
      failed = true;
      checked(
        await db
          .from("mail_jobs")
          .update({
            state: "failed",
            lease_until: null,
            last_error: "provider_delivery_pending",
            next_attempt: new Date(
              Date.now() + Math.min(6 * 3600000, 60000 * 2 ** job.attempts),
            ).toISOString(),
          })
          .eq("id", job.id),
      );
    }
  }
  if (failed) throw new ApiError(503, "mail_delivery_pending");
}
export async function contact(req: Request, data: Record<string, unknown>, takedown: boolean) {
  await limit(req, "contact", 8);
  if (
    text(data, "website", 200) ||
    !Number.isFinite(data.started) ||
    Date.now() - Number(data.started) < 2000 ||
    Date.now() - Number(data.started) > 86400000
  )
    throw new ApiError(422, "spam_check_failed");
  const reply = email(data, "reply", true),
    message = text(data, "message", 3000, 10),
    topic = takedown ? "Takedown" : text(data, "topic", 80, 1);
  if (!topics.includes(topic)) throw new ApiError(422, "invalid_topic");
  const workUrl = takedown ? text(data, "work_url", 1000, 8) : "";
  if (takedown && !/^https:\/\//.test(workUrl)) throw new ApiError(422, "invalid_work_url");
  const key = text(data, "submission_key", 36, 36);
  if (!/^[a-f0-9-]{36}$/.test(key)) throw new ApiError(422, "invalid_receipt");
  const id = checked(
    await service().rpc("store_message", {
      p_key: key,
      p_topic: topic,
      p_body: message,
      p_email: reply,
      p_locale: locale(data.locale),
      p_work_url: workUrl,
    }),
  );
  try {
    await deliver(String(id));
    return json({ ok: true, saved: true, receipt: id });
  } catch {
    return json({ ok: false, saved: true, receipt: id, error: "mail_delivery_pending" }, 503);
  }
}
