import type { Scene, Credit } from "@/lib/types";
import { sceneCredits, creditLines, exportLicense } from "@/lib/licenses";
import { dimensions } from "./model";

export function creditRequired(scene: Scene) {
  return sceneCredits(scene).some((source) => source.license !== "CC0-1.0");
}
export function creditSettings(scene: Scene) {
  const rows = creditLines(scene).reduce((sum, line) => sum + Math.ceil(line.length / 133), 0);
  return (
    scene.exportCredit ?? {
      enabled: creditRequired(scene),
      x: 10,
      y: Math.max(0, dimensions(scene).height - rows * 10.5 - 20),
      width: 580,
      fontSize: 7,
      color: "#151515",
      background: "#f3f0e6",
    }
  );
}
export function attributionMetadata(scene: Scene) {
  const sources = sceneCredits(scene);
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
