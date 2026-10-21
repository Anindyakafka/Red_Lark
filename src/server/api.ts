import {
  ApiError,
  body,
  checkMutation,
  cookie,
  cookies,
  csrfCookie,
  decrypt,
  email,
  encrypt,
  json,
  locale,
  origin,
  text,
} from "./security.ts";
import {
  callback,
  checked,
  flowClient,
  identity,
  limit,
  publicClient,
  requireAdmin,
  saveSession,
  service,
  sessionName,
} from "./auth.ts";

const flowName = "__Host-redlark-auth-flow";
async function staffAllowed(address: string) {
  return checked(await service().rpc("staff_email_allowed", { p_email: address })) === true;
}
function checkAuthMail(error: { status?: number } | null) {
  if (error?.status === 429) throw new ApiError(429, "try_later");
  if (error?.status && error.status >= 500) throw new ApiError(503, "service_unavailable");
  // Other responses deliberately do not reveal whether an address has an account.
}
export default async function handler(req: Request): Promise<Response> {
  try {
    const path = new URL(req.url).pathname.replace(/\/$/, "");
    if (req.method === "GET" && path === "/api/session") {
      const csrf = csrfCookie(req);
      let account: unknown = null;
      try {
        const who = await identity(req);
        let pendingCount: number | null = null;
        if (who.admin && who.fresh) {
          const count = await who.client
            .from("works")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending");
          if (!count.error) pendingCount = count.count;
        }
        account = {
          email: who.user.email,
          admin: who.admin,
          aal2: who.aal2,
          fresh: who.fresh,
          pendingCount,
        };
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
      return json({ csrf: csrf.token, account }, 200, { "Set-Cookie": csrf.cookie });
    }
    if (req.method === "GET" && path.startsWith("/api/preview/")) {
      const who = await identity(req),
        id = path.split("/").at(-1);
      if (!id || !/^[a-f0-9-]{36}$/.test(id)) throw new ApiError(404, "not_found");
      const file = checked(
        await who.client
          .from("work_files")
          .select("object_key,kind,work_id")
          .eq("id", id)
          .eq("kind", "preview")
          .single(),
      );
      if (who.admin) {
        requireAdmin(who);
        checked(
          await who.client.rpc("audit_admin_access", {
            p_action: "review_file",
            p_target: file.work_id,
          }),
        );
      } else
        checked(
          await who.client
            .from("works")
            .select("id")
            .eq("id", file.work_id)
            .eq("owner_id", who.user.id)
            .single(),
        );
      const { r2, privateBucket } = await import("./storage.ts");
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const object = await r2().send(
        new GetObjectCommand({ Bucket: privateBucket(), Key: file.object_key }),
      );
      if (!object.Body || !object.ContentLength || object.ContentLength > 5000000)
        throw new ApiError(404, "not_found");
      return new Response(new Uint8Array(await object.Body.transformToByteArray()).buffer, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (req.method === "GET" && path === "/api/auth/invite") {
      const token = new URL(req.url).searchParams.get("token_hash") || "";
      if (!/^(?:[a-f0-9]{56}|[a-f0-9]{64})$/i.test(token)) throw new ApiError(400, "link_expired");
      const result = await publicClient().auth.verifyOtp({ token_hash: token, type: "invite" });
      if (
        result.error ||
        !result.data.session ||
        !result.data.user?.email ||
        !(await staffAllowed(result.data.user.email))
      )
        throw new ApiError(400, "link_expired");
      const saved = await saveSession(result.data.session);
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${origin()}/en/reset-password/`,
          "Set-Cookie": saved.cookie,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    if (req.method === "GET" && path === "/api/auth/callback") {
      let flow: { verifier: string; locale: string; mode: string; created: number };
      try {
        flow = decrypt(cookies(req)[flowName]);
      } catch {
        throw new ApiError(400, "link_expired");
      }
      if (Date.now() - flow.created > 3600000) throw new ApiError(400, "link_expired");
      const code = new URL(req.url).searchParams.get("code");
      if (!code || code.length > 300) throw new ApiError(400, "link_expired");
      const result = await flowClient(flow.verifier).client.auth.exchangeCodeForSession(code);
      if (result.error || !result.data.session) throw new ApiError(400, "link_expired");
      if (!result.data.user?.email || !(await staffAllowed(result.data.user.email)))
        throw new ApiError(400, "link_expired");
      const saved = await saveSession(result.data.session);
      const headers = new Headers({
        Location: `${origin()}/${locale(flow.locale)}/${flow.mode === "recovery" ? "reset-password" : "account"}/`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      });
      headers.append("Set-Cookie", saved.cookie);
      headers.append("Set-Cookie", cookie(flowName, "", 0));
      return new Response(null, { status: 303, headers });
    }
    if (req.method !== "POST") throw new ApiError(404, "not_found");
    checkMutation(req);
    const data = await body(req);
    if (path === "/api/auth/signup" || path === "/api/auth/signup-link")
      throw new ApiError(403, "signup_disabled");
    if (["/api/auth/login", "/api/auth/magic", "/api/auth/forgot"].includes(path)) {
      const address = email(data);
      await limit(req, "auth", 15, address);
      const lang = locale(data.locale),
        password = typeof data.password === "string" ? data.password : "";
      const allowed = await staffAllowed(address);
      if (path === "/api/auth/login") {
        if (password.length < 1 || password.length > 128) throw new ApiError(400, "sign_in_failed");
        const result = await publicClient().auth.signInWithPassword({ email: address, password });
        if (
          result.error ||
          !result.data.session ||
          !result.data.user?.email_confirmed_at ||
          !allowed
        )
          throw new ApiError(400, "sign_in_failed");
        const saved = await saveSession(result.data.session);
        return json({ ok: true }, 200, { "Set-Cookie": saved.cookie });
      }
      // Match the successful response for non-staff; never send an account-existence signal.
      if (!allowed) return json({ ok: true, inbox: true });
      const flow = flowClient();
      if (path === "/api/auth/magic") {
        const result = await flow.client.auth.signInWithOtp({
          email: address,
          options: {
            emailRedirectTo: callback(lang),
            shouldCreateUser: false,
          },
        });
        checkAuthMail(result.error);
      } else {
        const result = await flow.client.auth.resetPasswordForEmail(address, {
          redirectTo: callback(lang),
        });
        checkAuthMail(result.error);
      }
      const verifier = flow.getVerifier();
      const headers = verifier
        ? {
            "Set-Cookie": cookie(
              flowName,
              encrypt({
                verifier,
                locale: lang,
                mode: path.endsWith("forgot") ? "recovery" : "login",
                created: Date.now(),
              }),
              3600,
            ),
          }
        : undefined;
      return json({ ok: true, inbox: true }, 200, headers);
    }
    if (path === "/api/contact" || path === "/api/takedown")
      return await (await import("./mail.ts")).contact(req, data, path.endsWith("takedown"));
    if (path.startsWith("/api/guest/"))
      return await (await import("./guest.ts")).guest(req, path, data);
    const who = await identity(req);
    await limit(req, "account", 100, who.user.id);
    if (path === "/api/auth/logout") {
      await who.client.auth.signOut({ scope: "global" });
      checked(await service().from("app_sessions").delete().eq("user_id", who.user.id));
      return json({ ok: true }, 200, { "Set-Cookie": cookie(sessionName, "", 0) });
    }
    if (path === "/api/auth/reset") {
      const password = text(data, "password", 128, 12);
      // Recovered sessions and freshly password-authenticated sessions are verified by Auth.
      const result = await who.client.auth.updateUser({ password });
      if (result.error) throw new ApiError(400, "password_update_failed");
      await who.client.auth.signOut({ scope: "global" });
      checked(await service().from("app_sessions").delete().eq("user_id", who.user.id));
      return json({ ok: true }, 200, { "Set-Cookie": cookie(sessionName, "", 0) });
    }
    if (path === "/api/auth/mfa/enroll") {
      const factors = await who.client.auth.mfa.listFactors();
      if (factors.error) throw new ApiError(503, "service_unavailable");
      if (factors.data.totp.some((x) => x.status === "verified"))
        throw new ApiError(409, "mfa_already_enabled");
      for (const factor of factors.data.totp)
        await who.client.auth.mfa.unenroll({ factorId: factor.id });
      const enrolled = await who.client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Workshop security",
      });
      if (enrolled.error || enrolled.data.type !== "totp") throw new ApiError(400, "mfa_failed");
      // URI is shown only to the authenticated owner; never logged or persisted locally.
      return json({
        factorId: enrolled.data.id,
        uri: enrolled.data.totp.uri,
        secret: enrolled.data.totp.secret,
        qrCode: `data:image/svg+xml;base64,${Buffer.from(
          enrolled.data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, ""),
        ).toString("base64")}`,
      });
    }
    if (path === "/api/auth/mfa/factors") {
      const result = await who.client.auth.mfa.listFactors();
      if (result.error) throw new ApiError(503, "service_unavailable");
      return json({ factors: result.data.totp.map((f) => ({ id: f.id, status: f.status })) });
    }
    if (path === "/api/auth/mfa/verify") {
      const factorId = text(data, "factorId", 100, 1),
        code = text(data, "code", 6, 6);
      if (!/^\d{6}$/.test(code)) throw new ApiError(422, "invalid_code");
      await limit(req, "mfa", 10, who.user.id);
      const result = await who.client.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw new ApiError(400, "mfa_failed");
      const session = await who.client.auth.getSession();
      if (!session.data.session) throw new ApiError(401, "sign_in_required");
      await saveSession(session.data.session, who.tokenHash);
      return json({ ok: true });
    }
    if (path.startsWith("/api/account") || path.startsWith("/api/upload"))
      return await (await import("./contributions.ts")).contributions(req, path, data, who);
    if (path.startsWith("/api/admin"))
      return await (await import("./admin.ts")).admin(req, path, data, who);
    throw new ApiError(404, "not_found");
  } catch (error) {
    if (req.method === "GET" && new URL(req.url).pathname === "/api/auth/callback") {
      const lang = locale(new URL(req.url).searchParams.get("locale"));
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${origin()}/${lang}/login/?error=link_expired`,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "Set-Cookie": cookie(flowName, "", 0),
        },
      });
    }
    if (error instanceof ApiError) return json({ ok: false, error: error.code }, error.status);
    // Provider errors can contain tokens, personal data or credentials. Never serialize/log them.
    return json({ ok: false, error: "service_unavailable" }, 503);
  }
}
