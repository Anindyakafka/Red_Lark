import { PRESETS, type Layer, type Scene } from "@/lib/types";
import { exportLicense, sceneCredits } from "@/lib/licenses";

export function dimensions(scene: Scene) {
  const p = PRESETS[scene.preset];
  return { width: 600, height: (600 * p.height) / p.width };
}
export function newLayer(kind: Layer["kind"], id = crypto.randomUUID()): Layer {
  return {
    id,
    kind,
    name: kind === "text" ? "Headline" : kind,
    x: 50,
    y: 160,
    width: kind === "text" ? 500 : 180,
    height: kind === "text" ? 130 : 180,
    rotation: 0,
    color: "#e32219",
    text: "YOUR\nWORDS HERE",
    font: "display",
    fontSize: 100,
    locked: false,
    hidden: false,
  };
}
export function freshScene(): Scene {
  return {
    version: 3,
    preset: "A3",
    background: "#f3f0e6",
    colors: 2,
    layers: [
      {
        ...newLayer("text", "headline"),
        y: 60,
        height: 300,
        text: "MAKE\nYOURSELF\nHEARD.",
        fontSize: 132,
      },
      { ...newLayer("arrow", "arrow"), y: 480, width: 460, height: 120, color: "#151515" },
      {
        ...newLayer("text", "small-print"),
        y: 700,
        height: 60,
        text: "FREE TO PRINT. FREE TO PASS ON.",
        fontSize: 18,
        font: "mono",
        color: "#151515",
      },
    ],
  };
}
/** Additive version migration keeps earlier browser drafts and share links readable. */
export function migrateScene(input: unknown): Scene | null {
  if (!validateScene(input)) return null;
  return input.version === 3 ? input : { ...input, version: 3 };
}
export function validateScene(input: unknown): input is Scene {
  if (!input || typeof input !== "object") return false;
  const s = input as Partial<Scene>;
  if (
    ![2, 3].includes(s.version ?? 0) ||
    !s.preset ||
    !(s.preset in PRESETS) ||
    typeof s.background !== "string" ||
    !/^#[\da-f]{6}$/i.test(s.background) ||
    ![1, 2, 3].includes(s.colors ?? 0) ||
    !Array.isArray(s.layers) ||
    s.layers.length > 80
  )
    return false;
  const ids = new Set<string>();
  const groupIds = new Set<string>();
  if (
    s.groups &&
    (!Array.isArray(s.groups) ||
      s.groups.length > 80 ||
      !s.groups.every((group) => {
        if (!group || typeof group.id !== "string" || !group.id || groupIds.has(group.id))
          return false;
        groupIds.add(group.id);
        if (
          ![group.x, group.y, group.width, group.height, group.rotation].every(Number.isFinite) ||
          group.width < 10 ||
          group.height < 10 ||
          Math.abs(group.rotation) > 180
        )
          return false;
        const crop = group.crop;
        return (
          !crop ||
          ([crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) &&
            crop.x >= 0 &&
            crop.y >= 0 &&
            crop.width >= 0.02 &&
            crop.height >= 0.02 &&
            crop.x + crop.width <= 1.000001 &&
            crop.y + crop.height <= 1.000001)
        );
      }))
  )
    return false;
  const validCredit = (credit: unknown) => {
    if (!credit || typeof credit !== "object") return false;
    const c = credit as Record<string, unknown>;
    return (
      ["id", "title", "artist", "source"].every(
        (k) => typeof c[k] === "string" && c[k].length > 0 && c[k].length <= 1500,
      ) &&
      typeof c.license === "string" &&
      [
        "CC0-1.0",
        "CC-BY-4.0",
        "CC-BY-SA-4.0",
        "CC-BY-NC-4.0",
        "CC-BY-NC-SA-4.0",
        "CC-BY-ND-4.0",
        "CC-BY-NC-ND-4.0",
      ].includes(c.license)
    );
  };
  if (
    s.sources &&
    (!Array.isArray(s.sources) || s.sources.length > 100 || !s.sources.every(validCredit))
  )
    return false;
  if (s.exportCredit) {
    const c = s.exportCredit;
    if (
      typeof c.enabled !== "boolean" ||
      ![c.x, c.y, c.width, c.fontSize].every((n) => Number.isFinite(n)) ||
      c.x < 0 ||
      c.y < 0 ||
      c.x > 600 ||
      c.y > 5000 ||
      c.width < 40 ||
      c.width > 600 ||
      c.fontSize < 4 ||
      c.fontSize > 30 ||
      !/^#[\da-f]{6}$/i.test(c.color) ||
      !/^#[\da-f]{6}$/i.test(c.background)
    )
      return false;
  }
  return s.layers.every((l) => {
    if (!l || typeof l !== "object" || typeof l.id !== "string" || !l.id || ids.has(l.id))
      return false;
    ids.add(l.id);
    if (l.groupId !== undefined && (!groupIds.has(l.groupId) || l.kind === "text")) return false;
    if (
      !["text", "rectangle", "circle", "star", "arrow", "halftone", "grain", "image"].includes(
        l.kind,
      ) ||
      typeof l.text !== "string" ||
      l.text.length > 1500 ||
      typeof l.name !== "string" ||
      l.name.length > 100 ||
      !["display", "mono"].includes(l.font) ||
      typeof l.locked !== "boolean" ||
      typeof l.hidden !== "boolean" ||
      !/^#[\da-f]{6}$/i.test(l.color)
    )
      return false;
    for (const key of ["x", "y", "width", "height", "rotation", "fontSize"] as const)
      if (typeof l[key] !== "number" || !Number.isFinite(l[key]) || Math.abs(l[key]) > 5000)
        return false;
    if (
      l.width < 10 ||
      l.height < 10 ||
      l.fontSize < 6 ||
      l.fontSize > 600 ||
      Math.abs(l.rotation) > 180
    )
      return false;
    if (
      l.kind === "image" &&
      (typeof l.image !== "string" ||
        !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(l.image) ||
        l.image.length > 8_000_000)
    )
      return false;
    if (l.kind !== "image" && l.image !== undefined) return false;
    if (
      l.crop &&
      (l.kind === "text" ||
        ![l.crop.x, l.crop.y, l.crop.width, l.crop.height].every(Number.isFinite) ||
        l.crop.x < 0 ||
        l.crop.y < 0 ||
        l.crop.width < 0.02 ||
        l.crop.height < 0.02 ||
        l.crop.x + l.crop.width > 1.000001 ||
        l.crop.y + l.crop.height > 1.000001)
    )
      return false;
    if (
      l.credit &&
      (typeof l.credit.id !== "string" ||
        typeof l.credit.artist !== "string" ||
        typeof l.credit.title !== "string" ||
        typeof l.credit.source !== "string" ||
        l.credit.source.length > 500 ||
        ![
          "CC0-1.0",
          "CC-BY-4.0",
          "CC-BY-SA-4.0",
          "CC-BY-NC-4.0",
          "CC-BY-NC-SA-4.0",
          "CC-BY-ND-4.0",
          "CC-BY-NC-ND-4.0",
        ].includes(l.credit.license))
    )
      return false;
    return true;
  });
}
export function assertExportable(scene: Scene) {
  if (!validateScene(scene)) throw new Error("This saved composition is invalid or unsupported.");
  return exportLicense(sceneCredits(scene));
}
export interface History {
  past: Scene[];
  present: Scene;
  future: Scene[];
}
export type Action =
  | { type: "commit"; scene: Scene }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; scene: Scene };
export function reducer(state: History, action: Action): History {
  if (action.type === "reset") return { past: [], present: action.scene, future: [] };
  if (action.type === "commit") {
    if (JSON.stringify(state.present) === JSON.stringify(action.scene)) return state;
    return { past: [...state.past, state.present].slice(-60), present: action.scene, future: [] };
  }
  if (action.type === "undo" && state.past.length)
    return {
      past: state.past.slice(0, -1),
      present: state.past.at(-1)!,
      future: [state.present, ...state.future],
    };
  if (action.type === "redo" && state.future.length)
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
    };
  return state;
}
