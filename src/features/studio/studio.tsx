"use client";

import { useReducer, useRef, useState } from "react";
import { INITIAL_DOCUMENT, FONT_FAMILIES, elementMarkup, exportSvg, historyReducer, isStudioDocument } from "./document";
import type { ElementKind, FontFamily, StudioElement, StudioDocument } from "./document";

const STORAGE_KEY = "mirafra.studio.v1";
export function Studio() {
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: INITIAL_DOCUMENT, future: [] });
  const doc = history.present;
  const [selectedId, setSelectedId] = useState<string | null>("initial-text");
  const [notice, setNotice] = useState("Drafts stay in this browser. Save before leaving.");
  const [dragPosition, setDragPosition] = useState<{ id: string; x: number; y: number } | null>(null);
  const drag = useRef<{ id: string; pointer: number; offsetX: number; offsetY: number; x: number; y: number } | null>(null);
  const canvas = useRef<SVGSVGElement>(null);
  const selected = doc.elements.find(e => e.id === selectedId);
  function commit(document: StudioDocument) { dispatch({ type: "commit", document }); }
  function patchElement(patch: Partial<StudioElement>) { commit({ ...doc, elements: doc.elements.map(e => e.id === selectedId ? { ...e, ...patch } : e) }); }
  function add(kind: ElementKind) {
    if (doc.elements.length >= 100) { setNotice("This prototype supports up to 100 elements."); return; }
    const id = crypto.randomUUID();
    const element: StudioElement = { id, kind, x: 50, y: 200, rotation: 0, scale: 1, color: "#20211d", text: kind === "text" ? "YOUR WORDS" : "", fontSize: 32, fontFamily: "Arial" };
    commit({ ...doc, elements: [...doc.elements, element] }); setSelectedId(id);
  }
  function point(event: React.PointerEvent) {
    const rect = canvas.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * doc.width / rect.width, y: (event.clientY - rect.top) * doc.height / rect.height };
  }
  function pointerDown(event: React.PointerEvent<SVGGElement>, element: StudioElement) {
    event.stopPropagation(); setSelectedId(element.id);
    const p = point(event);
    drag.current = { id: element.id, pointer: event.pointerId, offsetX: p.x - element.x, offsetY: p.y - element.y, x: element.x, y: element.y };
    canvas.current!.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    const p = point(event);
    d.x = Math.round(Math.max(-420, Math.min(840, p.x - d.offsetX)));
    d.y = Math.round(Math.max(-594, Math.min(1188, p.y - d.offsetY)));
    setDragPosition({ id: d.id, x: d.x, y: d.y });
  }
  function pointerEnd(event: React.PointerEvent<SVGSVGElement>, cancelled = false) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    if (!cancelled) commit({ ...doc, elements: doc.elements.map(e => e.id === d.id ? { ...e, x: d.x, y: d.y } : e) });
    drag.current = null; setDragPosition(null);
    if (canvas.current?.hasPointerCapture(event.pointerId)) canvas.current.releasePointerCapture(event.pointerId);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); setNotice("Draft saved in this browser. Clearing browser data will remove it."); }
    catch { setNotice("This browser could not save the draft. Export an SVG to keep your design."); }
  }
  function restore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) { setNotice("No saved draft in this browser yet."); return; }
      const parsed: unknown = JSON.parse(stored);
      if (!isStudioDocument(parsed)) { setNotice("The saved draft is not compatible with this studio version."); return; }
      commit(parsed); setSelectedId(null); setNotice("Saved draft restored. Undo returns to your previous composition.");
    } catch { setNotice("Could not read the saved draft in this browser."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportSvg(doc)], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "mirafra-composition.svg"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("SVG exported. Check fonts and colours before sending it to a print shop.");
  }
  function moveLayer(direction: -1 | 1) {
    const elements = [...doc.elements]; const i = elements.findIndex(e => e.id === selectedId); const to = i + direction;
    if (i < 0 || to < 0 || to >= elements.length) return;
    [elements[i], elements[to]] = [elements[to], elements[i]]; commit({ ...doc, elements });
  }
  return <section className="studio section"><div className="section-heading"><div><p className="eyebrow">The Mirafra studio / Prototype</p><h1>Make a little noise.</h1></div><p className="muted">Your words. Your arrangement.</p></div>
    <div className="studio-toolbar"><div><button disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })}>↶ Undo</button><button disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })}>↷ Redo</button></div><div><button onClick={restore}>Restore draft</button><button onClick={save}>Save draft</button><button className="dark" onClick={download}>Export SVG ↓</button></div></div>
    <div className="studio-layout"><aside className="studio-panel"><p className="eyebrow">01 / The element shelf</p><h2>Start with something.</h2><div className="element-shelf">{(["text", "bird", "circle", "rectangle"] as ElementKind[]).map(kind => <button key={kind} onClick={() => add(kind)}><span aria-hidden="true">{{ text: "Aa", bird: "↗", circle: "●", rectangle: "▬" }[kind]}</span>Add {kind}</button>)}</div><label className="field">Paper colour<input type="color" value={doc.background} onChange={e => commit({ ...doc, background: e.target.value })} /></label><p className="eyebrow layer-heading">02 / Layers</p><div className="layers">{[...doc.elements].reverse().map(e => <button className={selectedId === e.id ? "selected" : ""} key={e.id} onClick={() => setSelectedId(e.id)} aria-pressed={selectedId === e.id}><span>{e.kind === "text" ? e.text.replaceAll("\n", " ").slice(0, 22) || "Empty text" : e.kind}</span><span aria-hidden="true">↗</span></button>)}</div><p className="small-note">Top layer is shown first. Drag an element on the paper, or change its position in the controls.</p></aside>
    <div className="canvas-area"><div className="canvas-label"><span>PORTRAIT / A3 RATIO</span><span>SVG</span></div><svg className="studio-canvas" ref={canvas} viewBox="0 0 420 594" role="img" aria-label="Your poster composition. Select a layer to edit it using the controls." onPointerDown={() => setSelectedId(null)} onPointerMove={pointerMove} onPointerUp={e => pointerEnd(e)} onPointerCancel={e => pointerEnd(e, true)}><rect width="420" height="594" fill={doc.background} />{doc.elements.map(element => {
      const shown = dragPosition?.id === element.id ? { ...element, x: dragPosition.x, y: dragPosition.y } : element;
      return <g key={element.id} onPointerDown={e => pointerDown(e, element)} style={{ cursor: "move" }}><g dangerouslySetInnerHTML={{ __html: elementMarkup(shown) }} />{selectedId === element.id && <g transform={`translate(${shown.x} ${shown.y}) rotate(${shown.rotation}) scale(${shown.scale})`} pointerEvents="none"><rect x="-5" y="-5" width={element.kind === "text" ? Math.max(30, ...element.text.split("\n").map(line => line.length * element.fontSize * 0.7)) + 10 : element.kind === "rectangle" ? 140 : 120} height={element.kind === "text" ? element.text.split("\n").length * element.fontSize * 1.08 + 15 : 130} fill="none" stroke="#3468dc" strokeWidth="1.5" strokeDasharray="5 4" /></g>}</g>;
    })}</svg><p className="small-note">Select and drag to arrange. Export contains the artwork only.</p></div>
    <aside className="studio-panel properties"><p className="eyebrow">03 / Make it yours</p><h2>{selected ? "Element controls" : "Pick an element."}</h2>{selected ? <>
      {selected.kind === "text" && <><label className="field">Your words<textarea maxLength={500} rows={4} value={selected.text} onChange={e => patchElement({ text: e.target.value })} /></label><label className="field">Typeface<select value={selected.fontFamily} onChange={e => patchElement({ fontFamily: e.target.value as FontFamily })}>{FONT_FAMILIES.map(font => <option key={font}>{font}</option>)}</select></label><label className="field">Type size<input type="range" min="8" max="120" value={selected.fontSize} onChange={e => patchElement({ fontSize: Number(e.target.value) })} /><span>{selected.fontSize}</span></label></>}
      <label className="field">Ink colour<input type="color" value={selected.color} onChange={e => patchElement({ color: e.target.value })} /></label>
      <div className="position-fields">{(["x", "y"] as const).map(axis => <label className="field" key={axis}>{axis.toUpperCase()} position<input type="number" min={axis === "x" ? -420 : -594} max={axis === "x" ? 840 : 1188} value={selected[axis]} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) patchElement({ [axis]: Math.max(axis === "x" ? -420 : -594, Math.min(axis === "x" ? 840 : 1188, n)) }); }} /></label>)}</div>
      <label className="field">Scale<input type="range" min="0.1" max="4" step="0.1" value={selected.scale} onChange={e => patchElement({ scale: Number(e.target.value) })} /><span>{selected.scale.toFixed(1)}×</span></label>
      <label className="field">Rotation<input type="range" min="-180" max="180" value={selected.rotation} onChange={e => patchElement({ rotation: Number(e.target.value) })} /><span>{selected.rotation}°</span></label>
      <div className="layer-actions"><button disabled={doc.elements.at(-1)?.id === selectedId} onClick={() => moveLayer(1)}>Bring forward</button><button disabled={doc.elements[0]?.id === selectedId} onClick={() => moveLayer(-1)}>Send back</button></div><button className="delete-button" onClick={() => { commit({ ...doc, elements: doc.elements.filter(e => e.id !== selectedId) }); setSelectedId(null); }}>Remove element</button>
    </> : <p className="small-note">Choose something on the paper or in the layer list. Add more from the element shelf.</p>}</aside></div>
    <p role="status" className="studio-status">{notice}</p><p className="small-note">This is a small editor prototype. Approved catalogue elements, uploads, snapping, multi-selection, and print-ready PDF export are planned.</p>
  </section>;
}
