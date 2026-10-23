import { notificationNotice } from "./work-notifications.ts";
import { normalizeTags } from "../lib/contribution-metadata.ts";
import { randomUUID } from "node:crypto";
import { checked, type Identity, service } from "./auth.ts";
import { ApiError, cookie, email, json, origin, text } from "./security.ts";
import {
  privateBucket,
  printPdf,
  publicBucket,
  put,
  quarantine,
  remove,
  signedRead,
  signedUpload,
} from "./storage.ts";

const languages = ["English", "Hindi", "Bengali", "Malayalam"];
export async function contributions(
  _req: Request,
  path: string,
  data: Record<string, unknown>,
  who: Identity,
) {
  if (path === "/api/account") {
    const profile = await who.client
      .from("profiles")
      .select("*")
      .eq("id", who.user.id)
      .maybeSingle();
    if (profile.error) throw new ApiError(503, "service_unavailable");
    const works = checked(
      await who.client
        .from("works")
        .select(
          "*,work_files(id,kind,mime,bytes,width,height,dpi),work_categories(category_slug),work_tags(tags(slug,label,custom))",
        )
        .eq("owner_id", who.user.id)
        .order("created_at", { ascending: false }),
    );
    return json({ profile: profile.data, works });
  }
  if (path === "/api/account/profile") {
    const profile = {
      id: who.user.id,
      artist_name: text(data, "artist_name", 120),
      bio: text(data, "bio", 3000),
      contact: email(data, "contact", true),
      contact_public: data.contact_public === true,
      upi: text(data, "upi", 150),
      upi_public: data.upi_public === true,
    };
    if (profile.upi && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(profile.upi))
      throw new ApiError(422, "invalid_upi");
    // Published contact withdrawals must rebuild the public snapshot as well.
    const previous = await who.client
      .from("profiles")
      .select("contact,upi,contact_public,upi_public")
      .eq("id", who.user.id)
      .maybeSingle();
    if (previous.error) throw new ApiError(503, "service_unavailable");
    let rebuild = false;
    if (previous.data && (previous.data.contact_public || previous.data.upi_public)) {
      const published = checked(
        await who.client
          .from("works")
          .select("id")
          .eq("owner_id", who.user.id)
          .eq("publication_state", "published"),
      );
      if (
        published.length &&
        (profile.contact !== previous.data.contact ||
          profile.upi !== previous.data.upi ||
          profile.contact_public !== previous.data.contact_public ||
          profile.upi_public !== previous.data.upi_public)
      ) {
        // Removal of contact is privacy-critical; do not silently leave a stale static page.
        const { buildConfigured } = await import("./admin.ts");
        buildConfigured();
        rebuild = true;
      }
    }
    checked(await who.client.from("profiles").upsert(profile).select("id").single());
    if (rebuild) {
      const { requestBuild } = await import("./admin.ts");
      await requestBuild();
    }
    return json({ ok: true });
  }
  if (path === "/api/account/export") {
    const profile = checked(await who.client.from("profiles").select("*").eq("id", who.user.id));
    const works = checked(
      await who.client
        .from("works")
        .select("*,work_categories(category_slug)")
        .eq("owner_id", who.user.id),
    );
    return json({ exported_at: new Date().toISOString(), profile, works });
  }
  if (path === "/api/account/delete") {
    if (who.admin && !who.fresh) throw new ApiError(403, "fresh_mfa_required");
    if (
      text(data, "confirm", 20) !== "DELETE" ||
      !["remove", "anonymise"].includes(String(data.effect))
    )
      throw new ApiError(422, "invalid_confirmation");
    // A fresh password or TOTP protects a destructive operation from a stolen long-lived session.
    if (!who.fresh) {
      const result = await who.client.auth.signInWithPassword({
        email: who.user.email || "",
        password: text(data, "password", 128, 1),
      });
      if (result.error) throw new ApiError(403, "reauth_required");
    }
    const works = checked(
      await who.client
        .from("works")
        .select("id,status,work_files(object_key,public_key)")
        .eq("owner_id", who.user.id),
    );
    const published = works.some((w) => w.status === "approved");
    if (published) {
      const { buildConfigured } = await import("./admin.ts");
      buildConfigured();
    }
    for (const work of works) {
      const keep = data.effect === "anonymise" && work.status === "approved";
      for (const file of work.work_files) {
        if (!keep && file.public_key) await remove(file.public_key, true);
        await remove(file.object_key);
      }
      if (keep)
        checked(
          await service()
            .from("works")
            .update({
              owner_id: null,
              artist_name: "Anonymous contributor",
              consent_contact: "",
              consent_upi: "",
            })
            .eq("id", work.id),
        );
      else checked(await service().from("works").delete().eq("id", work.id));
    }
    const uploads = checked(
      await service().from("uploads").select("object_key").eq("user_id", who.user.id),
    );
    for (const upload of uploads) await remove(upload.object_key);
    checked(await service().from("app_sessions").delete().eq("user_id", who.user.id));
    const result = await service().auth.admin.deleteUser(who.user.id);
    if (result.error) throw new ApiError(503, "service_unavailable");
    if (published) {
      const { requestBuild } = await import("./admin.ts");
      await requestBuild();
    }
    return json({ ok: true }, 200, { "Set-Cookie": cookie("__Host-redlark-session", "", 0) });
  }
  if (path === "/api/account/work") {
    const { id, slug, values, categories } = await workValues(data, who.client);
    if (data.id)
      checked(
        await who.client
          .from("works")
          .update({ ...values, status: "draft" })
          .eq("id", id)
          .eq("owner_id", who.user.id)
          .select("id")
          .single(),
      );
    else
      checked(
        await who.client.from("works").insert({ ...values, id, slug, owner_id: who.user.id }),
      );
    checked(
      await who.client.rpc("save_work_facets", {
        p_work: id,
        p_categories: categories,
        p_tags: values.tags,
      }),
    );
    return json({ ok: true, id });
  }
  if (path === "/api/upload/sign") {
    if (privateBucket() === publicBucket()) throw new ApiError(503, "storage_isolation_failed");
    const work = checked(
      await who.client
        .from("works")
        .select("id,status,owner_id")
        .eq("id", text(data, "work_id", 100, 1))
        .eq("owner_id", who.user.id)
        .single(),
    );
    if (!["draft", "changes_requested"].includes(work.status))
      throw new ApiError(409, "invalid_transition");
    const bytes = Number(data.bytes),
      mime = text(data, "mime", 50, 1),
      id = randomUUID(),
      key = `quarantine/${who.user.id}/${id}`;
    const url = await signedUpload(key, mime, bytes);
    checked(
      await service()
        .from("uploads")
        .insert({
          id,
          user_id: who.user.id,
          work_id: work.id,
          object_key: key,
          mime,
          bytes,
          expires_at: new Date(Date.now() + 300000).toISOString(),
        }),
    );
    return json({ id, url, expiresIn: 300 });
  }
  if (path === "/api/upload/complete") {
    const id = text(data, "id", 100, 1);
    const ticket = checked(
      await service()
        .from("uploads")
        .update({ state: "processing" })
        .eq("id", id)
        .eq("user_id", who.user.id)
        .eq("state", "issued")
        .gt("expires_at", new Date().toISOString())
        .select("*")
        .single(),
    );
    const work = checked(
      await who.client
        .from("works")
        .select("id,status,artist_name,licence_id,source,updated_at")
        .eq("id", ticket.work_id)
        .eq("owner_id", who.user.id)
        .single(),
    );
    if (!["draft", "changes_requested"].includes(work.status))
      throw new ApiError(409, "invalid_transition");
    return processUpload(ticket, work);
  }
  if (path === "/api/account/submit") {
    const id = text(data, "id", 100, 1);
    const files = checked(await who.client.from("work_files").select("kind").eq("work_id", id));
    if (!files.some((f) => f.kind === "sanitized")) throw new ApiError(422, "file_required");
    const profile = await who.client
      .from("profiles")
      .select("contact,contact_public,upi,upi_public")
      .eq("id", who.user.id)
      .maybeSingle();
    if (profile.error) throw new ApiError(503, "service_unavailable");
    checked(
      await who.client
        .from("works")
        .update({
          status: "pending",
          consent_contact:
            data.contact_consent === true && profile.data?.contact_public
              ? profile.data.contact
              : "",
          consent_upi:
            data.upi_consent === true && profile.data?.upi_public ? profile.data.upi : "",
        })
        .eq("id", id)
        .eq("owner_id", who.user.id)
        .select("id")
        .single(),
    );
    return json({ ok: true, mailPending: await notificationNotice(text(data, "id", 100, 1)) });
  }
  if (path === "/api/account/file") {
    const file = checked(
      await who.client
        .from("work_files")
        .select("object_key,work_id")
        .eq("id", text(data, "id", 100, 1))
        .single(),
    );
    checked(
      await who.client
        .from("works")
        .select("id")
        .eq("id", file.work_id)
        .eq("owner_id", who.user.id)
        .single(),
    );
    return json({ url: await signedRead(file.object_key) });
  }
  throw new ApiError(404, "not_found");
}

