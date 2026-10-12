import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_DOCUMENT, escapeXml, exportSvg, historyReducer, isStudioDocument } from "../src/features/studio/document";

test("SVG export escapes user text and excludes editor decoration", () => {
  const doc = structuredClone(INITIAL_DOCUMENT);
  doc.elements[0].text = '<script>alert("x")</script>&';
  const svg = exportSvg(doc);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("stroke-dasharray"));
  assert.ok(svg.includes('width="297mm"'));
  assert.equal(escapeXml("'&<>\""), "&apos;&amp;&lt;&gt;&quot;");
});
test("draft validation rejects malformed, unsupported, and dangerous input", () => {
  assert.ok(isStudioDocument(INITIAL_DOCUMENT));
  for (const change of [{ version: 2 }, { background: 'red" onload="alert(1)' }, { elements: null }]) {
    assert.equal(isStudioDocument({ ...INITIAL_DOCUMENT, ...change }), false);
  }
  for (const change of [{ x: NaN }, { scale: Infinity }, { kind: "script" }, { fontFamily: 'Arial" onload="x' }, { text: "a".repeat(501) }, { id: "initial-bird" }]) {
    const doc = structuredClone(INITIAL_DOCUMENT);
    Object.assign(doc.elements[0], change);
    assert.equal(isStudioDocument(doc), false);
    assert.throws(() => exportSvg(doc));
  }
});
test("undo restores a composition; a new edit invalidates redo", () => {
  const initial = { past: [], present: INITIAL_DOCUMENT, future: [] };
  const altered = { ...INITIAL_DOCUMENT, background: "#ffffff" };
  const edited = historyReducer(initial, { type: "commit", document: altered });
  const undone = historyReducer(edited, { type: "undo" });
  assert.equal(undone.present, INITIAL_DOCUMENT);
  assert.equal(historyReducer(undone, { type: "redo" }).present, altered);
  assert.equal(historyReducer(undone, { type: "commit", document: { ...INITIAL_DOCUMENT, background: "#000000" } }).future.length, 0);
  assert.equal(historyReducer(initial, { type: "undo" }), initial);
});
test("history is bounded to 50 snapshots", () => {
  let state = { past: [] as typeof INITIAL_DOCUMENT[], present: INITIAL_DOCUMENT, future: [] as typeof INITIAL_DOCUMENT[] };
  for (let i = 0; i < 70; i++) state = historyReducer(state, { type: "commit", document: { ...INITIAL_DOCUMENT, background: `#${i.toString(16).padStart(6, "0")}` } });
  assert.equal(state.past.length, 50);
});
