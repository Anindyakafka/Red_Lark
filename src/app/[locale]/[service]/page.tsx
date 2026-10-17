import { notFound } from "next/navigation";
import { BackendHold } from "@/components/backend-hold";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
const services = {
  login: "Sign in",
  signup: "Create a contributor account",
  "forgot-password": "Password reset request",
  "reset-password": "Set a new password",
  admin: "Administration service pending",
} as const;
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(services).map((service) => ({ service }));
}
export default async function Service({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  if (!(service in services)) notFound();
  return <BackendHold title={services[service as keyof typeof services]} />;
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
        `The ${service} service is not enabled. No credentials are collected; the public archive and Studio remain available.`,
        `/${service}`,
      ),
      locale,
    ),
    robots: { index: false, follow: false },
  };
}
