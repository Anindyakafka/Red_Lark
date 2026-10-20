"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useI18n } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import Image from "next/image";
import categories from "../../content/categories.json";
import formats from "../../content/formats.json";
import { AdminRecords } from "./admin-records";

const errors: Record<string, string> = {
  sign_in_failed:
    "Sign-in failed. Check your details and verify your email, or request a new link.",
  sign_in_required: "Sign in to continue.",
  service_unavailable:
    "The service is unavailable. Your form has not been submitted. Please try again.",
  try_later: "Too many requests. Please try again later.",
  invalid_password: "Use a password between 12 and 128 characters.",
  fresh_mfa_required: "Verify a fresh authenticator code to use administration.",
  mfa_failed: "The authenticator code could not be verified. Try a new code.",
  invalid_file:
    "Use a valid, single-image JPEG or PNG up to 25 MB. SVG and executable files are not accepted.",
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
export async function api<T = Record<string, unknown>>(path: string, data?: unknown): Promise<T> {
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
    if (result.error === "request_rejected") csrfRequest = undefined;
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
      setFailure(t(errorMessage(error instanceof Error ? error.message : "network_error")));
    } finally {
      setBusy(false);
    }
  }
  return { busy, failure, run };
}
function Alert({ text }: { text: string }) {
  return text ? (
    <p className="notice failure" role="alert">
      [ERROR] {text}
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
      await api(`auth/${path}`, { email: address, password, locale });
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
    <form ref={form} className="handoff-form" noValidate onSubmit={submit}>
      <p>
        {t(
          "Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account.",
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
      <button className="button accent" disabled={action.busy}>
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
        </>
      )}
      {mode !== "login" && <Link href="/login">{t("Back to sign in")}</Link>}
    </form>
  );
}
export function MfaPanel() {
  const { t } = useI18n(),
    action = useAction();
  const [factor, setFactor] = useState(""),
    [secret, setSecret] = useState(""),
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
          "Administration requires TOTP and a fresh six-digit authenticator code. Your authenticator secret is shown only during setup.",
        )}
      </p>
      {!factor && (
        <button
          className="button"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              const result = await api<{ factorId: string; secret: string }>("auth/mfa/enroll");
              setFactor(result.factorId);
              setSecret(result.secret);
            })
          }
        >
          {t("Set up authenticator")}
        </button>
      )}
      {secret && (
        <p className="notice">
          {t(
            "Add this setup key to your authenticator app, then verify a code. Do not share this key.",
          )}{" "}
          <code className="break-all">{secret}</code>
        </p>
      )}
      {factor && (
        <form
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
              setSecret("");
              setStatus(t("Authenticator verified. You can return to administration."));
            });
          }}
        >
          <label className="form-field" htmlFor="mfa-code">
            {t("Authenticator code")}
            <input
              id="mfa-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
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
  id: string;
  title: string;
  status: string;
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
      alt={work.alt}
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
        <Link className="button" href="/signup">
          {t("Create a contributor account")}
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
                    <strong>{t(work.status)}</strong> · {work.licence_id}
                  </p>
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
  const { t } = useI18n(),
    action = useAction();
  const [status, setStatus] = useState("");
  const [access, setAccess] = useState<"loading" | "allowed" | "denied">("loading");
  const [chosenFormat, setChosenFormat] = useState(initialWork?.format_slug || "poster-placard");
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [uploadProfile, setUploadProfile] = useState<Profile | null>(null);
  const uploadForm = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <span className="field-error" id={"upload-" + name + "-error"}>
        [ERROR] {fieldErrors[name]}
      </span>
    ) : null;
  useEffect(() => {
    let live = true;
    const supplied = new URLSearchParams(location.search).get("format");
    if (formats.some((f) => f.slug === supplied)) setChosenFormat(supplied!);
    api<{ profile: Profile | null }>("account")
      .then((result) => {
        if (live) {
          setAccess("allowed");
          setUploadProfile(result.profile);
        }
      })
      .catch(() => {
        if (live) setAccess("denied");
      });
    return () => {
      live = false;
    };
  }, []);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      file = data.get("file");
    const next: Record<string, string> = {};
    if (!String(data.get("title") || "").trim()) next.title = t("Enter a title.");
    if (String(data.get("alt") || "").trim().length < 15)
      next.alt = t("Use at least 15 characters to describe what the image shows.");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 25 * 1024 * 1024 ||
      !["image/jpeg", "image/png"].includes(file.type)
    )
      next.file = t(errorMessage("invalid_file"));
    if (data.get("contact") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("contact"))))
      next.contact = t("Enter a valid email address.");
    if (data.get("upi") && !/^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z]{2,30}$/.test(String(data.get("upi"))))
      next.upi = t("Enter a valid UPI ID, or leave it blank.");
    if (!data.has("permission"))
      next.permission = t("Confirm you have permission to share this work.");
    if (!data.getAll("languages").length) next.languages = t("Choose at least one language.");
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
      if (String(data.get("contact") || "") || String(data.get("upi") || "")) {
        await api("account/profile", {
          artist_name: data.get("artist_name") || uploadProfile?.artist_name || "",
          bio: uploadProfile?.bio || "",
          contact: data.get("contact") || "",
          upi: data.get("upi") || "",
          contact_public: data.has("profile_contact_public"),
          upi_public: data.has("profile_upi_public"),
        });
      }
      const created = await api<{ id: string }>("account/work", {
        ...Object.fromEntries(data),
        id: data.get("id") || undefined,
        languages: data.getAll("languages"),
        categories: data.getAll("categories"),
        permission: data.has("permission"),
        remixable: data.has("remixable"),
      });
      setStatus(t("Uploading privately…"));
      const signed = await api<{ id: string; url: string }>("upload/sign", {
        work_id: created.id,
        mime: file.type,
        bytes: file.size,
      });
      const sent = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!sent.ok) throw new Error("network_error");
      setStatus(t("Stripping image metadata and generating print files…"));
      const processed = await api<{ warning: string | null; dpiA4?: number; dpiA2: number }>(
        "upload/complete",
        {
          id: signed.id,
        },
      );
      await api("account/submit", {
        id: created.id,
        contact_consent: data.has("contact_consent"),
        upi_consent: data.has("upi_consent"),
      });
      track("upload-submitted");
      setStatus(
        `${t("Submission saved for review.")}${processed.dpiA4 ? ` ${t("Estimated full-sheet resolution")}: A4 ${processed.dpiA4} DPI / A2 ${processed.dpiA2} DPI.` : ""}${processed.warning ? ` ${t("Resolution warning: the image may look soft at A2. No artificial resolution is promised.")}` : ""}`,
      );
      setCompleted(true);
      onSaved?.();
    });
  }
  if (access !== "allowed")
    return (
      <section className="backend-panel">
        <h2>{t("UPLOAD YOUR OWN ART AND DESIGN")}</h2>
        <p role="status">
          {t(
            access === "loading"
              ? "Checking your session…"
              : "Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account.",
          )}
        </p>
        <Link className="button accent" href="/login">
          {t("Sign in")}
        </Link>
        <Link className="button" href="/signup">
          {t("Create a contributor account")}
        </Link>
      </section>
    );
  if (completed)
    return (
      <section className="backend-panel" role="status">
        <h2>{t("Submission saved for review.")}</h2>
        <p>{status}</p>
        <p>{t("Note: Your artwork will be featured after the website admin review")}</p>
        <Link className="button" href="/account">
          {t("My contributions")}
        </Link>
      </section>
    );
  return (
    <section id="upload-work" className="backend-panel">
      <h2>{t("UPLOAD YOUR OWN ART AND DESIGN")}</h2>
      <p>
        {t(
          "Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account.",
        )}{" "}
        <Link href="/login">{t("Sign in")}</Link>
      </p>
      <p>{t("Fill the details: (Recommended but not mandatory)")}</p>
      <ol className="wizard-steps">
        <li aria-current={step === 0 ? "step" : undefined}>{t("Choose format")}</li>
        <li aria-current={step === 1 ? "step" : undefined}>{t("Fill the details:")}</li>
        <li>{t("Upload")}</li>
      </ol>
      {step === 0 && (
        <div className="format-picker">
          {formats.map((format) => (
            <button
              key={format.slug}
              className="button"
              onClick={() => {
                setChosenFormat(format.slug);
                setStep(1);
              }}
            >
              {t(format.label)}
            </button>
          ))}
        </div>
      )}
      <form
        hidden={step === 0}
        key={initialWork?.id || chosenFormat}
        ref={uploadForm}
        className="handoff-form"
        noValidate
        onSubmit={upload}
      >
        {initialWork && <input type="hidden" name="id" value={initialWork.id} />}
        <button type="button" className="button" onClick={() => setStep(0)}>
          {t("Choose format")}
        </button>
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
            ["title", "Title", true],
            ["artist_name", "Artist name", false],
            ["alt", "Describe the image for someone who cannot see it", true],
            ["caption", "Caption", false],
            ["source", "Source URL (optional for your own original work)", false],
            ["tags", "Tags (comma separated)", false],
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
                name === "tags"
                  ? initialWork?.tags.join(", ")
                  : initialWork?.[name] ||
                    (name === "artist_name" ? uploadProfile?.artist_name : "") ||
                    ""
              }
              minLength={name === "alt" ? 15 : undefined}
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
        <label className="form-field" htmlFor="upload-format">
          {t("Choose format")}
          <select id="upload-format" name="format_slug" defaultValue={chosenFormat}>
            {formats.map((f) => (
              <option value={f.slug} key={f.slug}>
                {t(f.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field" htmlFor="upload-licence">
          {t("Licence")}
          <select
            id="upload-licence"
            name="licence_id"
            defaultValue={initialWork?.licence_id || "CC-BY-SA-4.0"}
          >
            {["CC-BY-SA-4.0", "CC0-1.0", "CC-BY-4.0", "CC-BY-NC-SA-4.0", "CC-BY-NC-ND-4.0"].map(
              (l) => (
                <option key={l}>{l}</option>
              ),
            )}
          </select>
        </label>
        <p>
          {t(
            "ShareAlike keeps remixes under the same licence. NC restricts commercial use. ND allows downloads but prohibits Studio remixes. Only grant rights you hold.",
          )}
        </p>
        <label className="checkbox-field">
          <input name="remixable" type="checkbox" defaultChecked />
          {t("Allow Studio remixes when the licence permits derivatives")}
        </label>
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
        <label className="form-field" htmlFor="upload-categories">
          {t("Categories (multiple selections allowed)")}
          <select
            id="upload-categories"
            name="categories"
            multiple
            size={5}
            defaultValue={(initialWork?.work_categories || []).map((c) => c.category_slug)}
          >
            {categories.map((c) => (
              <option value={c.slug} key={c.slug}>
                {t(c.label)}
              </option>
            ))}
          </select>
        </label>
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
          {t("JPEG or PNG, maximum 25 MB")}
          <input
            id="upload-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png"
            required
            aria-invalid={!!fieldErrors.file}
            aria-describedby={fieldErrors.file ? "upload-file-error" : undefined}
          />
          {fieldError("file")}
        </label>
        <p>
          {t(
            "Uploads are private until review. EXIF/GPS metadata is stripped on import. A4/A2 print PDFs and a WebP preview are generated. Low resolution produces a warning, not a rejection.",
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
    </section>
  );
}
export function AdminPanel({
  view = "queue",
}: {
  view?: "queue" | "review" | "messages" | "takedowns" | "users" | "audit";
}) {
  const router = useRouter();
  const { t, locale } = useI18n(),
    action = useAction();
  const [works, setWorks] = useState<Work[]>([]),
    [notice, setNotice] = useState("");
  const [records, setRecords] = useState<unknown>(null);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [access, setAccess] = useState<"loading" | "denied" | "mfa" | "allowed">("loading");
  useEffect(() => {
    let live = true;
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (live)
          setAccess(
            !data?.account?.admin
              ? "denied"
              : data.account.fresh && data.account.aal2
                ? "allowed"
                : "mfa",
          );
      })
      .catch(() => {
        if (live) setAccess("denied");
      });
    return () => {
      live = false;
    };
  }, []);
  async function load() {
    await action.run(async () => {
      const result = await api<{ works: Work[] }>("admin/queue");
      setWorks(result.works);
      setNotice(t("Review queue loaded."));
    });
  }
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (access !== "allowed") return;
    if (view === "review") setSelectedId(location.pathname.split("/").filter(Boolean).at(-1) || "");
    void action.run(async () => {
      if (view === "queue" || view === "review") {
        const result = await api<{ works: Work[] }>("admin/queue");
        setWorks(result.works);
      } else
        setRecords(
          await api(`admin/${view === "messages" || view === "takedowns" ? "inbox" : view}`),
        );
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
        <p role="alert">{t("Administrator access is required.")}</p>
        <Link className="button" href="/login">
          {t("Sign in")}
        </Link>
      </section>
    );
  if (access === "mfa")
    return (
      <section className="content-width">
        <MfaPanel />
        <p>{t("After verifying your code, reload this page to open administration.")}</p>
        <button className="button" onClick={() => location.reload()}>
          {t("Load review queue")}
        </button>
      </section>
    );
  return (
    <div className="content-width">
      <nav className="button-row" aria-label={t("Administration")}>
        <Link href="/admin">{t("Review queue")}</Link>
        <Link href="/admin/messages">{t("Messages")}</Link>
        <Link href="/admin/takedowns">{t("Takedowns")}</Link>
        <Link href="/admin/users">{t("Contributors")}</Link>
        <Link href="/admin/audit">{t("Audit log")}</Link>
      </nav>
      <p>
        {t(
          "Administration requires TOTP and a fresh six-digit authenticator code. Your authenticator secret is shown only during setup.",
        )}
      </p>
      <Link className="button" href="/account/settings">
        {t("Account security")}
      </Link>
      <MfaPanel />
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
        {(
          [
            ["inbox", "Messages and takedowns"],
            ["audit", "Audit log"],
            ["users", "Contributors"],
          ] as const
        ).map(([route, label]) => (
          <button
            key={route}
            className="button"
            onClick={() =>
              action.run(async () => {
                setRecords(await api(`admin/${route}`));
              })
            }
          >
            {t(label)}
          </button>
        ))}
      </div>
      <Alert text={action.failure} />
      <p role="status">{notice}</p>
      {records !== null && <AdminRecords records={records} view={view} />}
      {records !== null && (view === "messages" || view === "takedowns") && (
        <form
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
      {works
        .filter((work) => view !== "review" || work.id === selectedId)
        .map((work) => (
          <article key={work.id} className="backend-panel">
            <h2>
              <a href={`/${locale}/admin/review/${work.id}/`}>{work.title}</a>
            </h2>
            <p>
              {t(work.status)} | {work.licence_id} | {t("AI-use declaration")}: {work.ai_use}
            </p>
            <ReviewImage work={work} />
            <form
              className="handoff-form"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void action.run(async () => {
                  await api("admin/work-categories", {
                    id: work.id,
                    categories: data.getAll("categories"),
                  });
                  setNotice(t("Categories saved."));
                });
              }}
            >
              <label className="form-field" htmlFor={"review-categories-" + work.id}>
                {t("Review categories")}
                <select
                  id={"review-categories-" + work.id}
                  name="categories"
                  multiple
                  size={4}
                  defaultValue={(work.work_categories || []).map((c) => c.category_slug)}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {t(c.label)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button" disabled={action.busy}>
                {t("Save categories")}
              </button>
            </form>
            <p>{work.alt}</p>
            <p>{work.ai_disclosure}</p>
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
            <form
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
                  await api("admin/review", { id: work.id, ...Object.fromEntries(data) });
                  setNotice(
                    t("Review saved. Approved publication may take a few minutes to rebuild."),
                  );
                  const result = await api<{ works: Work[] }>("admin/queue");
                  setWorks(result.works);
                });
              }}
            >
              <label className="form-field" htmlFor={`review-action-${work.id}`}>
                {t("Decision")}
                <select id={`review-action-${work.id}`} name="action">
                  <option value="approve">{t("Approve")}</option>
                  <option value="changes_requested">{t("Request changes")}</option>
                  <option value="rejected">{t("Reject")}</option>
                  <option value="taken_down">{t("Take down")}</option>
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
          </article>
        ))}
    </div>
  );
}
