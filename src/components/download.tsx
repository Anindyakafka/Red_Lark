"use client";
import { track } from "@/lib/analytics";
export function Download({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="button download" href={href} download onClick={() => track("poster-download")}>
      {children}
    </a>
  );
}
