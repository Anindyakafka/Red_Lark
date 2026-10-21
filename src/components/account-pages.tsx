"use client";
import { useEffect, useState } from "react";
import { Link, useI18n } from "@/i18n/client";
import { api, errorMessage, UploadPanel } from "./account-client";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
type Work = NonNullable<ComponentProps<typeof UploadPanel>["initialWork"]>;
export function WorkEditor() {
  const { t } = useI18n();
  const [work, setWork] = useState<Work>();
  const [failure, setFailure] = useState("");
  useEffect(() => {
    const id = location.pathname.split("/").filter(Boolean).at(-1);
    let live = true;
    api<{ works: Work[] }>("account")
      .then((data) => {
        const selected = data.works.find((item) => item.id === id);
        if (!live) return;
        if (!selected) setFailure("Contribution not found in your account.");
        else setWork(selected);
      })
      .catch((error: unknown) => {
        if (live)
          setFailure(errorMessage(error instanceof Error ? error.message : "network_error"));
      });
    return () => {
      live = false;
    };
  }, []);
  if (failure)
    return (
      <section className="content-width">
        <p role="alert">{t(failure)}</p>
        <Link href="/account">{t("My contributions")}</Link>
      </section>
    );
  if (!work)
    return (
      <p className="content-width" role="status">
        {t("Loading account…")}
      </p>
    );
  if (!["draft", "changes_requested"].includes(work.status))
    return (
      <section className="content-width">
        <h2>{work.title}</h2>
        <p>{t(work.status)}</p>
        <p>{work.feedback}</p>
        <Link href="/account">{t("My contributions")}</Link>
      </section>
    );
  return (
    <div className="content-width">
      <p>
        {t("Review feedback")}: {work.feedback || t("No feedback yet.")}
      </p>
      <UploadPanel initialWork={work} />
    </div>
  );
}
export function InboxNotice() {
  const { t } = useI18n();
  return (
    <section className="content-width notice" role="status">
      <p>
        {t(
          "If the address can receive this request, an email will arrive. Open the link in this browser. Check spam too. This response does not confirm whether an account exists.",
        )}
      </p>
      <Link href="/login">{t("Back to sign in")}</Link>
    </section>
  );
}
export function VerifyLink() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [invite, setInvite] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  useEffect(() => {
    const token = new URLSearchParams(location.hash.slice(1)).get("invite");
    if (token !== null) {
      if (/^(?:[a-f0-9]{56}|[a-f0-9]{64})$/i.test(token)) setInvite(token);
      else setFailure("invitation_expired");
      return;
    }
    if (new URLSearchParams(location.search).get("error") === "invitation_expired") {
      setFailure("invitation_expired");
      return;
    }
    const code = new URLSearchParams(location.search).get("code");
    if (!code || code.length > 300) {
      setFailed(true);
      return;
    }
    location.replace(`/api/auth/callback?locale=${locale}&code=${encodeURIComponent(code)}`);
  }, [locale]);
  if (invite || failure)
    return (
      <section className="content-width">
        <h2>{t("Staff invitation")}</h2>
        <p>
          {t(
            "Accept this invitation only if you expected staff access from the team. Opening this page does not verify your email or create a session.",
          )}
        </p>
        {invite && (
          <button
            className="button accent"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setFailure("");
              history.replaceState(null, "", location.pathname + location.search);
              try {
                await api("auth/invite", { token: invite });
                setInvite("");
                window.dispatchEvent(new Event("redlark:session"));
                router.replace(`/${locale}/reset-password/`);
              } catch (error) {
                setFailure(error instanceof Error ? error.message : "network_error");
              } finally {
                setBusy(false);
              }
            }}
          >
            {t(busy ? "Working…" : "Accept staff invitation")}
          </button>
        )}
        {failure && <p role="alert">{t(errorMessage(failure))}</p>}
        <p>
          <Link href="/login">{t("Sign in")}</Link>
          {" / "}
          <Link href="/forgot-password">{t("Forgot password?")}</Link>
        </p>
      </section>
    );
  return (
    <section className="content-width">
      <p role={failed ? "alert" : "status"}>
        {t(failed ? errorMessage("link_expired") : "Verifying your email link…")}
      </p>
      {failed && <Link href="/login">{t("Back to sign in")}</Link>}
    </section>
  );
}
export function LogoutPanel() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  return (
    <section className="content-width">
      <p>{t("This signs you out on every device.")}</p>
      <button
        className="button accent"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailure("");
          try {
            await api("auth/logout");
            window.dispatchEvent(new Event("redlark:session"));
            router.push(`/${locale}/login/`);
          } catch (error) {
            setFailure(errorMessage(error instanceof Error ? error.message : "network_error"));
            setBusy(false);
          }
        }}
      >
        {t("Sign out everywhere")}
      </button>
      {failure && <p role="alert">{t(failure)}</p>}
    </section>
  );
}
