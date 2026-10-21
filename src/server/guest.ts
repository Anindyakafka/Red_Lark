import { notificationNotice } from "./work-notifications.ts";
import { randomUUID } from "node:crypto";
import { checked, service, limit } from "./auth.ts";
import { ApiError, email, json, opaque, sha256, text } from "./security.ts";
import { privateBucket, publicBucket, signedUpload } from "./storage.ts";
import { processUpload, workValues } from "./contributions.ts";

export async function guest(req: Request, path: string, data: Record<string, unknown>) {
  const db = service();
  if (path === "/api/guest/start") {
    await limit(req, "guest-start", 8);
    const started = Number(data.started);
    if (
      data.website ||
      !Number.isFinite(started) ||
      Date.now() - started < 2000 ||
      started > Date.now()
    )
      throw new ApiError(422, "spam_check_failed");
    if (data.id) throw new ApiError(422, "invalid_id");
    const contact = email(data, "contact", true),
      upi = text(data, "upi", 150);
    if (upi && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upi))
      throw new ApiError(422, "invalid_upi");
    const { id, slug, values, categories } = await workValues(data, db);
    const token = opaque();
    checked(await db.from("works").insert({ ...values, id, slug, owner_id: null }));
    try {
      checked(
        await db.from("guest_submissions").insert({
          token_hash: sha256(token),
          work_id: id,
          contact,
          upi,
          contact_public: data.contact_consent === true,
          upi_public: data.upi_consent === true,
        }),
      );
      checked(
        await db.rpc("save_work_facets", {
          p_work: id,
          p_categories: categories,
          p_tags: values.tags,
        }),
      );
    } catch (error) {
      await db.from("works").delete().eq("id", id);
      throw error;
    }
    return json({ id, token });
  }
  if (
    !["/api/guest/status", "/api/guest/sign", "/api/guest/complete", "/api/guest/submit"].includes(
      path,
    )
  )
    throw new ApiError(404, "not_found");
  const token = text(data, "token", 43, 43);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ApiError(404, "submission_unavailable");
  await limit(req, "guest-access", 80);
  const receipt = await db
    .from("guest_submissions")
    .select("work_id,contact,upi,contact_public,upi_public,expires_at")
    .eq("token_hash", sha256(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (receipt.error) throw new ApiError(503, "service_unavailable");
  if (!receipt.data) throw new ApiError(404, "submission_unavailable");
  const work = checked(
    await db
      .from("works")
      .select("id,title,status,feedback,slug,owner_id,artist_name,licence_id,source,updated_at")
      .eq("id", receipt.data.work_id)
      .is("owner_id", null)
      .single(),
  );
  if (path === "/api/guest/status")
    return json({
      title: work.title,
      status: work.status,
      feedback: work.feedback,
      slug: work.status === "approved" ? work.slug : null,
      expiresAt: receipt.data.expires_at,
    });
  if (path === "/api/guest/submit" && work.status === "pending")
    return json({ ok: true, mailPending: await notificationNotice(work.id) });
  if (work.status !== "draft") throw new ApiError(409, "invalid_transition");
  if (path === "/api/guest/sign") {
    if (privateBucket() === publicBucket()) throw new ApiError(503, "storage_isolation_failed");
    // No client-selected work/key/user can expand the receipt's authority.
    const pending = checked(
      await db
        .from("uploads")
        .select("id,object_key,mime,bytes,state")
        .eq("work_id", work.id)
        .in("state", ["issued", "processing"])
        .gt("expires_at", new Date().toISOString()),
    );
    const mime = text(data, "mime", 50, 1),
      bytes = Number(data.bytes);
    if (pending.length) {
      const ticket = pending[0];
      if (
        pending.length !== 1 ||
        ticket.state !== "issued" ||
        ticket.mime !== mime ||
        ticket.bytes !== bytes
      )
        throw new ApiError(409, "upload_in_progress");
      const url = await signedUpload(ticket.object_key, mime, bytes);
      checked(
        await db
          .from("uploads")
          .update({ expires_at: new Date(Date.now() + 300000).toISOString() })
          .eq("id", ticket.id)
          .eq("state", "issued")
          .select("id")
          .single(),
      );
      return json({ id: ticket.id, url, expiresIn: 300 });
    }
    const id = randomUUID(),
      key = `quarantine/guest/${work.id}/${id}`;
    const url = await signedUpload(key, mime, bytes);
    checked(
      await db.from("uploads").insert({
        id,
        user_id: null,
        work_id: work.id,
        object_key: key,
        mime,
        bytes,
        expires_at: new Date(Date.now() + 300000).toISOString(),
      }),
    );
    return json({ id, url, expiresIn: 300 });
  }
  if (path === "/api/guest/complete") {
    const ticket = checked(
      await db
        .from("uploads")
        .update({ state: "processing" })
        .eq("id", text(data, "id", 100, 1))
        .eq("work_id", work.id)
        .is("user_id", null)
        .eq("state", "issued")
        .gt("expires_at", new Date().toISOString())
        .select("*")
        .single(),
    );
    return processUpload(ticket, work, true);
  }
  const files = checked(await db.from("work_files").select("kind").eq("work_id", work.id));
  if (
    !["sanitized", "preview", "pdf-a4", "pdf-a2"].every((kind) =>
      files.some((file) => file.kind === kind),
    )
  )
    throw new ApiError(422, "file_required");
  const processing = checked(
    await db.from("uploads").select("id").eq("work_id", work.id).eq("state", "processing"),
  );
  if (processing.length) throw new ApiError(409, "upload_in_progress");
  checked(
    await db
      .from("works")
      .update({
        status: "pending",
        consent_contact: receipt.data.contact_public ? receipt.data.contact : "",
        consent_upi: receipt.data.upi_public ? receipt.data.upi : "",
      })
      .eq("id", work.id)
      .eq("status", "draft")
      .select("id")
      .single(),
  );
  return json({ ok: true, mailPending: await notificationNotice(work.id) });
}
