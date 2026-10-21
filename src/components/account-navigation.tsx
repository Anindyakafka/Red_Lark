"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Link, useI18n } from "@/i18n/client";
export function AccountNavigation() {
  const { t } = useI18n();
  const [account, setAccount] = useState<{ admin: boolean; pendingCount?: number | null } | null>(
    null,
  );
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);
  useEffect(() => {
    function outside(event: PointerEvent | FocusEvent) {
      if (menu.current && event.target instanceof Node && !menu.current.contains(event.target))
        menu.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
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
    <div className="account-links">
      {account.admin && (
        <Link href="/admin/review" className="admin-link">
          {t("Admin")}{" "}
          {typeof account.pendingCount === "number" && (
            <span aria-label={`${t("Pending review")}: ${account.pendingCount}`}>
              {account.pendingCount}
            </span>
          )}
        </Link>
      )}
      <details className="account-menu" ref={menu}>
        <summary>{t("Account")}</summary>
        <nav
          aria-label={t("Contributor navigation")}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a") && menu.current)
              menu.current.open = false;
          }}
        >
          <Link href="/account">{t("Dashboard")}</Link>
          <Link href="/account/works/new">{t("Upload")}</Link>
          <Link href="/account/profile">{t("Artist profile")}</Link>
          <Link href="/account/settings">{t("Account security")}</Link>
          <Link href="/logout">{t("Log out")}</Link>
        </nav>
      </details>
    </div>
  );
}
