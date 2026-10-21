import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { adminMfaFresh, type AssuranceClaims } from "./admin-mfa.ts";
import {
  ApiError,
  cookie,
  cookies,
  decrypt,
  encrypt,
  opaque,
  origin,
  rateHash,
  required,
  sha256,
} from "./security.ts";

export function publicClient(token?: string) {
  return createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    },
  );
}
export function service() {
  return createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
export function checked<T>({
  data,
  error,
  status,
}: {
  data: T;
  error: unknown;
  status?: number;
}): NonNullable<T> {
  // PostgREST returns no JSON for successful return=minimal writes and void RPCs.
  // A missing SELECT row (200/null) is still a failure; never confuse it with a write.
  if (error || (data == null && status !== 201 && status !== 204))
    throw new ApiError(503, "service_unavailable");
  return data as NonNullable<T>;
}
export async function limit(req: Request, scope: string, max = 10, subject?: string) {
  // Only Netlify's trusted connection header is used. Never store or log the raw address.
  const address = req.headers.get("x-nf-client-connection-ip") || "local";
  const expires = new Date();
  expires.setUTCHours(24, 0, 0, 0);
  for (const item of [address, ...(subject ? [subject.toLowerCase()] : [])]) {
    const allowed = checked(
      await service().rpc("consume_rate_limit", {
        p_key: rateHash(item, scope),
        p_limit: max,
        p_expires: expires.toISOString(),
      }),
    );
    if (allowed !== true) throw new ApiError(429, "try_later");
  }
}
export const sessionName = "__Host-redlark-session";
type Tokens = { access_token: string; refresh_token: string; expires_at: number };
export type Identity = {
  user: User;
  client: SupabaseClient;
  tokenHash: string;
  tokens: Tokens;
  admin: boolean;
  aal2: boolean;
  fresh: boolean;
};
export async function saveSession(session: Session, hash?: string) {
  if (!session.user.email_confirmed_at) throw new ApiError(401, "sign_in_required");
  checked(
    await service()
      .from("roles")
      .upsert(
        { user_id: session.user.id, role: "contributor" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      ),
  );
  const token = opaque(),
    tokenHash = hash || sha256(token);
  checked(
    await service()
      .from("app_sessions")
      .upsert({
        token_hash: tokenHash,
        user_id: session.user.id,
        encrypted_auth: encrypt({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        }),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      // Existing-session upserts return 200/null with return=minimal. Request
      // only the row identifier so a successful MFA/refresh update is explicit.
      .select("token_hash")
      .single(),
  );
  return { tokenHash, cookie: cookie(sessionName, token, 7 * 86400) };
}
export async function identity(req: Request): Promise<Identity> {
  const token = cookies(req)[sessionName];
  if (!token || token.length > 100) throw new ApiError(401, "sign_in_required");
  const tokenHash = sha256(token);
  const stored = await service()
    .from("app_sessions")
    .select("encrypted_auth,expires_at,user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (stored.error) throw new ApiError(503, "service_unavailable");
  const row = stored.data;
  if (!row) throw new ApiError(401, "sign_in_required");
  if (Date.parse(row.expires_at) < Date.now()) throw new ApiError(401, "sign_in_required");
  let tokens: Tokens;
  try {
    tokens = decrypt<Tokens>(row.encrypted_auth);
  } catch {
    throw new ApiError(401, "sign_in_required");
  }
  const client = publicClient();
  // setSession refreshes only when necessary; getUser verifies revocation with Auth.
  const set = await client.auth.setSession(tokens);
  if (set.error || !set.data.session) throw new ApiError(401, "sign_in_required");
  const session = set.data.session;
  if (session.access_token !== tokens.access_token) {
    await saveSession(session, tokenHash);
    tokens = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || 0,
    };
  }
  const verified = await client.auth.getUser();
  if (
    verified.error ||
    !verified.data.user?.email_confirmed_at ||
    verified.data.user.id !== row.user_id
  )
    throw new ApiError(401, "sign_in_required");
  const roles = checked(await client.from("roles").select("role"));
  const admin = roles.some((r) => r.role === "admin");
  // Auth validated the token above. Claims are inspected only after that verification.
  const claims = JSON.parse(
    Buffer.from(tokens.access_token.split(".")[1], "base64url").toString(),
  ) as AssuranceClaims;
  const aal2 = claims.aal === "aal2";
  const fresh = adminMfaFresh(claims);
  return { user: verified.data.user, client, tokenHash, tokens, admin, aal2, fresh };
}
export function requireAdmin(who: Identity, fresh = true) {
  if (!who.admin || !who.aal2 || (fresh && !who.fresh))
    throw new ApiError(403, "fresh_mfa_required");
}
export function flowClient(verifier?: string) {
  const store = new Map<string, string>();
  if (verifier)
    store.set(
      `sb-${new URL(required("SUPABASE_URL")).hostname.split(".")[0]}-auth-token-code-verifier`,
      verifier,
    );
  const client = createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => store.get(key) || null,
          setItem: (key, value) => {
            store.set(key, value);
          },
          removeItem: (key) => {
            store.delete(key);
          },
        },
      },
    },
  );
  return {
    client,
    getVerifier: () => [...store.entries()].find(([key]) => key.endsWith("-code-verifier"))?.[1],
  };
}
export function callback(locale: string) {
  return `${origin()}/api/auth/callback?locale=${locale}`;
}
