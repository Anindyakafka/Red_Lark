import { checked, requireAdmin, type Identity, service } from "./auth.ts";
import { ApiError, json, required, text } from "./security.ts";
import { copyPublic, publicBase, publicUrl, remove, signedRead } from "./storage.ts";

export function buildConfigured() {
  if (process.env.PUBLIC_CATALOGUE_ENABLED !== "1") throw new ApiError(503, "publishing_not_ready");
  const url = new URL(required("NETLIFY_BUILD_HOOK"));
  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.netlify.com" ||
    !url.pathname.startsWith("/build_hooks/")
  )
    throw new ApiError(503, "publishing_not_ready");
  return url;
}
export async function requestBuild() {
  const response = await fetch(buildConfigured(), {
    method: "POST",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(503, "rebuild_failed");
}
export async function admin(
  _req: Request,
  path: string,
  data: Record<string, unknown>,
  who: Identity,
) {
  requireAdmin(who);
  if (path === "/api/admin/rebuild") {
    checked(await who.client.rpc("audit_admin_operation", { p_action: "retry_publish" }));
    await requestBuild();
    return json({ ok: true, rebuilding: true });
  }
  if (path === "/api/admin/retry-mail") {
    const id = text(data, "id", 100, 1);
    checked(await who.client.from("messages").select("id").eq("id", id).single());
    checked(
      await who.client.rpc("audit_admin_operation", { p_action: "retry_mail", p_target: id }),
    );
    checked(
      await service()
        .from("mail_jobs")
        .update({
          attempts: 0,
          state: "pending",
          lease_until: null,
          next_attempt: new Date().toISOString(),
        })
        .eq("message_id", id)
        .eq("state", "failed"),
    );
    const { deliver } = await import("./mail.ts");
    await deliver(id);
    return json({ ok: true });
  }
  if (path === "/api/admin/work-categories") {
    const id = text(data, "id", 100, 1),
      values = Array.isArray(data.categories)
        ? data.categories.filter((v): v is string => typeof v === "string")
        : [];
    const work = checked(await who.client.from("works").select("status").eq("id", id).single());
    if (work.status === "approved") buildConfigured();
    checked(await who.client.rpc("review_categories", { p_work: id, p_categories: values }));
    if (work.status === "approved") await requestBuild();
    return json({ ok: true });
  }
  if (path === "/api/admin/queue") {
    checked(await who.client.rpc("audit_admin_access", { p_action: "review_queue" }));
    return json({
      works: checked(
        await who.client
          .from("works")
          .select(
            "*,work_files(id,kind,mime,bytes,width,height,dpi),work_categories(category_slug)",
          )
          .in("status", ["pending", "changes_requested", "approved", "taken_down"])
          .order("created_at", { ascending: false }),
      ),
    });
  }
  if (path === "/api/admin/file") {
    const file = checked(
      await who.client
        .from("work_files")
        .select("object_key,work_id")
        .eq("id", text(data, "id", 100, 1))
        .single(),
    );
    checked(
      await who.client.rpc("audit_admin_access", {
        p_action: "review_file",
        p_target: file.work_id,
      }),
    );
    return json({ url: await signedRead(file.object_key) });
  }
  if (path === "/api/admin/inbox") {
    checked(await who.client.rpc("audit_admin_access", { p_action: "inbox" }));
    return json({
      messages: checked(
        await who.client
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
      takedowns: checked(
        await who.client
          .from("takedown_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    });
  }
  if (path === "/api/admin/audit") {
    checked(await who.client.rpc("audit_admin_access", { p_action: "audit_read" }));
    return json({
      audit: checked(
        await who.client
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    });
  }
  if (path === "/api/admin/users") {
    checked(await who.client.rpc("audit_admin_access", { p_action: "users_read" }));
    // Profiles only, not a bulk Auth email/address dump.
    return json({
      profiles: checked(
        await who.client.from("profiles").select("id,artist_name,created_at").limit(100),
      ),
    });
  }
  if (path === "/api/admin/message") {
    checked(
      await who.client
        .from("messages")
        .update({ status: "resolved" })
        .eq("id", text(data, "id", 100, 1))
        .select("id")
        .single(),
    );
    checked(
      await who.client
        .from("takedown_requests")
        .update({ status: "resolved" })
        .eq("message_id", text(data, "id", 100, 1)),
    );
    return json({ ok: true });
  }
  if (path !== "/api/admin/review") throw new ApiError(404, "not_found");
  const id = text(data, "id", 100, 1),
    action = text(data, "action", 40, 1),
    reason = text(data, "reason", 3000, action === "approve" ? 0 : 10);
  const work = checked(await who.client.from("works").select("*").eq("id", id).single());
  if (["changes_requested", "rejected"].includes(action)) {
    if (work.status !== "pending") throw new ApiError(409, "invalid_transition");
    checked(
      await who.client
        .from("works")
        .update({ status: action, feedback: reason })
        .eq("id", id)
        .eq("status", "pending")
        .in("publication_state", ["private", "failed"])
        .select("id")
        .single(),
    );
    return json({ ok: true });
  }
  buildConfigured();
  if (action === "taken_down") {
    if (!["approved", "taken_down"].includes(work.status))
      throw new ApiError(409, "invalid_transition");
    checked(
      await who.client
        .from("works")
        .update({ status: "taken_down", publication_state: "removing", feedback: reason })
        .eq("id", id),
    );
    const files = checked(
      await who.client.from("work_files").select("id,public_key").eq("work_id", id),
    );
    for (const file of files)
      if (file.public_key) {
        await remove(file.public_key, true);
        checked(await service().from("work_files").update({ public_key: null }).eq("id", file.id));
      }
    checked(
      await who.client
        .from("works")
        .update({ publication_state: "private", public_url: null, public_preview_url: null })
        .eq("id", id),
    );
    await requestBuild();
    return json({ ok: true, rebuilding: true });
  }
  if (
    action !== "approve" ||
    !["pending", "approved"].includes(work.status) ||
    (work.status === "approved" && work.publication_state !== "failed")
  )
    throw new ApiError(409, "invalid_transition");
  publicBase();
  const files = checked(await who.client.from("work_files").select("*").eq("work_id", id));
  const clean = files.find((f) => f.kind === "sanitized"),
    preview = files.find((f) => f.kind === "preview");
  if (!clean || !preview || files.some((f) => f.kind === "original"))
    throw new ApiError(422, "file_required");
  if (!["private", "failed"].includes(work.publication_state))
    throw new ApiError(409, "invalid_transition");
  checked(
    await who.client
      .from("works")
      .update({ publication_state: "copying" })
      .eq("id", id)
      .eq("status", work.status)
      .eq("publication_state", work.publication_state)
      .select("id")
      .single(),
  );
  const copied: { id: string; key: string }[] = [];
  try {
    for (const file of files) {
      const key = `works/${work.slug}/${file.id}.${file.mime === "image/png" ? "png" : file.mime === "image/webp" ? "webp" : "pdf"}`;
      await copyPublic(file.object_key, key, file.mime);
      copied.push({ id: file.id, key });
    }
    for (const file of copied)
      checked(
        await service().from("work_files").update({ public_key: file.key }).eq("id", file.id),
      );
    const keyFor = (fileId: string) => copied.find((f) => f.id === fileId)!.key;
    checked(
      await who.client
        .from("works")
        .update({
          status: "approved",
          publication_state: "published",
          feedback: reason,
          public_url: publicUrl(keyFor(clean.id)),
          public_preview_url: publicUrl(keyFor(preview.id)),
        })
        .eq("id", id)
        .eq("status", work.status)
        .eq("publication_state", "copying")
        .select("id")
        .single(),
    );
  } catch (error) {
    for (const file of copied) await remove(file.key, true).catch(() => {});
    await who.client
      .from("works")
      .update({ publication_state: "failed" })
      .eq("id", id)
      .eq("publication_state", "copying");
    throw error;
  }
  await requestBuild();
  return json({ ok: true, rebuilding: true });
}
