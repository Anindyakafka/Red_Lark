import { LICENSES, type Credit, type Poster, type Scene } from "./types";

export function canRemix(poster: Poster) {
  return (
    poster.remixable && poster.allowsDerivatives && LICENSES[poster.license]?.derivatives === true
  );
}
export function sourceCredit(poster: Poster, artist: string): Credit {
  return {
    id: poster.slug,
    title: poster.title,
    artist,
    license: poster.license,
    source: poster.source,
  };
}
export function sceneCredits(scene: Scene): Credit[] {
  return [
    ...new Map(
      [
        ...(scene.sources ?? []),
        ...scene.layers.filter((l) => !l.hidden && l.credit).map((l) => l.credit!),
      ].map((c) => [c.id, c]),
    ).values(),
  ];
}
export function exportLicense(credits: Credit[]) {
  const sa = [
    ...new Set(credits.filter((c) => LICENSES[c.license].shareAlike).map((c) => c.license)),
  ];
  if (sa.length > 1)
    throw new Error(
      "These ShareAlike licences cannot be mixed. Use one ShareAlike licence family.",
    );
  if (credits.some((c) => !LICENSES[c.license]?.derivatives))
    throw new Error("This composition contains a source that prohibits derivatives.");
  const nonCommercial = credits.some((c) => !LICENSES[c.license].commercial);
  if (sa[0] === "CC-BY-SA-4.0" && nonCommercial)
    throw new Error("Non-commercial sources cannot be combined with CC-BY-SA in this exporter.");
  return (
    sa[0] ??
    (nonCommercial
      ? "CC-BY-NC-4.0"
      : credits.some((c) => c.license === "CC-BY-4.0")
        ? "CC-BY-4.0"
        : "CC0-1.0")
  );
}
export function creditLines(scene: Scene) {
  const credits = sceneCredits(scene);
  const license = exportLicense(credits);
  return [
    `SOURCE LICENCE: ${license}`,
    ...(credits.some((c) => LICENSES[c.license].shareAlike)
      ? [`ADAPTATION: ${license} REQUIRED / YOUR ADDITIONS MUST COMPLY`]
      : ["USER ADDITIONS: RIGHTS RETAINED / SOURCE PERMISSIONS REMAIN IN FORCE"]),
    ...credits.map((c) => `${c.title} / ${c.artist} / ${c.license} / ${c.source}`),
    ...(scene.layers.some((l) => !l.hidden && l.kind === "image" && !l.credit)
      ? ["User image: rights retained by its owner; confirm permission before sharing."]
      : []),
  ];
}
