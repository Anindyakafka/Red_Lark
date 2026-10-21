import { InboxNotice, VerifyLink, LogoutPanel } from "@/components/account-pages";
import { notFound } from "next/navigation";
import { AuthForm, AdminPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
const services = {
  login: "Staff login",
  signup: "Staff accounts are invitation only.",
  "forgot-password": "Password reset request",
  "reset-password": "Set a new password",
  admin: "Admin review",
  "check-your-inbox": "Check your inbox",
  verify: "Verify email",
  logout: "Log out",
} as const;
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(services).map((service) => ({ service }));
}
export default async function Service({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  if (!(service in services)) notFound();
  return (
    <>
      <PageIntro
        index="ACCOUNT"
        title={services[service as keyof typeof services]}
        description="Browsing, downloading, the Studio and contributions need no account. Accounts are reserved for invited staff."
        action="Browse collection"
        href="/collection"
      />
      {service === "check-your-inbox" ? (
        <InboxNotice />
      ) : service === "verify" ? (
        <VerifyLink />
      ) : service === "logout" ? (
        <LogoutPanel />
      ) : service === "admin" ? (
        <AdminPanel />
      ) : (
        <div className="content-width">
          <AuthForm mode={service as "login" | "signup" | "forgot-password" | "reset-password"} />
        </div>
      )}
    </>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}) {
  const { locale, service } = await params;
  return {
    ...localizeMetadata(
      pageMeta(
        services[service as keyof typeof services] ?? "Unavailable service",
        `${services[service as keyof typeof services]} for invited staff. Browse, contribute and use the Studio without signing in.`,
        `/${service}`,
      ),
      locale,
    ),
    robots: { index: false, follow: false },
  };
}
