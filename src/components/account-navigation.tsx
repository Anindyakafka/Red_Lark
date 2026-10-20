"use client";
import { useEffect, useState } from "react";
import { Link, useI18n } from "@/i18n/client";
export function AccountNavigation() {
  const { t } = useI18n();
  const [account, setAccount] = useState<{ admin: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => {
      void fetch("/api/session", { cache: "no-store", credentials: "same-origin" })
        .then(async (response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (live) setAccount(data?.account || null);
        })
        .catch(() => {
          if (live) setAccount(null);
        });
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("redlark:session", load);
    return () => {
      live = false;
      window.removeEventListener("focus", load);
      window.removeEventListener("redlark:session", load);
    };
  }, []);
  if (!account)
    return (
      <div className="account-links">
        <Link href="/login">{t("Log in")}</Link>
        <Link href="/signup">{t("Sign up")}</Link>
      </div>
    );
  return (
    <details className="account-menu">
      <summary>{t("Account")}</summary>
      <nav aria-label={t("Contributor navigation")}>
        <Link href="/account">{t("Dashboard")}</Link>
        <Link href="/account/works/new">{t("Upload")}</Link>
        <Link href="/account/profile">{t("Artist profile")}</Link>
        <Link href="/account/settings">{t("Account security")}</Link>
        {account.admin && <Link href="/admin">{t("Admin")}</Link>}
        <Link href="/logout">{t("Log out")}</Link>
      </nav>
    </details>
  );
}
