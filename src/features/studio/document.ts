export const FONT_FAMILIES = ["Arial", "Georgia", "Courier New"] as const;
export type FontFamily = typeof FONT_FAMILIES[number];
export type ElementKind = "text" | "circle" | "rectangle" | "bird";
export interface StudioElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
}
export interface StudioDocument {
  version: 1;
  width: 420;
  height: 594;
  background: string;
  elements: StudioElement[];
}

export const BIRD_PATH = "M0 85 40 40C42 18 51 8 65 10C78 10 87 17 96 24L104 29 93 33C90 58 75 80 48 89L15 117 28 89Z";
export const INITIAL_DOCUMENT: StudioDocument = {
  version: 1, width: 420, height: 594, background: "#f2ecd9",
  elements: [
    { id: "initial-text", kind: "text", x: 32, y: 40, rotation: 0, scale: 1, color: "#df4a31", text: "YOUR\nWORDS\nHERE.", fontSize: 60, fontFamily: "Arial" },
    { id: "initial-bird", kind: "bird", x: 190, y: 335, rotation: -8, scale: 1.5, color: "#20211d", text: "", fontSize: 32, fontFamily: "Arial" },
    { id: "initial-caption", kind: "text", x: 32, y: 530, rotation: 0, scale: 1, color: "#20211d", text: "A SMALL IDEA. AN OPEN WALL.", fontSize: 14, fontFamily: "Courier New" },
  ],
};

const hex = /^#[0-9a-f]{6}$/i;
const finite = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function isStudioDocument(value: unknown): value is StudioDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as Record<string, unknown>;
  if (doc.version !== 1 || doc.width !== 420 || doc.height !== 594 || typeof doc.background !== "string" || !hex.test(doc.background) || !Array.isArray(doc.elements) || doc.elements.length > 100) return false;
  const ids = new Set<string>();
  return doc.elements.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const e = item as Record<string, unknown>;
    if (typeof e.id !== "string" || !e.id || e.id.length > 100 || ids.has(e.id)) return false;
    ids.add(e.id);
    return ["text", "circle", "rectangle", "bird"].includes(String(e.kind)) && finite(e.x, -420, 840) && finite(e.y, -594, 1188) && finite(e.rotation, -180, 180) && finite(e.scale, 0.1, 4) && typeof e.color === "string" && hex.test(e.color) && typeof e.text === "string" && e.text.length <= 500 && finite(e.fontSize, 8, 120) && FONT_FAMILIES.includes(e.fontFamily as FontFamily);
  });
}

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}
export function elementMarkup(e: StudioElement): string {
  const fill = escapeXml(e.color);
  let content: string;
  switch (e.kind) {
    case "text": content = `<text fill="${fill}" font-family="${escapeXml(e.fontFamily)}" font-size="${e.fontSize}" font-weight="700">${e.text.split("\n").map((line, i) => `<tspan x="0" y="${e.fontSize * (1 + i * 1.08)}">${escapeXml(line)}</tspan>`).join("")}</text>`; break;
    case "circle": content = `<circle cx="50" cy="50" r="50" fill="${fill}"/>`; break;
    case "rectangle": content = `<rect width="130" height="90" fill="${fill}"/>`; break;
    case "bird": content = `<path d="${BIRD_PATH}" fill="${fill}"/>`; break;
  }
  return `<g transform="translate(${e.x} ${e.y}) rotate(${e.rotation}) scale(${e.scale})">${content}</g>`;
}
export function exportSvg(doc: StudioDocument): string {
  if (!isStudioDocument(doc)) throw new Error("Invalid studio document");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="420mm" viewBox="0 0 ${doc.width} ${doc.height}"><title>Mirafra studio composition</title><rect width="420" height="594" fill="${escapeXml(doc.background)}"/>${doc.elements.map(elementMarkup).join("")}</svg>`;
}

export interface History { past: StudioDocument[]; present: StudioDocument; future: StudioDocument[] }
export type HistoryAction = { type: "commit"; document: StudioDocument } | { type: "undo" } | { type: "redo" };
export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "commit") {
    if (JSON.stringify(state.present) === JSON.stringify(action.document)) return state;
    return { past: [...state.past, state.present].slice(-50), present: action.document, future: [] };
  }
  if (action.type === "undo" && state.past.length) return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
  if (action.type === "redo" && state.future.length) return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
  return state;
}
