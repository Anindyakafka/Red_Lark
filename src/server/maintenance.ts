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
  return { cleaned, mail };
}
