"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import opentype from "opentype.js";
import { PRESETS, type Layer, type Scene, type PresetId } from "@/lib/types";
import { posters, artistFor } from "@/lib/catalog";
import { canRemix, sourceCredit, creditLines } from "@/lib/licenses";
import {
  dimensions,
  freshScene,
  newLayer,
  reducer,
  validateScene,
  assertExportable,
} from "./model";
import { sceneSvg, type Fonts } from "./render";
import { decodeScene, encodeScene } from "./share";
import { exportFile, importImage } from "./exports";

const KEY = "mirafra.studio.v2";
const PALETTE = ["#151515", "#e32219", "#f3f0e6"];
function verifySources(scene: Scene) {
  for (const layer of scene.layers) {
    if (!layer.credit) continue;
    const poster = posters.find((p) => p.slug === layer.credit?.id);
    if (!poster || !canRemix(poster))
      throw new Error("A source in this design is not approved for remix.");
    const correct = sourceCredit(poster, artistFor(poster.artist).name);
    if (JSON.stringify(layer.credit) !== JSON.stringify(correct)) layer.credit = correct;
  }
  assertExportable(scene);
  return scene;
}
export default function Studio() {
  const [history, dispatch] = useReducer(reducer, { past: [], present: freshScene(), future: [] });
  const scene = history.present;
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>("headline");
  const [status, setStatus] = useState("[LOADING] Preparing same-origin fonts and assets…");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(false);
  const [snap, setSnap] = useState(true);
  const [mobileTab, setMobileTab] = useState("canvas");
  const [shareLink, setShareLink] = useState("");
  const [separation, setSeparation] = useState("");
  const [liveLayer, setLiveLayer] = useState<Layer | null>(null);
  const [shelfQuery, setShelfQuery] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<Scene | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    layer: Layer;
    mode: "move" | "resize" | "rotate";
  } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef(0);
  const panStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const selectedLayer = scene.layers.find((l) => l.id === selected);
  const dim = dimensions(scene);
  const commit = useCallback((next: Scene) => {
    dispatch({ type: "commit", scene: next });
    setShareLink("");
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (!window.PointerEvent || !window.Blob || !window.DOMParser)
          throw new Error(
            "[UNSUPPORTED BROWSER] Use a recent browser with SVG, Pointer Events and file downloads.",
          );
        const load = async (path: string) => {
          const r = await fetch(path).catch(() => {
            throw new Error("A local font could not load. Check your connection or reload.");
          });
          if (!r.ok) throw new Error("A local font failed to load. Reload the page.");
          return opentype.parse(await r.arrayBuffer());
        };
        const [display, mono] = await Promise.all([
          load("/fonts/bebas-neue.ttf"),
          load("/fonts/ibm-plex-mono.ttf"),
        ]);
        if (cancelled) return;
        setFonts({ display, mono });
        let stored: Scene | null = null;
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) {
            const v: unknown = JSON.parse(raw);
            if (validateScene(v)) {
              stored = verifySources(v);
              restoreRef.current = stored;
            } else
              setStatus(
                "[DRAFT NOT RESTORED] The saved version is unsupported. Start fresh or use a saved export.",
              );
          }
        } catch {
          setStorageAvailable(false);
        }
        const remix = new URLSearchParams(location.search).get("remix");
        let chosen = stored;
        if (location.hash.startsWith("#design=")) {
          chosen = verifySources(decodeScene(location.hash.slice(8)));
          setStatus("[SHARED DESIGN] Anyone with this link can read its contents.");
        } else if (remix) {
          const poster = posters.find((p) => p.slug === remix);
          if (!poster || !canRemix(poster) || !poster.studioLayers)
            throw new Error(
              "[REMIX BLOCKED] This poster is missing or does not permit derivatives.",
            );
          chosen = structuredClone(poster.studioLayers);
          const credit = sourceCredit(poster, artistFor(poster.artist).name);
          chosen.layers = chosen.layers.map((l) => ({ ...l, credit }));
          setStatus(
            `[REMIX READY] ${poster.title} / ${poster.license}. Source credits are retained.`,
          );
        } else
          setStatus(
            stored
              ? "[RESTORED] Your latest browser-local draft is ready."
              : "[READY] Your draft autosaves in this browser. Nothing is uploaded.",
          );
        if (chosen) {
          dispatch({ type: "reset", scene: chosen });
          setSelected(chosen.layers[0]?.id ?? null);
        }
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          setFailure(error instanceof Error ? error.message : "The Studio could not load.");
          setReady(true);
        }
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!ready || !fonts) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(scene));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [scene, ready, fonts]);
  const patch = useCallback(
    (update: Partial<Layer>) => {
      if (!selectedLayer || selectedLayer.locked) return;
      const inks = [...new Set(scene.layers.filter((l) => l.kind !== "image").map((l) => l.color))];
      if (update.color && !inks.includes(update.color) && inks.length >= scene.colors) {
        commit({
          ...scene,
          layers: scene.layers.map((l) =>
            l.color === selectedLayer.color ? { ...l, color: update.color! } : l,
          ),
        });
        setStatus(
          "[INK REPLACED] This print mode is full. The matching ink was replaced throughout the composition.",
        );
        return;
      }
      commit({
        ...scene,
        layers: scene.layers.map((l) => (l.id === selected ? { ...l, ...update } : l)),
      });
    },
    [selectedLayer, scene, selected, commit],
  );
  const remove = useCallback(() => {
    if (!selectedLayer || selectedLayer.locked) return;
    commit({ ...scene, layers: scene.layers.filter((l) => l.id !== selected) });
    setSelected(null);
  }, [scene, selected, selectedLayer, commit]);
  const duplicate = useCallback(() => {
    if (!selectedLayer || scene.layers.length >= 80) return;
    const copy = {
      ...selectedLayer,
      id: crypto.randomUUID(),
      x: selectedLayer.x + 15,
      y: selectedLayer.y + 15,
      name: `${selectedLayer.name} copy`,
      locked: false,
    };
    commit({ ...scene, layers: [...scene.layers, copy] });
    setSelected(copy.id);
  }, [selectedLayer, scene, commit]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) || element.isContentEditable)
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicate();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        remove();
      } else if (selectedLayer && !selectedLayer.locked && event.key.startsWith("Arrow")) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        patch({
          x:
            selectedLayer.x +
            (event.key === "ArrowRight" ? amount : event.key === "ArrowLeft" ? -amount : 0),
          y:
            selectedLayer.y +
            (event.key === "ArrowDown" ? amount : event.key === "ArrowUp" ? -amount : 0),
        });
      } else if (event.key === "Escape") {
        setSelected(null);
        setPan(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selectedLayer, patch, duplicate, remove]);
  function add(kind: Layer["kind"]) {
    if (scene.layers.length >= 80) {
      setFailure("[LIMIT] This Studio supports up to 80 layers.");
      return;
    }
    const layer = newLayer(kind);
    const inks = [...new Set(scene.layers.filter((l) => l.kind !== "image").map((l) => l.color))];
    if (!inks.includes(layer.color) && inks.length >= scene.colors) layer.color = inks[0];
    commit({ ...scene, layers: [...scene.layers, layer] });
    setSelected(layer.id);
    setMobileTab("controls");
  }
  function addSource(slug: string) {
    const p = posters.find((p) => p.slug === slug);
    if (!p || !canRemix(p) || !p.studioLayers) return;
    const source = p.studioLayers.layers.find((l) => l.kind !== "text") ?? p.studioLayers.layers[0];
    const layer = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      x: 80,
      y: 300,
      width: 260,
      height: 200,
      credit: sourceCredit(p, artistFor(p.artist).name),
    };
    const inks = [...new Set(scene.layers.filter((l) => l.kind !== "image").map((l) => l.color))];
    if (!inks.includes(layer.color) && inks.length >= scene.colors) layer.color = inks[0];
    try {
      assertExportable({ ...scene, layers: [...scene.layers, layer] });
      commit({ ...scene, layers: [...scene.layers, layer] });
      setSelected(layer.id);
    } catch (error) {
      setFailure(String(error));
    }
  }
  function reorder(id: string, delta: number) {
    const layers = [...scene.layers];
    const i = layers.findIndex((l) => l.id === id);
    const next = i + delta;
    if (i < 0 || next < 0 || next >= layers.length || layers[i].locked) return;
    [layers[i], layers[next]] = [layers[next], layers[i]];
    commit({ ...scene, layers });
  }
  function point(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? p.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
  }
  function startDrag(
    e: React.PointerEvent,
    layer: Layer,
    mode: "move" | "resize" | "rotate" = "move",
  ) {
    if (pan || layer.locked) return;
    e.stopPropagation();
    setSelected(layer.id);
    const p = point(e);
    dragRef.current = { id: layer.id, startX: p.x, startY: p.y, layer, mode };
    svgRef.current?.setPointerCapture(e.pointerId);
  }
  function down(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      dragRef.current = null;
      setLiveLayer(null);
      const ps = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      svgRef.current?.setPointerCapture(e.pointerId);
    }
    if (pan && scrollRef.current) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: scrollRef.current.scrollLeft,
        top: scrollRef.current.scrollTop,
      };
      svgRef.current?.setPointerCapture(e.pointerId);
    }
  }
  function move(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId))
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const ps = [...pointers.current.values()];
      const distance = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      if (pinchDistance.current)
        setZoom((z) => Math.max(0.5, Math.min(2.5, (z * distance) / pinchDistance.current)));
      pinchDistance.current = distance;
      return;
    }
    if (panStart.current && scrollRef.current) {
      scrollRef.current.scrollLeft = panStart.current.left - e.clientX + panStart.current.x;
      scrollRef.current.scrollTop = panStart.current.top - e.clientY + panStart.current.y;
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    const p = point(e);
    const dx = p.x - d.startX,
      dy = p.y - d.startY;
    let l = { ...d.layer };
    const snapTo = (n: number) => (snap ? Math.round(n / 10) * 10 : Math.round(n));
    if (d.mode === "move")
      l = {
        ...l,
        x: snapTo(Math.max(-1000, Math.min(2000, l.x + dx))),
        y: snapTo(Math.max(-1000, Math.min(2000, l.y + dy))),
      };
    else if (d.mode === "resize")
      l = {
        ...l,
        width: Math.min(2000, Math.max(20, snapTo(l.width + dx))),
        height: Math.min(2000, Math.max(20, snapTo(l.height + dy))),
        fontSize:
          l.kind === "text"
            ? Math.max(6, Math.min(600, (l.fontSize * (l.width + dx)) / l.width))
            : l.fontSize,
      };
    else
      l.rotation = Math.max(
        -180,
        Math.min(
          180,
          Math.round(
            (Math.atan2(p.y - l.y - l.height / 2, p.x - l.x - l.width / 2) * 180) / Math.PI + 90,
          ),
        ),
      );
    setLiveLayer(l);
  }
  function end(e: React.PointerEvent, cancel = false) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDistance.current = 0;
    if (dragRef.current && liveLayer && !cancel)
      commit({
        ...scene,
        layers: scene.layers.map((l) => (l.id === liveLayer.id ? liveLayer : l)),
      });
    dragRef.current = null;
    setLiveLayer(null);
    panStart.current = null;
    if (svgRef.current?.hasPointerCapture(e.pointerId))
      svgRef.current.releasePointerCapture(e.pointerId);
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    if (scene.layers.length >= 80) {
      setFailure("[LIMIT] Remove a layer before adding an image.");
      return;
    }
    setBusy(true);
    setFailure("");
    try {
      const image = await importImage(file);
      if (image.data.length > 8_000_000)
        throw new Error(
          "This re-encoded image is too large for a browser-local draft. Choose a smaller image.",
        );
      const layer = {
        ...newLayer("image"),
        image: image.data,
        name: "Local image (metadata stripped)",
        width: 350,
        height: (350 * image.height) / image.width,
      };
      commit({ ...scene, layers: [...scene.layers, layer] });
      setSelected(layer.id);
      setStatus(
        "[IMAGE IMPORTED] EXIF/GPS discarded by local PNG re-encoding. Visible image contents can still identify people. Uploads do not leave your browser.",
      );
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Image import failed.");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }
  async function exportNow(format: Parameters<typeof exportFile>[2]) {
    if (!fonts) return;
    setBusy(true);
    setFailure("");
    setStatus(`[EXPORTING ${format}] Preparing your file…`);
    try {
      verifySources(scene);
      await exportFile(scene, fonts, format);
      setStatus(`[EXPORTED ${format}] Check the file and a sample print. Credits are included.`);
    } catch (error) {
      setFailure(
        `[EXPORT FAILED] ${error instanceof Error ? error.message : "Try a smaller preset or SVG."}`,
      );
      setStatus("Your draft is still here. Choose another format or retry.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    setFailure("");
    try {
      const encoded = encodeScene(scene);
      const link = `${location.origin}/studio/#design=${encoded}`;
      setShareLink(link);
      if (navigator.clipboard) await navigator.clipboard.writeText(link);
      setStatus(
        "[SHARE LINK READY] Anyone with the link can read this design. It contains no uploaded image.",
      );
    } catch (error) {
      setFailure(
        error instanceof Error ? error.message : "Copy is unavailable; use the displayed link.",
      );
    }
  }
  function fresh() {
    dispatch({ type: "reset", scene: freshScene() });
    setSelected("headline");
    restoreRef.current = null;
    setShareLink("");
    setFailure("");
    historyReplace();
    try {
      localStorage.removeItem(KEY);
    } catch {
      setStorageAvailable(false);
    }
    setStatus("[FRESH START] Previous draft removed. This new composition will autosave locally.");
  }
  function historyReplace() {
    window.history.replaceState(null, "", "/studio/");
  }
  const inks = [
    ...new Set(scene.layers.filter((l) => !l.hidden && l.kind !== "image").map((l) => l.color)),
  ];
  if (!fonts)
    return (
      <div className="studio-loading" role="status">
        <p>{failure || status}</p>
        <button className="button" onClick={() => location.reload()}>
          [RETRY]
        </button>
        <a className="button" href="/collection/">
          [DOWNLOAD A POSTER]
        </a>
      </div>
    );
  const displayScene = liveLayer
    ? { ...scene, layers: scene.layers.map((l) => (l.id === liveLayer.id ? liveLayer : l)) }
    : scene;
  const body = sceneSvg(displayScene, fonts, separation)
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  return (
    <section className="studio-workspace" aria-label="Poster-making Studio">
      <div className="studio-toolbar">
        <div>
          <button
            onClick={() => dispatch({ type: "undo" })}
            disabled={!history.past.length || busy}
          >
            [UNDO]
          </button>
          <button
            onClick={() => dispatch({ type: "redo" })}
            disabled={!history.future.length || busy}
          >
            [REDO]
          </button>
          <button onClick={fresh} disabled={busy}>
            [START FRESH]
          </button>
          <button
            onClick={() => {
              if (restoreRef.current) {
                commit(structuredClone(restoreRef.current));
                setStatus("[RESTORED] The draft saved when you opened this session.");
              }
            }}
            disabled={!restoreRef.current || busy}
          >
            [RESTORE]
          </button>
        </div>
        <div>
          <button onClick={() => void share()} disabled={busy}>
            [SHARE LINK]
          </button>
          <button className="accent" onClick={() => void exportNow("PDF")} disabled={busy}>
            [EXPORT PDF] ↓
          </button>
        </div>
      </div>
      {failure && (
        <p role="alert" className="studio-notice failure">
          {failure}
        </p>
      )}
      <p role="status" className="studio-notice">
        {status}
        {busy && " Please wait."}
      </p>
      {!storageAvailable && (
        <p className="studio-notice failure" role="status">
          [STORAGE UNAVAILABLE] Your draft cannot autosave. Export a file before leaving.
        </p>
      )}
      {shareLink && (
        <label className="studio-notice">
          SHARE LINK (PRIVATE CONTENT BECOMES READABLE TO RECIPIENTS)
          <input
            className="share-input"
            value={shareLink}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
      <div className="studio-grid">
        <aside className={`studio-panel shelf ${mobileTab === "elements" ? "mobile-open" : ""}`}>
          <h2>[01] ELEMENTS</h2>
          <div className="element-buttons">
            {(
              [
                "text",
                "rectangle",
                "circle",
                "star",
                "arrow",
                "halftone",
                "grain",
              ] as Layer["kind"][]
            ).map((kind) => (
              <button key={kind} onClick={() => add(kind)} disabled={busy}>
                + {kind.toUpperCase()}
              </button>
            ))}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            ref={uploadRef}
            className="sr-only"
            aria-label="Import a local image"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <button onClick={() => uploadRef.current?.click()} disabled={busy}>
            [IMPORT IMAGE]
          </button>
          <p className="small">
            Local only. EXIF/GPS stripped on import. Images downsample to 1,800 px; use
            high-resolution vector elements for large prints.
          </p>
          <h3>REMIX-ELIGIBLE SHELF</h3>
          <label className="control">
            Find an element
            <input
              value={shelfQuery}
              onChange={(e) => setShelfQuery(e.target.value)}
              placeholder="Search source titles"
            />
          </label>
          <div className="source-shelf">
            {posters
              .filter(
                (p) => canRemix(p) && p.title.toLowerCase().includes(shelfQuery.toLowerCase()),
              )
              .slice(0, 8)
              .map((p) => (
                <button key={p.slug} onClick={() => addSource(p.slug)}>
                  + {p.title}
                  <span>{p.license}</span>
                </button>
              ))}
          </div>
          <h3>[LAYERS] TOP FIRST</h3>
          <div className="layer-list">
            {[...scene.layers].reverse().map((l, i) => (
              <div className={selected === l.id ? "layer selected" : "layer"} key={l.id}>
                <button
                  className="layer-name"
                  aria-pressed={selected === l.id}
                  onClick={() => {
                    setSelected(l.id);
                    setMobileTab("controls");
                  }}
                >
                  {l.name} {l.hidden ? "[HIDDEN]" : ""}
                </button>
                <div>
                  <button
                    aria-label={`${l.locked ? "Unlock" : "Lock"} ${l.name}`}
                    aria-pressed={l.locked}
                    onClick={() =>
                      commit({
                        ...scene,
                        layers: scene.layers.map((v) =>
                          v.id === l.id ? { ...v, locked: !v.locked } : v,
                        ),
                      })
                    }
                  >
                    {l.locked ? "LOCKED" : "LOCK"}
                  </button>
                  <button
                    aria-label={`${l.hidden ? "Show" : "Hide"} ${l.name}`}
                    aria-pressed={l.hidden}
                    onClick={() =>
                      commit({
                        ...scene,
                        layers: scene.layers.map((v) =>
                          v.id === l.id ? { ...v, hidden: !v.hidden } : v,
                        ),
                      })
                    }
                  >
                    {l.hidden ? "SHOW" : "HIDE"}
                  </button>
                  <button
                    disabled={i === 0 || l.locked}
                    aria-label={`Bring ${l.name} forward`}
                    onClick={() => reorder(l.id, 1)}
                  >
                    ↑
                  </button>
                  <button
                    disabled={i === scene.layers.length - 1 || l.locked}
                    aria-label={`Send ${l.name} back`}
                    onClick={() => reorder(l.id, -1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className={`canvas-panel ${mobileTab === "canvas" ? "mobile-open" : ""}`}>
          <div className="canvas-controls">
            <label>
              Paper
              <select
                aria-label="Paper preset"
                value={scene.preset}
                onChange={(e) => commit({ ...scene, preset: e.target.value as PresetId })}
              >
                {Object.keys(PRESETS).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Zoom
              <input
                type="range"
                min=".5"
                max="2.5"
                step=".1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </label>
            <button aria-pressed={pan} onClick={() => setPan(!pan)}>
              [{pan ? "PAN ON" : "PAN"}]
            </button>
            <button aria-pressed={snap} onClick={() => setSnap(!snap)}>
              [{snap ? "SNAP ON" : "SNAP OFF"}]
            </button>
            <button
              onClick={() => {
                setZoom(1);
                if (scrollRef.current) {
                  scrollRef.current.scrollLeft = 0;
                  scrollRef.current.scrollTop = 0;
                }
              }}
            >
              [FIT]
            </button>
          </div>
          <div
            className="canvas-scroll"
            ref={scrollRef}
            tabIndex={0}
            role="region"
            aria-label="Canvas viewport"
          >
            <div
              className="paper-wrap"
              style={{ width: `${zoom * 100}%`, maxWidth: `${520 * zoom}px` }}
            >
              <svg
                ref={svgRef}
                className="studio-paper"
                viewBox={`0 0 ${dim.width} ${dim.height}`}
                role="img"
                aria-label="Poster canvas. Choose a layer in the layer list to edit with labelled controls or arrow keys."
                onPointerDownCapture={down}
                onPointerDown={() => {
                  if (!pan) setSelected(null);
                }}
                onPointerMove={move}
                onPointerUp={(e) => end(e)}
                onPointerCancel={(e) => end(e, true)}
              >
                <g dangerouslySetInnerHTML={{ __html: body }} />
                {displayScene.layers
                  .filter((l) => !l.hidden)
                  .map((l) => (
                    <g
                      key={l.id}
                      transform={`translate(${l.x} ${l.y}) rotate(${l.rotation} ${l.width / 2} ${l.height / 2})`}
                      onPointerDown={(e) => startDrag(e, l)}
                    >
                      <rect
                        width={l.width}
                        height={l.height}
                        fill="transparent"
                        stroke={selected === l.id ? "#151515" : "none"}
                        strokeWidth={selected === l.id ? 3 : 0}
                        strokeDasharray={selected === l.id ? "9 5" : undefined}
                      />
                      {selected === l.id && !l.locked && (
                        <>
                          <rect
                            x={l.width - 12}
                            y={l.height - 12}
                            width="24"
                            height="24"
                            fill="#f3f0e6"
                            stroke="#151515"
                            strokeWidth="3"
                            onPointerDown={(e) => startDrag(e, l, "resize")}
                          />
                          <circle
                            cx={l.width / 2}
                            cy="-25"
                            r="12"
                            fill="#f3f0e6"
                            stroke="#151515"
                            strokeWidth="3"
                            onPointerDown={(e) => startDrag(e, l, "rotate")}
                          />
                        </>
                      )}
                    </g>
                  ))}
              </svg>
            </div>
          </div>
          <p className="small">
            Drag / resize at the lower-right handle / rotate above. Use layer controls on any
            device. Two fingers zoom; Pan moves the viewport.
          </p>
          <div className="ink-preview">
            <label>
              Print mode
              <select
                value={scene.colors}
                onChange={(e) => {
                  const colors = Number(e.target.value) as 1 | 2 | 3;
                  const allowed = PALETTE.slice(0, colors);
                  commit({
                    ...scene,
                    colors,
                    layers: scene.layers.map((l) => ({
                      ...l,
                      color: allowed.includes(l.color) ? l.color : allowed[0],
                    })),
                  });
                }}
              >
                <option value={1}>1 ink</option>
                <option value={2}>2 inks</option>
                <option value={3}>3 inks</option>
              </select>
            </label>
            <label>
              Separation preview
              <select value={separation} onChange={(e) => setSeparation(e.target.value)}>
                <option value="">Composite</option>
                {inks.map((ink, i) => (
                  <option value={ink} key={ink}>
                    Ink {i + 1} / {ink}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small">
            Uncalibrated riso/screenprint preview, not a press-ready plate. Uploaded images remain
            full colour.
          </p>
          {!scene.layers.length && (
            <div className="notice">[EMPTY CANVAS] Add an element from the shelf.</div>
          )}
        </div>
        <aside
          className={`studio-panel properties ${mobileTab === "controls" ? "mobile-open" : ""}`}
        >
          <h2>[02] CONTROLS</h2>
          <label className="control">
            Paper colour
            <input
              type="color"
              value={scene.background}
              onChange={(e) => commit({ ...scene, background: e.target.value })}
            />
          </label>
          {selectedLayer ? (
            <fieldset disabled={selectedLayer.locked || busy}>
              <legend>
                {selectedLayer.name} {selectedLayer.locked ? "[LOCKED]" : ""}
              </legend>
              <label className="control">
                Layer name
                <input
                  maxLength={100}
                  value={selectedLayer.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </label>
              {selectedLayer.kind === "text" && (
                <>
                  <label className="control">
                    Words
                    <textarea
                      aria-label="Words"
                      rows={4}
                      maxLength={1500}
                      value={selectedLayer.text}
                      onChange={(e) => patch({ text: e.target.value })}
                    />
                  </label>
                  <label className="control">
                    Font
                    <select
                      value={selectedLayer.font}
                      onChange={(e) => patch({ font: e.target.value as Layer["font"] })}
                    >
                      <option value="display">Bebas Neue / condensed</option>
                      <option value="mono">IBM Plex Mono</option>
                    </select>
                  </label>
                  <label className="control">
                    Type size
                    <input
                      type="number"
                      min={6}
                      max={600}
                      value={selectedLayer.fontSize}
                      onChange={(e) =>
                        patch({ fontSize: Math.max(6, Math.min(600, Number(e.target.value))) })
                      }
                    />
                  </label>
                </>
              )}
              <label className="control">
                Ink colour
                <input
                  aria-label="Ink colour"
                  type="color"
                  value={selectedLayer.color}
                  onChange={(e) => patch({ color: e.target.value })}
                />
              </label>
              <div className="swatches">
                {PALETTE.slice(0, scene.colors).map((ink, i) => (
                  <button
                    style={{ background: ink, color: ink === "#151515" ? "#f3f0e6" : "#151515" }}
                    key={ink}
                    aria-label={`Ink ${i + 1}: ${ink}`}
                    aria-pressed={selectedLayer.color === ink}
                    onClick={() => patch({ color: ink })}
                  >
                    {selectedLayer.color === ink ? "✓" : String(i + 1)}
                  </button>
                ))}
              </div>
              <div className="coordinate-grid">
                {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
                  <label className="control" key={key}>
                    {key}
                    <input
                      type="number"
                      value={selectedLayer[key]}
                      min={
                        key === "rotation" ? -180 : key === "width" || key === "height" ? 10 : -1000
                      }
                      max={key === "rotation" ? 180 : 2000}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n))
                          patch({
                            [key]: Math.max(
                              key === "rotation"
                                ? -180
                                : key === "width" || key === "height"
                                  ? 10
                                  : -1000,
                              Math.min(key === "rotation" ? 180 : 2000, n),
                            ),
                          });
                      }}
                    />
                  </label>
                ))}
              </div>
              <button onClick={duplicate}>[DUPLICATE]</button>
              <button className="remove" onClick={remove}>
                [REMOVE LAYER]
              </button>
              {selectedLayer.credit && (
                <p className="small">
                  SOURCE: {selectedLayer.credit.title}
                  <br />
                  {selectedLayer.credit.artist}
                  <br />
                  {selectedLayer.credit.license}
                </p>
              )}
            </fieldset>
          ) : (
            <p>Choose a layer, or add an element.</p>
          )}
          <h3>[EXPORT]</h3>
          <div className="export-buttons">
            {(["PDF", "PNG", "SVG", "TILED", "SEPARATIONS"] as const).map((format) => (
              <button key={format} disabled={busy} onClick={() => void exportNow(format)}>
                {format === "PNG"
                  ? "PNG / 300 PPI"
                  : format === "TILED"
                    ? "A4 TILED PDF"
                    : format === "SEPARATIONS"
                      ? "INK PREVIEWS ZIP"
                      : `${format} ↓`}
              </button>
            ))}
          </div>
          <p className="small">
            PNG uses 300 PPI for paper presets; Social is 1080 × 1350 px. PDF/SVG have outlined
            vector type. Credit strip is automatic.
          </p>
          <details>
            <summary>[CREDITS / SHORTCUTS]</summary>
            {creditLines(scene).map((line, i) => (
              <p className="small" key={i}>
                {line}
              </p>
            ))}
            <p className="small">
              Ctrl/Cmd+Z undo · Shift+Z redo · Ctrl/Cmd+D duplicate · arrows nudge · Shift+arrows 10
              units · Delete remove · Escape deselect.
            </p>
          </details>
        </aside>
      </div>
      <nav className="studio-mobile-toolbar" aria-label="Studio mobile tools">
        {["elements", "canvas", "controls"].map((tab) => (
          <button key={tab} aria-pressed={mobileTab === tab} onClick={() => setMobileTab(tab)}>
            [{tab.toUpperCase()}]
          </button>
        ))}
        <button onClick={() => void exportNow("PDF")} disabled={busy}>
          [EXPORT]
        </button>
      </nav>
    </section>
  );
}
