import suggestions from "../../content/tags.json" with { type: "json" };
import formats from "../../content/formats.json" with { type: "json" };
import type { LicenseId } from "./types";

export function orderReviewWorks<
  T extends { created_at?: string; work_notifications?: { event?: string; created_at?: string }[] },
>(works: T[]) {
  return works
    .map((work) => ({
      ...work,
      submitted_at:
        work.work_notifications
          ?.filter((event) => event.event === "pending" && event.created_at)
          .map((event) => event.created_at!)
          .sort()
          .at(-1) || null,
    }))
    .sort((a, b) =>
      (b.submitted_at || b.created_at || "").localeCompare(a.submitted_at || a.created_at || ""),
    );
}

export function imageDescription(work: {
  alt?: string;
  title: string;
  format_slug?: string;
  artist_name?: string;
}): string {
  const format = formats.find((f) => f.slug === work.format_slug)?.label || "Poster";
  return (
    work.alt?.trim() ||
    `${format} titled "${work.title}" by ${work.artist_name?.trim() || "Anonymous contributor"}`
  );
}

export function normalizeTags(input: unknown): string[] {
  const values = typeof input === "string" ? input.split(",") : Array.isArray(input) ? input : [];
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") throw new Error("invalid_tags");
    const clean = value
      .normalize("NFC")
      .replace(/<[^>]*>/g, "")
      .replace(/\p{Cc}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) continue;
    if ([...clean].length > 30) throw new Error("tag_too_long");
    const label =
      suggestions.find((s) => s.toLocaleLowerCase() === clean.toLocaleLowerCase()) || clean;
    if (!result.some((s) => s.toLocaleLowerCase() === label.toLocaleLowerCase()))
      result.push(label);
    if (result.length > 10) throw new Error("too_many_tags");
  }
  return result;
}

export const licenceChoices = [
  {
    id: "free",
    label: "Anyone can use it for anything, no credit needed.",
    summary: "Anyone can use it for anything",
    regular: "CC0-1.0",
    nc: "CC0-1.0",
  },
  {
    id: "open",
    label: "Share it and let others remix it, as long as remixes stay open too. Recommended.",
    summary: "Share and remix, keep it open",
    regular: "CC-BY-SA-4.0",
    nc: "CC-BY-NC-SA-4.0",
  },
  {
    id: "credit",
    label: "Share it and let others remix it. Just credit me.",
    summary: "Share and remix, credit me",
    regular: "CC-BY-4.0",
    nc: "CC-BY-NC-4.0",
  },
  {
    id: "unchanged",
    label: "People can print and share it exactly as it is, but not remix or change it.",
    summary: "Print and share, no changes",
    regular: "CC-BY-ND-4.0",
    nc: "CC-BY-NC-ND-4.0",
  },
] as const;
export function licenceSummary(id: string) {
  const choice = licenceChoices.find((c) => c.regular === id || c.nc === id) || licenceChoices[0];
  return choice.summary;
}
export function selectedLicence(choice: string, nonCommercial: boolean): LicenseId {
  const found = licenceChoices.find((c) => c.id === choice) || licenceChoices[0];
  return nonCommercial ? found.nc : found.regular;
}