export async function workValues(data: Record<string, unknown>, client: Identity["client"]) {
  if (data.permission !== true) throw new ApiError(422, "permission_required");
  const title = text(data, "title", 200, 1),
    alt = text(data, "alt", 300),
    format = text(data, "format_slug", 100, 1),
    licence = text(data, "licence_id", 100) || "CC-BY-SA-4.0";
  const reference = checked(
    await client.from("licences").select("derivatives").eq("id", licence).single(),
  );
  const selectedLanguages = Array.isArray(data.languages)
    ? data.languages.filter((v): v is string => typeof v === "string" && languages.includes(v))
    : [];
  if (!selectedLanguages.length) throw new ApiError(422, "invalid_languages");
  const categories = Array.isArray(data.categories)
    ? data.categories.filter((v): v is string => typeof v === "string")
    : [];
  let tags: string[];
  try {
    tags = normalizeTags(data.tags);
  } catch (error) {
    throw new ApiError(422, error instanceof Error ? error.message : "invalid_tags");
  }
  const id = typeof data.id === "string" ? data.id : randomUUID();
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new ApiError(422, "invalid_id");
  const slug = `work-${id}`;
  const ai = text(data, "ai_use", 30);
  if (!["none", "minimal-assisted", "generated"].includes(ai))
    throw new ApiError(422, "invalid_ai_use");
  const canonical = origin().startsWith("https://") ? origin() : "https://redlarkworkshop.com";
  const source = text(data, "source", 1000) || `${canonical}/en/poster/${slug}/`;
  if (!/^https:\/\//.test(source)) throw new ApiError(422, "invalid_source");
  const values = {
    title,
    alt,
    artist_name: text(data, "artist_name", 120) || "Anonymous contributor",
    caption: text(data, "caption", 5000),
    format_slug: format,
    licence_id: licence,
    remixable: reference.derivatives === true && data.remixable !== false,
    languages: selectedLanguages,
    tags,
    source,
    ai_use: ai,
    ai_disclosure: text(data, "ai_disclosure", 2000),
    details_missing:
      !text(data, "artist_name", 120) ||
      !text(data, "caption", 5000) ||
      !text(data, "alt", 300) ||
      !text(data, "source", 1000),
  };
  return { id, slug, values, categories };
}

export async function processUpload(
  ticket: { id: string; user_id: string | null; object_key: string; bytes: number; mime: string },
  work: { id: string; artist_name: string; licence_id: string; source: string; updated_at: string },
  guest = false,
) {
  const id = ticket.id;
  const keys: string[] = [];
  try {
    const clean = await quarantine(ticket.object_key, ticket.bytes, ticket.mime);
    const prefix = `sanitized/${work.id}/${randomUUID()}`;
    const credit = `${work.artist_name} | ${work.licence_id} | ${work.source}`;
    const outputs = [
      { kind: "sanitized", key: `${prefix}.png`, buffer: clean.buffer, mime: "image/png" },
      { kind: "preview", key: `${prefix}.webp`, buffer: clean.preview, mime: "image/webp" },
      ...(await Promise.all(
        (["a4", "a2"] as const).map(async (size) => ({
          kind: `pdf-${size}`,
          key: `${prefix}-${size}.pdf`,
          buffer: await printPdf(clean.buffer, size, credit),
          mime: "application/pdf",
        })),
      )),
    ];
    for (const file of outputs) {
      await put(file.key, file.buffer, file.mime);
      keys.push(file.key);
    }
    const old = checked(
      await service().rpc(guest ? "finish_guest_upload" : "finish_upload", {
        p_ticket: id,
        ...(guest ? { p_work: work.id } : { p_user: ticket.user_id }),
        p_updated: work.updated_at,
        p_files: outputs.map((file) => ({
          kind: file.kind,
          object_key: file.key,
          mime: file.mime,
          bytes: file.buffer.length,
          width: clean.width,
          height: clean.height,
          dpi: Math.round(clean.width / ((file.kind === "pdf-a2" ? 420 : 210) / 25.4)),
          sha256: file.kind === "sanitized" ? clean.sha256 : null,
        })),
      }),
    ) as string[];
    // Metadata replacement commits atomically. Cleanup must not undo committed new files.
    keys.length = 0;
    for (const key of old) await remove(key).catch(() => {});
    await remove(ticket.object_key).catch(() => {});
    return json({
      ok: true,
      width: clean.width,
      height: clean.height,
      dpiA4: Math.round(clean.width / (210 / 25.4)),
      dpiA2: Math.round(clean.width / (420 / 25.4)),
      warning: clean.width / (420 / 25.4) < 300 ? "resolution_warning" : null,
    });
  } catch (error) {
    for (const key of keys) await remove(key).catch(() => {});
    await remove(ticket.object_key).catch(() => {});
    await service().from("uploads").update({ state: "failed" }).eq("id", id);
    throw error;
  }
}
