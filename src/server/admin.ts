import { normalizeTags, orderReviewWorks } from "../lib/contribution-metadata.ts";
import { notificationNotice } from "./work-notifications.ts";
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
  if (path === "/api/admin/retry-work-mail") {
    const id = text(data, "id", 100, 1);
    checked(await who.client.from("works").select("id").eq("id", id).single());
    checked(
      await who.client.rpc("audit_admin_operation", { p_action: "retry_mail", p_target: id }),
    );
    checked(
      await service()
        .from("work_notifications")
        .update({
          attempts: 0,
          state: "pending",
          lease_until: null,
          next_attempt: new Date().toISOString(),
        })
        .eq("work_id", id)
        .eq("state", "failed"),
    );
    return json({ ok: true, mailPending: await notificationNotice(id) });
  }
  if (path === "/api/admin/rebuild") {
    checked(await who.client.rpc("audit_admin_operation", { p_action: "retry_publish" }));
    await requestBuild();
    return json({ ok: true, rebuilding: true });
  }
  if (path === "/api/admin/remove-work") {
    if (text(data, "confirm", 20) !== "REMOVE") throw new ApiError(422, "invalid_confirmation");
    const id = text(data, "id", 100, 1);
    const work = checked(
      await who.client
        .from("works")
        .select("id,status,publication_state,work_files(object_key,public_key)")
        .eq("id", id)
        .single(),
    );
    const needsRebuild = work.status === "approved" || work.publication_state === "published";
    if (needsRebuild) buildConfigured();
    checked(
      await who.client.rpc("audit_admin_operation", { p_action: "remove_work", p_target: id }),
    );
    for (const file of work.work_files) {
      if (file.public_key) await remove(file.public_key, true);
      await remove(file.object_key);
    }
    checked(await service().from("works").delete().eq("id", id).select("id").single());
    if (needsRebuild) await requestBuild();
    return json({ ok: true, rebuilding: needsRebuild });
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
  if (path === "/api/admin/metadata") {
    const id = text(data, "id", 100, 1);
    let tags: string[];
    try {
      tags = normalizeTags(data.tags);
    } catch {
      throw new ApiError(422, "invalid_tags");
    }
    const categories = Array.isArray(data.categories)
      ? data.categories.filter((value): value is string => typeof value === "string")
      : [];
    if (!Array.isArray(data.categories) || categories.length !== data.categories.length)
      throw new ApiError(422, "invalid_categories");
    const selected = [...new Set(categories)];
    if (selected.length) {
      const known = checked(
        await who.client.from("categories").select("slug").in("slug", selected),
      );
      if (known.length !== selected.length) throw new ApiError(422, "invalid_categories");
    }
    const before = checked(
      await who.client.from("works").select("status,publication_state").eq("id", id).single(),
    );
    if (
      !["pending", "changes_requested"].includes(before.status) &&
      !(before.status === "approved" && ["published", "failed"].includes(before.publication_state))
    )
      throw new ApiError(409, "invalid_transition");
    if (before.status === "approved" && before.publication_state === "published") buildConfigured();
    checked(
      await who.client.rpc("review_work_metadata", {
        p_work: id,
        p_title: text(data, "title", 200, 1),
        p_alt: text(data, "alt", 300),
        p_format: text(data, "format_slug", 100, 1),
        p_categories: selected,
        p_tags: tags,
      }),
    );
    const after = checked(
      await who.client.from("works").select("status,publication_state").eq("id", id).single(),
    );
    const rebuilding = after.status === "approved" && after.publication_state === "published";
    if (rebuilding) await requestBuild();
    return json({ ok: true, rebuilding });
  }
  if (path === "/api/admin/queue") {
    checked(await who.client.rpc("audit_admin_access", { p_action: "review_queue" }));
    return json({
      works: orderReviewWorks(
        checked(
          await who.client
            .from("works")
            .select(
              "*,work_files(id,kind,mime,bytes,width,height,dpi),work_categories(category_slug),work_tags(tags(slug,label,custom)),work_notifications(state,event,created_at),guest_submissions(contact,upi,contact_public,upi_public)",
            )
            .in("status", ["pending", "changes_requested", "rejected", "approved"])
            .order("created_at", { ascending: false }),
        ),
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
    });
  }
  if (path === "/api/admin/audit") {
    const start = text(data, "start", 30),
      end = text(data, "end", 30),
      filter = text(data, "action", 100),
      offset = Number(data.offset ?? 0);
    if (
      (start && !Number.isFinite(Date.parse(start))) ||
      (end && !Number.isFinite(Date.parse(end))) ||
      (start && end && Date.parse(start) > Date.parse(end)) ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 100000
    )
      throw new ApiError(422, "invalid_audit_filter");
    checked(await who.client.rpc("audit_admin_access", { p_action: "audit_read" }));
    let query = who.client
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (start) query = query.gte("created_at", new Date(start).toISOString());
    if (end) query = query.lte("created_at", new Date(end).toISOString());
    if (filter) query = query.eq("action", filter);
    const result = await query.range(offset, offset + 49);
    return json({
      audit: checked(result),
      total: result.count,
      offset,
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
    return json({ ok: true });
  }
  if (path !== "/api/admin/review") throw new ApiError(404, "not_found");
  const id = text(data, "id", 100, 1),
    action = text(data, "action", 40, 1);
  if (!["approve", "changes_requested", "rejected", "taken_down"].includes(action))
    throw new ApiError(422, "invalid_action");
  const reason = text(data, "reason", 3000, action === "approve" ? 0 : 10);
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
    return json({ ok: true, mailPending: await notificationNotice(id) });
  }
  if (action === "taken_down") {
    if (work.status !== "approved" || work.publication_state !== "published")
      throw new ApiError(409, "invalid_transition");
    buildConfigured();
    const files = checked(await who.client.from("work_files").select("*").eq("work_id", id));
    checked(
      await who.client
        .from("works")
        .update({ publication_state: "removing" })
        .eq("id", id)
        .eq("status", "approved")
        .eq("publication_state", "published")
        .select("id")
        .single(),
    );
    try {
      for (const file of files) if (file.public_key) await remove(file.public_key, true);
      checked(
        await who.client
          .from("works")
          .update({
            status: "taken_down",
            publication_state: "private",
            public_url: null,
            public_preview_url: null,
            feedback: reason,
          })
          .eq("id", id)
          .eq("status", "approved")
          .eq("publication_state", "removing")
          .select("id")
          .single(),
      );
    } catch (error) {
      await who.client
        .from("works")
        .update({ publication_state: "failed" })
        .eq("id", id)
        .eq("status", "approved")
        .eq("publication_state", "removing");
      throw error;
    }
    checked(await who.client.rpc("audit_admin_operation", { p_action: "take_down", p_target: id }));
    await requestBuild();
    return json({ ok: true, rebuilding: true });
  }
  buildConfigured();
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
      const extension =
        file.mime === "image/png"
          ? "png"
          : file.mime === "image/webp"
            ? "webp"
            : file.mime === "text/plain"
              ? "txt"
              : "pdf";
      const key = `works/${work.slug}/${file.id}.${extension}`;
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
  const mailPending = await notificationNotice(id);
  await requestBuild();
  return json({ ok: true, rebuilding: true, mailPending });
}
