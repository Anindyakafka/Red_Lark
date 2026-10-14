import { LICENSES, type Artist, type Poster } from "./types";
import { validateScene } from "../studio/model";
export function validatePoster(p: Poster, artists: Artist[]): string[] {
  const errors: string[] = [];
  for (const field of [
    "slug",
    "title",
    "artist",
    "source",
    "alt",
    "caption",
    "license",
    "licenseUrl",
    "artistUrl",
  ] as const)
    if (typeof p[field] !== "string" || !p[field].trim()) errors.push(`Missing ${field}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug ?? "")) errors.push("Invalid slug");
  if (!artists.some((a) => a.id === p.artist)) errors.push("Missing artist credit");
  const policy = LICENSES[p.license];
  if (!policy) errors.push("Unknown licence; add a reviewed policy before importing");
  else {
    if (p.allowsDerivatives !== policy.derivatives || p.commercialUseAllowed !== policy.commercial)
      errors.push("Licence flags do not match the licence policy");
    if (p.licenseUrl !== policy.url) errors.push("Licence URL does not match policy");
    if (p.remixable && !policy.derivatives)
      errors.push("Derivatives forbidden: remixable must be false");
  }
  if (p.remixable && !p.allowsDerivatives) errors.push("Remix cannot bypass the derivative gate");
  if (p.remixable && !p.studioLayers) errors.push("Remix needs editable source layers");
  if (p.studioLayers && !validateScene(p.studioLayers)) errors.push("Editable scene is invalid");
  if (
    !Array.isArray(p.languages) ||
    !p.languages.length ||
    !Array.isArray(p.themes) ||
    !p.themes.length ||
    !Array.isArray(p.movements)
  )
    errors.push("Missing language/theme/movement arrays");
  if (!Array.isArray(p.formats) || !p.formats.length) errors.push("Missing downloads");
  for (const file of p.formats ?? [])
    if (
      !file.path?.startsWith("/") ||
      file.path.includes("..") ||
      !["PDF", "PNG", "SVG", "ZIP"].includes(file.format) ||
      !Number.isInteger(file.bytes) ||
      file.bytes <= 0
    )
      errors.push("Invalid download metadata");
  if (p.alt?.trim().length < 15 || /^poster\.?$/i.test(p.alt ?? ""))
    errors.push("Alt text must meaningfully describe the artwork");
  for (const url of [p.source, p.artistUrl])
    if (url && !/^(https:\/\/|\/(?!\/))/.test(url)) errors.push("Unsafe source/artist URL");
  return errors;
}
