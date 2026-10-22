import { LICENSES, type Scene, type Credit } from "@/lib/types";
import { sceneCredits, creditLines, exportLicense, sourceUrl } from "@/lib/licenses";
import { dimensions } from "./model";

export function creditRequired(scene: Scene) {
  return sceneCredits(scene).some((source) => source.license !== "CC0-1.0");
}
export function creditSettings(scene: Scene) {
  const rows = creditLines(scene).reduce((sum, line) => sum + Math.ceil(line.length / 133), 0);
  const settings = scene.exportCredit ?? {
    enabled: creditRequired(scene),
    x: 10,
    y: Math.max(0, dimensions(scene).height - rows * 10.5 - 20),
    width: 580,
    fontSize: 7,
    color: "#151515",
    background: "#f3f0e6",
  };
  const x = Math.max(0, Math.min(560, settings.x)),
    width = Math.min(settings.width, 600 - x);
  const columns = Math.max(10, Math.floor(width / (settings.fontSize * 0.62)));
  const height =
    creditLines(scene).reduce((sum, line) => sum + Math.ceil(line.length / columns), 0) *
      settings.fontSize *
      1.5 +
    8;
  return {
    ...settings,
    x,
    width,
    y: Math.max(0, Math.min(dimensions(scene).height - height, settings.y)),
  };
}
export function attributionMetadata(scene: Scene) {
  const sources = sceneCredits(scene).map((source) => ({
    ...source,
    source: sourceUrl(source.source),
    licenseUrl: LICENSES[source.license].url,
  }));
  const license = exportLicense(sources);
  return {
    sourceLicense: license,
    adaptationLicense: sources.some((c) => c.license.includes("-SA-"))
      ? license
      : "User additions: rights retained",
    sources,
    credits: creditLines(scene),
    modified: true,
    preset: scene.preset,
  };
}
/** Only the known in-house generated edition marker; never erase arbitrary artist text. */
export function cleanTemplate(scene: Scene, source?: Credit): Scene {
  const sources = [
    ...new Map(
      [...(scene.sources ?? []), ...sceneCredits(scene), ...(source ? [source] : [])].map((c) => [
        c.id,
        c,
      ]),
    ).values(),
  ];
  return {
    ...scene,
    sources,
    layers: scene.layers.filter(
      (l) =>
        !(
          l.id.endsWith("-edition") &&
          /^PLACEHOLDER \/ \d+ \/ CC0$/.test(l.text) &&
          l.credit?.artist === "The Wet Ink Workshop"
        ),
    ),
  };
}
