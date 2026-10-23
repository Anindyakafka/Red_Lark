"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useI18n } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import Image from "next/image";
import categories from "../../content/categories.json";
import formats from "../../content/formats.json";
import { AdminRecords } from "./admin-records";
import { DescriptionField, TagsField, CategoriesField, LicenceField } from "./contribution-fields";
import { imageDescription, licenceSummary, normalizeTags } from "@/lib/contribution-metadata";

const allowedUploadMimes = [
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
function uploadMime(file: File) {
  if (allowedUploadMimes.includes(file.type)) return file.type;
  if (/\.md$/i.test(file.name)) return "text/markdown";
  if (/\.txt$/i.test(file.name)) return "text/plain";
  if (/\.docx$/i.test(file.name))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return file.type;
}

const errors: Record<string, string> = {
  invitation_expired:
    "This invitation is invalid, expired or already used. Use the newest invitation. If your email is already verified, sign in or request a password reset; otherwise ask the team to reissue it.",
  submission_unavailable:
    "This private submission link is invalid or expired. Check the complete link or contact the team.",
  upload_in_progress: "An upload is already in progress. Wait a few minutes, then try again.",
  spam_check_failed: "Please wait a moment before submitting, then try again.",
  sign_in_failed:
    "Sign-in failed. Check your details and verify your email, or request a new link.",
  sign_in_required: "Sign in to continue.",
  service_unavailable:
    "The service is unavailable. Your form has not been submitted. Please try again.",
  try_later: "Too many requests. Please try again later.",
  invalid_password: "Use a password between 12 and 128 characters.",
  password_mfa_required:
    "Verify your authenticator code, then click Set new password again. Your entered password is still here.",
  password_unchanged: "Choose a different password. This is already your current password.",
  password_too_weak:
    "Choose a stronger password of 12 to 128 characters, including uppercase and lowercase letters, a number and a symbol. Avoid common or previously breached passwords.",
  password_reauthentication_required:
    "Request a fresh password reset link and open it in this browser before setting your password.",
  password_update_failed:
    "Your password could not be updated. Try again, or request a fresh reset link. Do not share your password with the team.",
  fresh_mfa_required: "Verify a fresh authenticator code to use administration.",
  invalid_transition:
    "This artwork has already changed status. Reload the review queue before making another decision.",
  invalid_reason: "Explain the decision in at least ten characters (up to 3000).",
  invalid_title: "Enter an artwork title of 1 to 200 characters.",
  invalid_alt: "Keep the image description to 300 characters or fewer.",
  invalid_action: "Choose a valid review decision.",
  invalid_id: "This review reference is missing. Open the artwork from the review queue.",
  invalid_audit_filter: "Check the audit dates and page number, then try again.",
  file_required:
    "This artwork is missing its processed image or preview, or still has an unprocessed original. Complete the upload processing before approval.",
  request_rejected: "Your form session expired. Try saving again; your entries are still here.",
  mfa_failed: "The authenticator code could not be verified. Try a new code.",
  invalid_file:
    "Use a valid, single-image JPEG or PNG up to 25 MB. SVG and executable files are not accepted.",
  tag_too_long: "Keep each tag to 30 characters or fewer.",
  too_many_tags: "Choose up to 10 tags.",
  invalid_tags: "Choose up to 10 tags, each 30 characters or fewer.",
  mail_delivery_pending:
    "Your message was saved, but email delivery is pending. You can retry without sending a duplicate.",
  publishing_not_ready:
    "Publication is not configured yet. Your review has not published the work.",
  public_storage_not_ready: "The public file hostname is not configured yet.",
  rebuild_failed:
    "Files were updated, but rebuilding the archive failed. Retry publication from administration.",
  network_error: "The network request failed. Check your connection and try again.",
  link_expired:
    "This email link has expired or was opened in a different browser. Request a new link.",
};
export const errorMessage = (code: string) =>
  errors[code] || "Please check the form and try again. If this continues, contact the team.";
let csrfRequest: Promise<string> | undefined;
let csrfIssued = 0;
export async function api<T = Record<string, unknown>>(
  path: string,
  data?: unknown,
  retry = true,
): Promise<T> {
  if (!csrfRequest || Date.now() - csrfIssued > 15 * 60000) {
    csrfIssued = Date.now();
    csrfRequest = fetch("/api/session", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "service_unavailable");
        return String(data.csrf);
      })
      .catch((error) => {
        csrfRequest = undefined;
        throw error;
      });
  }
  const csrf = await csrfRequest;
  const response = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    credentials: "same-origin",
    body: JSON.stringify(data ?? {}),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    if (result.error === "request_rejected") {
      csrfRequest = undefined;
      // CSRF is checked before mutations: exactly one fresh-token retry is safe.
      if (retry) return api<T>(path, data, false);
    }
    throw Object.assign(new Error(result.error || "service_unavailable"), {
      saved: result.saved,
      receipt: result.receipt,
    });
  }
  return result as T;
}
function useAction() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setFailure("");
    try {
      await action();
    } catch (error) {
      if (error instanceof Error && error.message === "fresh_mfa_required")
        window.dispatchEvent(new Event("redlark:reauth"));
      setFailure(t(errorMessage(error instanceof Error ? error.message : "network_error")));
    } finally {
      setBusy(false);
    }
  }
  return { busy, failure, run, clear: () => setFailure("") };
}
function Alert({ text }: { text: string }) {
  return text ? (
    <p className="notice failure" role="alert">
      ERROR {text}
    </p>
  ) : null;
}
export function AuthForm({
  mode,
}: {
  mode: "login" | "signup" | "forgot-password" | "reset-password";
}) {
  const router = useRouter();
  const { t, locale } = useI18n(),
    action = useAction();
  const form = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [inbox, setInbox] = useState(false),
    [reset, setReset] = useState(false);
  const [linkFailure, setLinkFailure] = useState(false);
  const [passwordMfa, setPasswordMfa] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordMode, setPasswordMode] = useState(
    mode === "reset-password" || mode === "forgot-password",
  );
  useEffect(() => {
    if (new URLSearchParams(location.search).get("error") === "link_expired") setLinkFailure(true);
  }, []);
  async function submit(
    event: FormEvent<HTMLFormElement>,
    magic = !passwordMode && (mode === "login" || mode === "signup"),
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const address = String(data.get("email") || "").trim(),
      password = String(data.get("password") || "");
    const next: Record<string, string> = {};
    if (mode !== "reset-password" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
      next.email = t("Enter a valid email address.");
    if (
      !magic &&
      mode !== "forgot-password" &&
      (password.length < (mode === "login" ? 1 : 12) || password.length > 128)
    )
      next.password = t("Use a password between 12 and 128 characters.");
    setFieldErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    await action.run(async () => {
      const path = magic
        ? mode === "signup"
          ? "signup-link"
          : "magic"
        : mode === "forgot-password"
          ? "forgot"
          : mode === "reset-password"
            ? "reset"
            : mode;
      try {
        await api(`auth/${path}`, { email: address, password, locale });
      } catch (error) {
        if (error instanceof Error && error.message === "password_mfa_required")
          setPasswordMfa(true);
        throw error;
      }
      if (mode === "reset-password") {
        setReset(true);
        window.dispatchEvent(new Event("redlark:session"));
      } else if (mode !== "login" || magic) {
        setInbox(true);
        router.push(`/${locale}/check-your-inbox/`);
      } else {
        window.dispatchEvent(new Event("redlark:session"));
        router.push(`/${locale}/account/`);
      }
    });
  }
  if (inbox)
    return (
      <section className="notice" role="status">
        <h2>{t("Check your inbox")}</h2>
        <p>
          {t(
            "If the address can receive this request, an email will arrive. Open the link in this browser. Check spam too. This response does not confirm whether an account exists.",
          )}
        </p>
        <Link className="button" href="/login">
          {t("Sign in")}
        </Link>
      </section>
    );
  if (reset)
    return (
      <p role="status">
        {t("Password updated. Sign in again on each device.")}{" "}
        <Link href="/login">{t("Sign in")}</Link>
      </p>
    );
  return (
    <>
      {passwordMfa && (
        <section aria-label={t("Verify before changing your password")}>
          <MfaPanel
            onVerified={() => {
              setPasswordMfa(false);
              action.clear();
              setPasswordNotice(t("Authenticator verified. Click Set new password to continue."));
              requestAnimationFrame(() =>
                form.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus(),
              );
            }}
          />
        </section>
      )}
      <form method="post" ref={form} className="handoff-form" noValidate onSubmit={submit}>
        <noscript>
          <p className="notice">
            {t("Enable JavaScript to use account forms. Form fields are never submitted in a URL.")}
          </p>
        </noscript>
        <p>
          {t(
            "Browsing, downloading, the Workshop and guest submissions need no account. An optional account lets you manage your contributions.",
          )}
        </p>
        {mode !== "reset-password" && (
          <label className="form-field" htmlFor="auth-email">
            {t("Email")}
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
            />
            {fieldErrors.email && (
              <span id="auth-email-error" className="field-error">
                {fieldErrors.email}
              </span>
            )}
          </label>
        )}
        {mode !== "forgot-password" && passwordMode && (
          <label className="form-field" htmlFor="auth-password">
            {t("Password")}
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "login" ? 1 : 12}
              maxLength={128}
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "auth-password-error" : undefined}
            />
            {fieldErrors.password && (
              <span id="auth-password-error" className="field-error">
                {fieldErrors.password}
              </span>
            )}
          </label>
        )}
        {!!Object.keys(fieldErrors).length && (
          <p role="alert">
            {t("Check the highlighted fields. Errors are written beside each field.")}
          </p>
        )}
        <Alert text={action.failure || (linkFailure ? t(errorMessage("link_expired")) : "")} />
        {passwordNotice && <p role="status">{passwordNotice}</p>}
        <button type="submit" className="button accent" disabled={action.busy}>
          {t(
            action.busy
              ? "Working…"
              : mode === "login"
                ? passwordMode
                  ? "Sign in"
                  : "Email me a sign-in link"
                : mode === "signup"
                  ? passwordMode
                    ? "Create account"
                    : "Create account with email link"
                  : mode === "forgot-password"
                    ? "Send reset link"
                    : "Set new password",
          )}
        </button>
        {(mode === "login" || mode === "signup") && (
          <>
            <button
              type="button"
              className="button"
              disabled={action.busy}
              onClick={() => {
                setPasswordMode((value) => !value);
                setFieldErrors({});
              }}
            >
              {t(passwordMode ? "Use an email link instead" : "Use a password instead")}
            </button>
            <Link href="/forgot-password">{t("Forgot password?")}</Link>
            {mode === "login" && <Link href="/signup">{t("Create a contributor account")}</Link>}
            <p>
              {t(
                "To add a password to an existing staff account, use Forgot password. Authenticator verification is still required for administration.",
              )}
            </p>
          </>
        )}
        {mode !== "login" && <Link href="/login">{t("Back to sign in")}</Link>}
        {mode === "reset-password" && (
          <Link href="/forgot-password">{t("Request a new reset link")}</Link>
        )}
      </form>
    </>
  );
}
export function MfaPanel({ onVerified }: { onVerified?: () => void } = {}) {
  const { t } = useI18n(),
    action = useAction();
  const [factor, setFactor] = useState(""),
    [secret, setSecret] = useState(""),
    [qrCode, setQrCode] = useState(""),
    [status, setStatus] = useState("");
  const [codeError, setCodeError] = useState("");
  useEffect(() => {
    let active = true;
    api<{ factors: { id: string; status: string }[] }>("auth/mfa/factors")
      .then((result) => {
        if (active) setFactor(result.factors.find((f) => f.status === "verified")?.id || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="backend-panel">
      <h2>{t("Account security")}</h2>
      <p>
        {t(
          "Admin verification lasts up to 24 hours in this signed-in browser. Signing out or using another browser requires verification again.",
        )}
      </p>
      <p>
        {t(
          "Administration requires TOTP and a fresh six-digit authenticator code. Your authenticator secret is shown only during setup.",
        )}
      </p>
      {!factor && (
        <button
          className="button"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              const result = await api<{ factorId: string; secret: string; qrCode: string }>(
                "auth/mfa/enroll",
              );
              setFactor(result.factorId);
              setSecret(result.secret);
              setQrCode(result.qrCode);
            })
          }
        >
          {t("Set up authenticator")}
        </button>
      )}
      {secret && (
        <div className="notice">
          {qrCode && (
            <Image
              src={qrCode}
              alt={t("Scan this QR code with your authenticator app.")}
              width={240}
              height={240}
              unoptimized
              style={{ maxWidth: "100%", height: "auto", background: "white" }}
            />
          )}
          <p id="mfa-setup-help">
            {t(
              "Add this setup key to your authenticator app, then verify a code. Do not share this key.",
            )}
          </p>
          <label className="form-field" htmlFor="mfa-setup-key">
            {t("Authenticator setup key")}
            <input
              id="mfa-setup-key"
              value={secret}
              readOnly
              spellCheck={false}
              autoComplete="off"
              aria-describedby="mfa-setup-help"
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        </div>
      )}
      {factor && (
        <form
          method="post"
          className="handoff-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const code = String(new FormData(event.currentTarget).get("code") || "");
            setCodeError("");
            if (!/^\d{6}$/.test(code)) {
              setCodeError(t("Enter a six-digit authenticator code."));
              requestAnimationFrame(() => document.getElementById("mfa-code")?.focus());
              return;
            }
            void action.run(async () => {
              await api("auth/mfa/verify", { factorId: factor, code });
              window.dispatchEvent(new Event("redlark:session"));
              setSecret("");
              setQrCode("");
              setStatus(t("Authenticator verified. You can return to administration."));
              onVerified?.();
            });
          }}
        >
          <label className="form-field" htmlFor="mfa-code">
            {t("Authenticator code")}
            <input
              id="mfa-code"
              ref={(input) => {
                if (input && onVerified) input.focus();
              }}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="0-9{6}"
              minLength={6}
              maxLength={6}
              required
              aria-invalid={!!codeError}
              aria-describedby={codeError ? "mfa-code-error" : undefined}
            />
            {codeError && (
              <span className="field-error" id="mfa-code-error" role="alert">
                {codeError}
              </span>
            )}
          </label>
          <button className="button" disabled={action.busy}>
            {t("Verify code")}
          </button>
        </form>
      )}
      <Alert text={action.failure} />
      <p role="status">{status}</p>
    </section>
  );
}
type Work = {
  guest_submissions?: {
    contact: string;
    upi: string;
    contact_public: boolean;
    upi_public: boolean;
  } | null;
  id: string;
  title: string;
  status: string;
  publication_state?: string;
  feedback: string;
  licence_id: string;
  ai_use: string;
  ai_disclosure: string;
  alt: string;
  consent_contact: string;
  consent_upi: string;
  caption: string;
  artist_name: string;
  titleOriginal?: string;
  source: string;
  tags: string[];
  format_slug: string;
  languages: string[];
  created_at?: string;
  submitted_at?: string | null;
  work_notifications?: { state: string }[];
  work_tags?: { tags: { label: string; custom: boolean } }[];
  work_categories?: { category_slug: string }[];
  work_files: { id: string; kind: string; mime: string; bytes: number; dpi: number }[];
};
type Profile = {
  artist_name: string;
  bio: string;
  contact: string;
  contact_public: boolean;
  upi: string;
  upi_public: boolean;
};
function ReviewImage({ work }: { work: Work }) {
  const preview = work.work_files.find((file) => file.kind === "preview");
  return preview ? (
    <Image
      className="review-image"
      src={"/api/preview/" + preview.id}
      alt={imageDescription(work)}
      width={600}
      height={840}
      unoptimized
    />
  ) : null;
}
export function AccountPanel({
  view = "dashboard",
}: {
  view?: "dashboard" | "profile" | "settings";
}) {
  const router = useRouter();
  const { t, locale } = useI18n(),
    action = useAction();
  const [loaded, setLoaded] = useState(false),
    [works, setWorks] = useState<Work[]>([]),
    [profile, setProfile] = useState<Profile | null>(null),
    [revision, setRevision] = useState(0),
    [deleting, setDeleting] = useState(false);
  const [accessFailure, setAccessFailure] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileNotice, setProfileNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    let live = true;
    api<{ works: Work[]; profile: Profile | null }>("account")
      .then((result) => {
        if (live) {
          setWorks(result.works);
          setProfile(result.profile);
          setLoaded(true);
        }
      })
      .catch((error) => {
        if (live) {
          setLoaded(true);
          setAccessFailure(errorMessage(error instanceof Error ? error.message : "network_error"));
        }
      });
    return () => {
      live = false;
    };
  }, [revision]);
  if (!loaded)
    return (
      <div className="content-width">
        <p role="status">{t("Loading account…")}</p>
      </div>
    );
  if (accessFailure)
    return (
      <section className="content-width">
        <p className="notice" role="alert">
          {t(accessFailure)}
        </p>
        <Link className="button accent" href="/login">
          {t("Sign in")}
        </Link>
        <Link className="button" href="/contribute">
          {t("Contribute without an account")}
        </Link>
      </section>
    );
  return (
    <div className="content-width account-layout">
      {view !== "profile" && (
        <section>
          {view === "dashboard" && (
            <>
              <h2>{t("My contributions")}</h2>
              {works.length === 0 && (
                <p role="status">{t("No contributions yet. Start with your first upload.")}</p>
              )}
              <Link className="button accent" href="/account/works/new">
                {t("Upload")}
              </Link>
              {!loaded && <p role="status">{t("Loading account…")}</p>}
              <p>
                {t("Only your contributions appear here. If your session expired, sign in again.")}{" "}
                <Link href="/login">{t("Sign in")}</Link>
              </p>
              {works.map((work) => (
                <article className="backend-panel" key={work.id}>
                  <h3>
                    <a href={`/${locale}/account/works/${work.id}/`}>{work.title}</a>
                  </h3>
                  <p>
                    <strong>
                      {t(
                        work.status === "pending"
                          ? "Pending review"
                          : work.status === "approved"
                            ? "Approved"
                            : work.status,
                      )}
                    </strong>{" "}
                    · {work.licence_id}
                  </p>
                  <p>
                    {(work.work_categories || [])
                      .map((c) =>
                        t(
                          categories.find((v) => v.slug === c.category_slug)?.label ||
                            c.category_slug,
                        ),
                      )
                      .join(" | ") || t("ALL (Uncategorized)")}
                  </p>
                  <p>{work.tags.map((tag) => t(tag)).join(" | ")}</p>
                  {work.feedback && (
                    <p>
                      {t("Review feedback")}: {work.feedback}
                    </p>
                  )}
                  <div className="button-row">
                    {work.work_files
                      .filter((f) => f.kind === "sanitized")
                      .map((f) => (
                        <button
                          className="button"
                          key={f.id}
                          onClick={() =>
                            action.run(async () => {
                              const file = await api<{ url: string }>("account/file", { id: f.id });
                              router.push(file.url);
                            })
                          }
                        >
                          {t("Download private file")}
                        </button>
                      ))}
                    {["draft", "changes_requested"].includes(work.status) && (
                      <a className="button" href={`/${locale}/account/works/${work.id}/`}>
                        {t("Prepare a revised submission")}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
          {view === "settings" && (
            <>
              <MfaPanel />
              <Alert text={action.failure} />
              <div className="button-row">
                <button
                  className="button"
                  onClick={() =>
                    action.run(async () => {
                      const data = await api("account/export");
                      const url = URL.createObjectURL(
                        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "redlark-account.json";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    })
                  }
                >
                  {t("Export account data")}
                </button>
                <button
                  className="button"
                  onClick={() =>
                    action.run(async () => {
                      await api("auth/logout");
                      window.dispatchEvent(new Event("redlark:session"));
                      router.push(`/${locale}/login/`);
                    })
                  }
                >
                  {t("Sign out everywhere")}
                </button>
                <button className="button" onClick={() => setDeleting((v) => !v)}>
                  {t("Delete account")}
                </button>
              </div>
              {deleting && (
                <form
                  method="post"
                  className="backend-panel handoff-form"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    const values = Object.fromEntries(new FormData(event.currentTarget));
                    setDeleteError("");
                    if (values.confirm !== "DELETE") {
                      setDeleteError(t("Type DELETE exactly to confirm account deletion."));
                      requestAnimationFrame(() =>
                        document.getElementById("delete-confirm")?.focus(),
                      );
                      return;
                    }
                    void action.run(async () => {
                      await api("account/delete", values);
                      window.dispatchEvent(new Event("redlark:session"));
                      router.push(`/${locale}/`);
                    });
                  }}
                >
                  <h2>{t("Delete account")}</h2>
                  <p>
                    {t(
                      "Choose whether published works are removed or remain anonymously. Downloaded copies and embedded artist credits cannot be recalled. Pending work and private files are removed.",
                    )}
                  </p>
                  <label className="form-field" htmlFor="delete-effect">
                    {t("Published works")}
                    <select id="delete-effect" name="effect">
                      <option value="remove">{t("Remove from the archive")}</option>
                      <option value="anonymise">{t("Keep anonymously")}</option>
                    </select>
                  </label>
                  <label className="form-field" htmlFor="delete-password">
                    {t("Current password (or verify TOTP above)")}
                    <input
                      id="delete-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="form-field" htmlFor="delete-confirm">
                    {t("Type DELETE to confirm")}
                    <input
                      id="delete-confirm"
                      name="confirm"
                      required
                      pattern="DELETE"
                      aria-invalid={!!deleteError}
                      aria-describedby={deleteError ? "delete-confirm-error" : undefined}
                    />
                    {deleteError && (
                      <span className="field-error" id="delete-confirm-error" role="alert">
                        {deleteError}
                      </span>
                    )}
                  </label>
                  <button className="button accent" disabled={action.busy}>
                    {t("Permanently delete account")}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}
      {view === "profile" && (
        <section className="backend-panel">
          <h2>{t("Artist profile")}</h2>
          <p>
            {t(
              "Pseudonyms are welcome. Contact and UPI are optional and private unless you explicitly consent to each field being public.",
            )}
          </p>
          <form
            method="post"
            key={profile?.artist_name || "new"}
            className="handoff-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const next: Record<string, string> = {};
              if (
                data.get("contact") &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("contact")))
              )
                next.contact = t("Enter a valid email address.");
              if (
                data.get("upi") &&
                !/^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z]{2,30}$/.test(String(data.get("upi")))
              )
                next.upi = t("Enter a valid UPI ID, or leave it blank.");
              setProfileErrors(next);
              setProfileNotice("");
              if (Object.keys(next).length) {
                requestAnimationFrame(() =>
                  document.getElementById(`profile-${Object.keys(next)[0]}`)?.focus(),
                );
                return;
              }
              void action.run(async () => {
                await api("account/profile", {
                  ...Object.fromEntries(data),
                  contact_public: data.has("contact_public"),
                  upi_public: data.has("upi_public"),
                });
                setRevision((v) => v + 1);
                setProfileNotice(t("Profile saved."));
              });
            }}
          >
            {(
              [
                ["artist_name", "Artist name"],
                ["bio", "Bio"],
                ["contact", "Contact email"],
                ["upi", "UPI ID"],
              ] as const
            ).map(([name, label]) => (
              <label className="form-field" key={name} htmlFor={`profile-${name}`}>
                {t(label)}
                <input
                  id={`profile-${name}`}
                  name={name}
                  type={name === "contact" ? "email" : "text"}
                  defaultValue={profile?.[name] || ""}
                  aria-invalid={!!profileErrors[name]}
                  aria-describedby={profileErrors[name] ? `profile-${name}-error` : undefined}
                />
                {profileErrors[name] && (
                  <span className="field-error" id={`profile-${name}-error`} role="alert">
                    {profileErrors[name]}
                  </span>
                )}
              </label>
            ))}
            {(
              [
                ["contact_public", "Allow my contact email to be public"],
                ["upi_public", "Allow my UPI ID to be public"],
              ] as const
            ).map(([name, label]) => (
              <label className="checkbox-field" key={name}>
                <input type="checkbox" name={name} defaultChecked={profile?.[name] || false} />
                {t(label)}
              </label>
            ))}
            <button className="button" disabled={action.busy}>
              {t("Save profile")}
            </button>
          </form>
          <Alert text={action.failure} />
          <p role="status">{profileNotice}</p>
        </section>
      )}
    </div>
  );
}
export function UploadPanel({
  onSaved,
  works = [],
  initialWork,
}: {
  onSaved?: () => void;
  works?: Work[];
  initialWork?: Work;
}) {
  const { t, locale } = useI18n(),
    action = useAction();
  const [status, setStatus] = useState("");
  const [access, setAccess] = useState<"loading" | "allowed" | "denied">("loading");
  const [guestMode, setGuestMode] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [restoredReceipt, setRestoredReceipt] = useState("");
  const [started] = useState(() => Date.now());
  const guestDraft = useRef<{ id: string; token: string } | null>(null);
  const [chosenFormat, setChosenFormat] = useState(initialWork?.format_slug || "poster-placard");
  const [completed, setCompleted] = useState(false);
  const [chosenLicence, setChosenLicence] = useState("CC0-1.0");
  const [uploadProfile, setUploadProfile] = useState<Profile | null>(null);
  const uploadForm = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <span className="field-error" id={"upload-" + name + "-error"}>
        ERROR {fieldErrors[name]}
      </span>
    ) : null;
  useEffect(() => {
    let live = true;
    const supplied = new URLSearchParams(location.search).get("format");
    if (formats.some((f) => f.slug === supplied)) setChosenFormat(supplied!);
    const restore = () => {
      const saved = new URLSearchParams(location.hash.slice(1)).get("submission");
      setRestoredReceipt(saved !== null ? saved || "invalid" : "");
    };
    restore();
    window.addEventListener("hashchange", restore);
    api<{ profile: Profile | null }>("account")
      .then((result) => {
        if (live) {
          setAccess("allowed");
          setUploadProfile(result.profile);
        }
      })
      .catch(() => {
        if (live) {
          setGuestMode(true);
          setAccess("allowed");
        }
      });
    return () => {
      live = false;
      window.removeEventListener("hashchange", restore);
    };
  }, []);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      file = data.get("file");
    if (file instanceof File && !String(data.get("title") || "").trim())
      data.set(
        "title",
        file.name.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ") || "Untitled contribution",
      );
    if (!String(data.get("format_slug") || "")) data.set("format_slug", "poster-placard");
    if (!data.getAll("languages").length) data.append("languages", "English");
    if (!String(data.get("ai_use") || "")) data.set("ai_use", "none");
    const next: Record<string, string> = {};
    let tags: string[] = [];
    try {
      tags = normalizeTags([...data.getAll("tags"), String(data.get("tag_pending") || "")]);
    } catch {
      next.tags = t("Choose up to 10 tags, each 30 characters or fewer.");
    }
    if (String(data.get("alt") || "").length > 300) next.alt = t("Use at most 300 characters.");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 25 * 1024 * 1024 ||
      !allowedUploadMimes.includes(uploadMime(file))
    )
      next.file = t(errorMessage("invalid_file"));
    if (data.get("contact") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("contact"))))
      next.contact = t("Enter a valid email address.");
    if (data.get("upi") && !/^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z]{2,30}$/.test(String(data.get("upi"))))
      next.upi = t("Enter a valid UPI ID, or leave it blank.");
    if (!data.has("permission"))
      next.permission = t("Confirm you have permission to share this work.");
    if (data.get("source") && !/^https:\/\//.test(String(data.get("source"))))
      next.source = t(
        "Provide an HTTPS source link, or leave it blank for your own original work.",
      );
    setFieldErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        uploadForm.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    await action.run(async () => {
      if (!(file instanceof File) || !file.size) throw new Error("invalid_file");
      if (!guestMode && (String(data.get("contact") || "") || String(data.get("upi") || ""))) {
        await api("account/profile", {
          artist_name: data.get("artist_name") || uploadProfile?.artist_name || "",
          bio: uploadProfile?.bio || "",
          contact: data.get("contact") || "",
          upi: data.get("upi") || "",
          contact_public: data.has("profile_contact_public"),
          upi_public: data.has("profile_upi_public"),
        });
      }
      const details = {
        ...Object.fromEntries(data),
        id: data.get("id") || undefined,
        languages: data.getAll("languages"),
        categories: data.getAll("categories"),
        tags,
        locale,
        permission: data.has("permission"),
        remixable: data.has("remixable"),
        contact_consent: data.has("contact_consent"),
        upi_consent: data.has("upi_consent"),
        started,
      };
      const created = guestMode
        ? guestDraft.current || (await api<{ id: string; token: string }>("guest/start", details))
        : await api<{ id: string }>("account/work", details);
      if (guestMode && "token" in created) {
        guestDraft.current = created as { id: string; token: string };
        setReceipt(`${location.origin}/${locale}/contribute/#submission=${created.token}`);
      }
      const token = guestDraft.current?.token;
      setStatus(t("Uploading privately…"));
      const signed = await api<{ id: string; url: string }>(
        guestMode ? "guest/sign" : "upload/sign",
        {
          token,
          work_id: created.id,
          mime: uploadMime(file),
          bytes: file.size,
        },
      );
      const sent = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": uploadMime(file) },
        body: file,
      });
      if (!sent.ok) throw new Error("network_error");
      setStatus(
        t(
          uploadMime(file).startsWith("image/")
            ? "Stripping image metadata and generating print files…"
            : "Sanitizing writing and generating a review preview…",
        ),
      );
      const processed = await api<{ warning: string | null; dpiA4?: number; dpiA2: number }>(
        guestMode ? "guest/complete" : "upload/complete",
        {
          token,
          id: signed.id,
        },
      );
      const submitted = await api<{ mailPending?: boolean }>(
        guestMode ? "guest/submit" : "account/submit",
        {
          token,
          id: created.id,
          contact_consent: data.has("contact_consent"),
          upi_consent: data.has("upi_consent"),
        },
      );
      track("upload-submitted");
      setStatus(
        `${submitted.mailPending ? t("Email delivery is pending. The action was saved and delivery will retry.") + " " : ""}${t("Submission saved for review.")}${processed.dpiA4 ? ` ${t("Estimated full-sheet resolution")}: A4 ${processed.dpiA4} DPI / A2 ${processed.dpiA2} DPI.` : ""}${processed.warning ? ` ${t("Resolution warning: the image may look soft at A2. No artificial resolution is promised.")}` : ""}`,
      );
      setChosenLicence(String(data.get("licence_id") || "CC0-1.0"));
      setCompleted(true);
      window.dispatchEvent(new Event("redlark:session"));
      onSaved?.();
    });
  }
  if (restoredReceipt) return <GuestSubmissionStatus token={restoredReceipt} />;
  if (access !== "allowed")
    return (
      <section className="backend-panel">
        <h2>{t("UPLOAD YOUR OWN ART AND DESIGN")}</h2>
        <p role="status">
          {t(
            access === "loading"
              ? "Checking your session…"
              : "Browsing, downloading, the Workshop and guest submissions need no account. An optional account lets you manage your contributions.",
          )}
        </p>
        {access !== "loading" && (
          <button
            className="button accent"
            onClick={() => {
              setGuestMode(true);
              setAccess("allowed");
            }}
          >
            {t("Contribute without an account")}
          </button>
        )}
        <Link className="button" href="/login">
          {t("Sign in")}
        </Link>
        <Link className="button" href="/contribute">
          {t("Contribute without an account")}
        </Link>
      </section>
    );
  if (completed)
    return (
      <section className="backend-panel" role="status">
        <h2>{t("Submission saved for review.")}</h2>
        <p>{status}</p>
        <p>
          {t("You chose:")} {t(licenceSummary(chosenLicence))}
        </p>
        <p>{t("Note: Your artwork will be featured after the website admin review")}</p>
        {guestMode ? (
          <GuestReceipt link={receipt} />
        ) : (
          <Link className="button" href="/account">
            {t("My contributions")}
          </Link>
        )}
      </section>
    );
  return (
    <section id="upload-work" className="backend-panel">
      <h2>{t("UPLOAD YOUR OWN ART AND DESIGN")}</h2>
      <p>
        {t(
          "Browsing, downloading, the Workshop and guest submissions need no account. An optional account lets you manage your contributions.",
        )}
      </p>
      <p>{t("Fill the details: (Recommended but not mandatory)")}</p>
      {guestMode && (
        <p>
          {t(
            "No account needed. Save your private submission link to check review status. Artist name and email are optional.",
          )}
        </p>
      )}
      {receipt && <GuestReceipt link={receipt} />}
      <form method="post" className="handoff-form quick-contribution" noValidate onSubmit={upload}>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <fieldset>
          <legend>{t("What are you sharing?")}</legend>
          <label className="form-field" htmlFor="quick-type">
            {t("Type")}
            <select id="quick-type" name="format_slug" defaultValue="poster-placard">
              {formats.map((format) => (
                <option value={format.slug} key={format.slug}>
                  {t(format.label)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field" htmlFor="quick-file">
            {t("Choose a file")}
            <input
              id="quick-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,text/plain,text/markdown,.md,.docx"
              required
              aria-invalid={!!fieldErrors.file}
              aria-describedby={fieldErrors.file ? "upload-file-error" : undefined}
            />
            {fieldError("file")}
          </label>
          <input type="hidden" name="licence_id" value="CC0-1.0" />
          <input type="hidden" name="ai_use" value="none" />
          <p>
            {t(
              "Quick contributions use CC0: anyone may use them for any purpose. Staff will flag missing details for review.",
            )}
          </p>
          <p>{t("Images: JPEG or PNG. Writing: TXT, Markdown or DOCX, up to 25 MB.")}</p>
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="permission"
              required
              aria-invalid={!!fieldErrors.permission}
              aria-describedby={fieldErrors.permission ? "upload-permission-error" : undefined}
            />
            {t("I have the right to share this work and agree to the site licence terms.")}
          </label>
          {fieldError("permission")}
          <button className="button accent" disabled={action.busy}>
            {t(action.busy ? "Working…" : "Contribute")}
          </button>
        </fieldset>
      </form>
      <details className="optional-contribution-details">
        <summary>{t("Add details (optional)")}</summary>
        <p>
          {t(
            "Use this form to add credit, licence, language, categories, description and contact choices before uploading.",
          )}
        </p>
        <form
          method="post"
          key={initialWork?.id || "new"}
          ref={uploadForm}
          className="handoff-form"
          noValidate
          onSubmit={upload}
        >
          <label className="honeypot" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          {initialWork && <input type="hidden" name="id" value={initialWork.id} />}
          {works.some((w) => ["draft", "changes_requested"].includes(w.status)) && (
            <label className="form-field" htmlFor="upload-id">
              {t("Revise an existing draft")}
              <select id="upload-id" name="id">
                <option value="">{t("New contribution")}</option>
                {works
                  .filter((w) => ["draft", "changes_requested"].includes(w.status))
                  .map((w) => (
                    <option value={w.id} key={w.id}>
                      {w.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {(
            [
              ["title", "Title", false],
              ["artist_name", "Artist name", false],
              ["caption", "Caption", false],
              ["source", "Source URL (optional for your own original work)", false],
            ] as const
          ).map(([name, label, required]) => (
            <label className="form-field" htmlFor={`upload-${name}`} key={name}>
              {t(label)}
              {required ? ` (${t("required")})` : ""}
              <input
                id={`upload-${name}`}
                name={name}
                type={name === "source" ? "url" : "text"}
                defaultValue={
                  initialWork?.[name] ||
                  (name === "artist_name" ? uploadProfile?.artist_name : "") ||
                  ""
                }
                aria-invalid={!!fieldErrors[name]}
                aria-describedby={fieldErrors[name] ? "upload-" + name + "-error" : undefined}
                required={required}
              />
              {fieldError(name)}
            </label>
          ))}
          {(
            [
              ["contact", "Contact"],
              ["upi", "UPI ID"],
            ] as const
          ).map(([name, label]) => (
            <label className="form-field" htmlFor={`upload-${name}`} key={name}>
              {t(label)} ({t("Recommended but not mandatory")})
              <input
                id={`upload-${name}`}
                name={name}
                type={name === "contact" ? "email" : "text"}
                defaultValue={uploadProfile?.[name] || ""}
                aria-invalid={!!fieldErrors[name]}
                aria-describedby={fieldErrors[name] ? `upload-${name}-error` : undefined}
              />
              {fieldError(name)}
            </label>
          ))}
          {!guestMode && (
            <>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="profile_contact_public"
                  defaultChecked={uploadProfile?.contact_public || false}
                />
                {t("Allow my contact email to be public")}
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="profile_upi_public"
                  defaultChecked={uploadProfile?.upi_public || false}
                />
                {t("Allow my UPI ID to be public")}
              </label>
            </>
          )}
          <label className="form-field" htmlFor="upload-format">
            {t("Type")}
            <select
              id="upload-format"
              name="format_slug"
              value={chosenFormat}
              onChange={(event) => setChosenFormat(event.target.value)}
            >
              {formats.map((f) => (
                <option value={f.slug} key={f.slug}>
                  {t(f.label)}
                </option>
              ))}
            </select>
          </label>
          <DescriptionField inputId="upload-alt" initial={initialWork?.alt} />
          <TagsField initial={initialWork?.tags} />
          {fieldError("tags")}
          <LicenceField initial={initialWork?.licence_id} />
          <fieldset aria-describedby={fieldErrors.languages ? "upload-languages-error" : undefined}>
            <legend>{t("Languages (required)")}</legend>
            {["English", "Hindi", "Bengali", "Malayalam"].map((l) => (
              <label className="checkbox-field" key={l}>
                <input
                  type="checkbox"
                  name="languages"
                  value={l}
                  defaultChecked={initialWork ? initialWork.languages.includes(l) : l === "English"}
                  aria-invalid={!!fieldErrors.languages}
                  aria-describedby={fieldErrors.languages ? "upload-languages-error" : undefined}
                />
                {t(l)}
              </label>
            ))}
            {fieldError("languages")}
          </fieldset>
          <CategoriesField
            initial={(initialWork?.work_categories || []).map((c) => c.category_slug)}
          />
          <label className="form-field" htmlFor="upload-ai">
            {t("AI-use declaration")}
            <select id="upload-ai" name="ai_use" defaultValue={initialWork?.ai_use || "none"}>
              <option value="none">{t("None")}</option>
              <option value="minimal-assisted">{t("Minimal-assisted")}</option>
              <option value="generated">{t("Generated")}</option>
            </select>
          </label>
          <label className="form-field" htmlFor="upload-ai-disclosure">
            {t("Explain any AI use")}
            <textarea
              id="upload-ai-disclosure"
              name="ai_disclosure"
              maxLength={2000}
              defaultValue={initialWork?.ai_disclosure || ""}
            />
          </label>
          <label className="form-field" htmlFor="upload-file">
            {t("JPEG, PNG, TXT, Markdown or DOCX, maximum 25 MB")}
            <input
              id="upload-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,text/plain,text/markdown,.md,.docx"
              required
              aria-invalid={!!fieldErrors.file}
              aria-describedby={fieldErrors.file ? "upload-file-error" : undefined}
            />
            {fieldError("file")}
          </label>
          <p>
            {t(
              "Uploads are private until review. Image EXIF/GPS metadata is stripped; writing files are converted to plain text without document markup. A4/A2 print PDFs and a WebP preview are generated. Low resolution produces a warning, not a rejection.",
            )}
          </p>
          <label className="checkbox-field">
            <input type="checkbox" name="contact_consent" />
            {t("Publish my consented profile contact with this work")}
          </label>
          <label className="checkbox-field">
            <input type="checkbox" name="upi_consent" />
            {t("Publish my consented profile UPI with this work")}
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="permission"
              required
              aria-invalid={!!fieldErrors.permission}
              aria-describedby={fieldErrors.permission ? "upload-permission-error" : undefined}
            />
            {fieldError("permission")}
            {t(
              "I created this work or have explicit permission to share it. Publication requires review.",
            )}
          </label>
          {!!Object.keys(fieldErrors).length && (
            <p role="alert">
              {t("Check the highlighted fields. Errors are written beside each field.")}
            </p>
          )}
          <Alert text={action.failure} />
          <p role="status" aria-live="polite">
            {status}
          </p>
          <button className="button accent" disabled={action.busy}>
            {t(action.busy ? "Working…" : "Upload")}
          </button>
          <p>{t("Note: Your artwork will be featured after the website admin review")}</p>
        </form>
      </details>
    </section>
  );
}
function GuestReceipt({ link }: { link: string }) {
  const { t } = useI18n();
  const [notice, setNotice] = useState("");
  return (
    <div className="notice">
      <p>
        {t(
          "Keep this link private. Anyone with it can read your submission status and review feedback. It expires after 90 days. It cannot edit your work.",
        )}
      </p>
      <label className="form-field">
        {t("Private submission link")}
        <input
          value={link}
          readOnly
          autoComplete="off"
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>
      <button
        className="button"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setNotice(t("Link copied."));
          } catch {
            setNotice(t("Select and copy the link above."));
          }
        }}
      >
        {t("Copy private link")}
      </button>
      <a className="button" href={link}>
        {t("Check submission status")}
      </a>
      <p role="status">{notice}</p>
    </div>
  );
}
function GuestSubmissionStatus({ token }: { token: string }) {
  const { t } = useI18n();
  const action = useAction();
  const [result, setResult] = useState<{
    title: string;
    status: string;
    feedback: string;
    slug: string | null;
    expiresAt: string;
  } | null>(null);
  const loaded = useRef("");
  const refresh = useCallback(async () => {
    await action.run(async () => setResult(await api("guest/status", { token })));
  }, [action, token]);
  useEffect(() => {
    if (/^[A-Za-z0-9_-]{43}$/.test(token) && loaded.current !== token) {
      loaded.current = token;
      setResult(null);
      void refresh();
    }
  }, [refresh, token]);
  return (
    <section className="backend-panel">
      <h2>{t("Submission status")}</h2>
      {result && (
        <>
          <h3>{result.title}</h3>
          <p>
            {t("Status")}: {t(result.status)}
          </p>
          {result.feedback && (
            <p>
              {t("Admin feedback")}: {result.feedback}
            </p>
          )}
          {result.slug && (
            <Link className="button" href={`/poster/${result.slug}`}>
              {t("View published work")}
            </Link>
          )}
          <p>
            {t(
              "This link is read-only. Contact the team with your work title if you need to revise or remove it.",
            )}
          </p>
        </>
      )}
      <Alert
        text={
          /^[A-Za-z0-9_-]{43}$/.test(token)
            ? action.failure
            : t(errorMessage("submission_unavailable"))
        }
      />
      <button
        className="button"
        disabled={action.busy || !/^[A-Za-z0-9_-]{43}$/.test(token)}
        onClick={refresh}
      >
        {t(action.busy ? "Working…" : "Refresh status")}
      </button>
      <a className="button" href="?new=1">
        {t("New contribution")}
      </a>
    </section>
  );
}
export function AdminPanel({
  view = "queue",
}: {
  view?: "queue" | "review" | "messages" | "users" | "audit";
}) {
  const router = useRouter();
  const { t, locale } = useI18n(),
    action = useAction();
  const [works, setWorks] = useState<Work[]>([]),
    [notice, setNotice] = useState("");
  const [records, setRecords] = useState<unknown>(null);
  const [reauth, setReauth] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [access, setAccess] = useState<"loading" | "denied" | "mfa" | "allowed">("loading");
  useEffect(() => {
    let live = true;
    const refresh = () => {
      fetch("/api/session", { cache: "no-store" })
        .then(async (response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (live && !data?.account) {
            router.replace(`/${locale}/login/?next=${encodeURIComponent(location.pathname)}`);
            return;
          }
          if (live)
            setAccess(
              !data?.account?.admin
                ? "denied"
                : data.account.fresh && data.account.aal2
                  ? "allowed"
                  : "mfa",
            );
          if (live && data?.account?.fresh && data.account.aal2) setReauth(false);
        })
        .catch(() => {
          if (live) setAccess("denied");
        });
    };
    refresh();
    const requestReauth = () => setReauth(true);
    window.addEventListener("redlark:reauth", requestReauth);
    window.addEventListener("redlark:session", refresh);
    return () => {
      window.removeEventListener("redlark:session", refresh);
      window.removeEventListener("redlark:reauth", requestReauth);
      live = false;
    };
  }, [locale, router]);
  async function load() {
    await action.run(async () => {
      const result = await api<{ works: Work[] }>("admin/queue");
      setWorks(result.works);
      setNotice(t("Review queue loaded."));
    });
  }
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (access !== "allowed") return;
    if (view === "review") setSelectedId(location.pathname.split("/").filter(Boolean).at(-1) || "");
    void action.run(async () => {
      if (view === "queue" || view === "review") {
        const result = await api<{ works: Work[] }>("admin/queue");
        setWorks(result.works);
      } else setRecords(await api(`admin/${view === "messages" ? "inbox" : view}`));
    });
    // The view is fixed by the static route; server authorization is checked for every request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, access]);
  if (access === "loading")
    return (
      <p className="content-width" role="status">
        {t("Checking your session…")}
      </p>
    );
  if (access === "denied")
    return (
      <section className="content-width">
        <p role="alert">{t("You don't have admin access")}</p>
        <Link className="button" href="/">
          {t("Home")}
        </Link>
      </section>
    );
  if (access === "mfa")
    return (
      <section className="content-width">
        <MfaPanel />
      </section>
    );
  return (
    <div className="content-width">
      {reauth && (
        <section aria-label={t("Verify your session")} className="notice">
          <p role="alert">
            {t("Your review is still here. Verify an authenticator code below, then save again.")}
          </p>
          <MfaPanel />
        </section>
      )}
      <nav className="button-row" aria-label={t("Administration")}>
        <Link href="/admin/review">{t("Review queue")}</Link>
        <Link href="/admin/messages">{t("Messages")}</Link>
        <Link href="/admin/users">{t("Contributors")}</Link>
        <Link href="/admin/audit">{t("Audit log")}</Link>
      </nav>
      {(view === "queue" || view === "review") && (
        <div className="button-row">
          <button className="button accent" onClick={load} disabled={action.busy}>
            {t("Load review queue")}
          </button>
          <button
            className="button"
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await api("admin/rebuild");
                setNotice(t("Archive rebuild requested."));
              })
            }
          >
            {t("Retry archive build")}
          </button>
        </div>
      )}
      <Alert text={action.failure} />
      <p role="status">{notice}</p>
      {records !== null && (
        <AdminRecords
          records={records}
          view={view}
          onFilter={async (filters) => {
            await action.run(async () => setRecords(await api("admin/audit", filters)));
          }}
        />
      )}
      {records !== null && view === "messages" && (
        <form
          method="post"
          className="handoff-form backend-panel"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void action.run(async () => {
              await api(data.get("operation") === "retry" ? "admin/retry-mail" : "admin/message", {
                id: data.get("id"),
              });
              setNotice(t("Inbox action saved."));
            });
          }}
        >
          <label className="form-field" htmlFor="admin-message-reference">
            {t("Message reference")}
            <input id="admin-message-reference" name="id" required pattern="[a-f0-9-]{36}" />
          </label>
          <label className="form-field" htmlFor="admin-message-action">
            {t("Action")}
            <select id="admin-message-action" name="operation">
              <option value="resolve">{t("Mark resolved")}</option>
              <option value="retry">{t("Retry failed mail")}</option>
            </select>
          </label>
          <button className="button" disabled={action.busy}>
            {t("Apply inbox action")}
          </button>
        </form>
      )}
      {view === "queue" && (
        <label className="form-field" htmlFor="review-status">
          {t("Filter by status")}
          <select
            id="review-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["pending", "changes_requested", "rejected", "approved", "all"].map((v) => (
              <option key={v} value={v}>
                {t(v === "pending" ? "Pending review" : v === "all" ? "All" : v)}
              </option>
            ))}
          </select>
        </label>
      )}
      {view === "queue" && (
        <p role="status">
          {works.filter((work) => statusFilter === "all" || work.status === statusFilter).length}{" "}
          {t("contributions")}
        </p>
      )}
      {works
        .filter(
          (work) => view !== "queue" || statusFilter === "all" || work.status === statusFilter,
        )
        .filter((work) => view !== "review" || work.id === selectedId)
        .map((work) => (
          <article
            key={work.id}
            className={view === "queue" ? "backend-panel review-queue-row" : "backend-panel"}
          >
            <h2>
              <a href={`/${locale}/admin/review/${work.id}/`}>{work.title}</a>
            </h2>
            <p>
              {t(work.status)} | {work.licence_id} | {t("AI-use declaration")}: {work.ai_use}
            </p>
            <ReviewImage work={work} />
            <p>
              {work.artist_name} |{" "}
              {t(formats.find((f) => f.slug === work.format_slug)?.label || work.format_slug)} |{" "}
              {work.submitted_at || work.created_at
                ? t(work.submitted_at ? "Submitted:" : "Created:") + " "
                : ""}
              {work.submitted_at || work.created_at
                ? new Date(work.submitted_at || work.created_at!)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 16) + " UTC"
                : ""}
            </p>
            <p>{t(licenceSummary(work.licence_id))}</p>
            {work.work_notifications?.some((job) => job.state !== "sent") && (
              <p className="notice">
                {t("Email delivery is pending. The action was saved and delivery will retry.")}
              </p>
            )}
            {work.work_notifications?.some((job) => job.state === "failed") && (
              <button
                type="button"
                className="button"
                disabled={action.busy}
                onClick={() =>
                  action.run(async () => {
                    const result = await api<{ mailPending: boolean }>("admin/retry-work-mail", {
                      id: work.id,
                    });
                    setNotice(
                      t(
                        result.mailPending
                          ? "Email delivery is pending. The action was saved and delivery will retry."
                          : "Notification sent.",
                      ),
                    );
                    const queue = await api<{ works: Work[] }>("admin/queue");
                    setWorks(queue.works);
                  })
                }
              >
                {t("Retry failed notification")}
              </button>
            )}
            <p>
              {(work.work_categories || [])
                .map((c) =>
                  t(categories.find((v) => v.slug === c.category_slug)?.label || c.category_slug),
                )
                .join(" | ") || t("ALL (Uncategorized)")}
            </p>
            <p>
              {(work.work_tags || []).map((tag) => (
                <span key={tag.tags.label}>
                  {t(tag.tags.label)}
                  {tag.tags.custom ? " [" + t("custom") + "]" : ""} |{" "}
                </span>
              ))}
            </p>
            {view === "queue" && (
              <a className="button accent" href={`/${locale}/admin/review/${work.id}/`}>
                {t("Review contribution")}
              </a>
            )}
            {view === "review" && ["pending", "changes_requested"].includes(work.status) && (
              <form
                method="post"
                className="handoff-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void action.run(async () => {
                    await api("admin/metadata", {
                      id: work.id,
                      title: data.get("title"),
                      alt: data.get("alt"),
                      format_slug: data.get("format_slug"),
                      categories: data.getAll("categories"),
                      tags: data.getAll("tags"),
                    });
                    setNotice(t("Metadata saved."));
                    const result = await api<{ works: Work[] }>("admin/queue");
                    setWorks(result.works);
                  });
                }}
              >
                <label className="form-field" htmlFor={"review-title-" + work.id}>
                  {t("Title")}
                  <input
                    id={"review-title-" + work.id}
                    name="title"
                    required
                    maxLength={200}
                    defaultValue={work.title}
                  />
                </label>
                <DescriptionField initial={work.alt} fallback={work} />
                <label className="form-field" htmlFor={"review-format-" + work.id}>
                  {t("Choose type")}
                  <select
                    id={"review-format-" + work.id}
                    name="format_slug"
                    defaultValue={work.format_slug}
                  >
                    {formats.map((f) => (
                      <option key={f.slug} value={f.slug}>
                        {t(f.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <CategoriesField
                  initial={(work.work_categories || []).map((c) => c.category_slug)}
                />
                <TagsField initial={work.tags} />
                <p>
                  {t(
                    "Remove a custom tag and add the preferred spelling to merge or rename it for this work.",
                  )}
                </p>
                <button className="button" disabled={action.busy}>
                  {t("Save metadata")}
                </button>
              </form>
            )}
            <p>{work.ai_disclosure}</p>
            {work.feedback && (
              <p>
                {t("Review feedback")}: {work.feedback}
              </p>
            )}
            {work.guest_submissions && (
              <div className="notice">
                <p>
                  {t(
                    "Guest submission. Contact details below are private to the review team unless separately consented for publication.",
                  )}
                </p>
                <p>
                  {t("Contact")}: {work.guest_submissions.contact || t("Not supplied")}
                </p>
                <p>
                  {t("UPI ID")}: {work.guest_submissions.upi || t("Not supplied")}
                </p>
              </div>
            )}
            <p>
              {t("Contact consent")}: {work.consent_contact || t("Private")}; {t("UPI consent")}:{" "}
              {work.consent_upi || t("Private")}
            </p>
            <div className="button-row">
              {work.work_files.map((file) => (
                <button
                  className="button"
                  key={file.id}
                  onClick={() =>
                    action.run(async () => {
                      const result = await api<{ url: string }>("admin/file", { id: file.id });
                      router.push(result.url);
                    })
                  }
                >
                  {t("Review file")}: {file.kind}
                </button>
              ))}
            </div>
            {view === "review" && ["pending", "approved", "taken_down"].includes(work.status) && (
              <form
                method="post"
                className="handoff-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void action.run(async () => {
                    const reason = String(data.get("reason") || "").trim();
                    if (data.get("action") !== "approve" && reason.length < 10) {
                      setReviewErrors((previous) => ({
                        ...previous,
                        [work.id]: t("Explain the decision in at least ten characters."),
                      }));
                      requestAnimationFrame(() =>
                        document.getElementById(`reason-${work.id}`)?.focus(),
                      );
                      return;
                    }
                    setReviewErrors((previous) => ({ ...previous, [work.id]: "" }));
                    const decision = await api<{ mailPending?: boolean }>("admin/review", {
                      id: work.id,
                      ...Object.fromEntries(data),
                    });
                    window.dispatchEvent(new Event("redlark:session"));
                    setNotice(
                      t("Review saved. Approved publication may take a few minutes to rebuild.") +
                        (decision.mailPending
                          ? " " +
                            t(
                              "Email delivery is pending. The action was saved and delivery will retry.",
                            )
                          : ""),
                    );
                    const result = await api<{ works: Work[] }>("admin/queue");
                    setWorks(result.works);
                  });
                }}
              >
                <label className="form-field" htmlFor={`review-action-${work.id}`}>
                  {t("Decision")}
                  <select id={`review-action-${work.id}`} name="action">
                    {(work.status === "pending" ||
                      (work.status === "approved" && work.publication_state === "failed")) && (
                      <option value="approve">{t("Approve")}</option>
                    )}
                    {work.status === "pending" && (
                      <>
                        <option value="changes_requested">{t("Request changes")}</option>
                        <option value="rejected">{t("Reject")}</option>
                      </>
                    )}
                    {["approved", "taken_down"].includes(work.status) && (
                      <option value="taken_down">{t("Take down")}</option>
                    )}
                  </select>
                </label>
                <label className="form-field" htmlFor={`reason-${work.id}`}>
                  {t("Reason (required except for approval)")}
                  <textarea
                    id={`reason-${work.id}`}
                    name="reason"
                    maxLength={3000}
                    aria-invalid={!!reviewErrors[work.id]}
                    aria-describedby={reviewErrors[work.id] ? `reason-${work.id}-error` : undefined}
                  />
                  {reviewErrors[work.id] && (
                    <span className="field-error" id={`reason-${work.id}-error`} role="alert">
                      {reviewErrors[work.id]}
                    </span>
                  )}
                </label>
                <button className="button accent" disabled={action.busy}>
                  {t("Save decision")}
                </button>
              </form>
            )}
          </article>
        ))}
    </div>
  );
}
