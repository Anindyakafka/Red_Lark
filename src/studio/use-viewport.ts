"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { gestureView, zoomAt, type Point, type View } from "./geometry";
type Gesture =
  | { kind: "pan"; start: View; point: Point }
  | { kind: "pinch"; start: View; midpoint: Point; distance: number }
  | { kind: "blocked" };
export function useViewport(width: number, height: number, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState({ width: 520, height: (520 * height) / width });
  const [view, setView] = useState<View>({ zoom: 1, x: 24, y: 24 });
  const current = useRef(view),
    fitted = useRef(base);
  const hovered = useRef(false);
  const points = useRef(new Map<number, Point>()),
    gesture = useRef<Gesture | null>(null),
    space = useRef(false);
  const first = useRef<{ point: Point; time: number; multi: boolean } | null>(null),
    tap = useRef<{ point: Point; time: number } | null>(null);
  function update(next: View) {
    current.current = next;
    setView(next);
  }
  function position(e: { clientX: number; clientY: number }): Point {
    const bounds = ref.current!.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left - ref.current!.clientLeft,
      y: e.clientY - bounds.top - ref.current!.clientTop,
    };
  }
  function fit() {
    const el = ref.current;
    if (!el) return;
    update({
      zoom: 1,
      x: (el.clientWidth - fitted.current.width) / 2,
      y: (el.clientHeight - fitted.current.height) / 2,
    });
  }
  function setZoom(zoom: number) {
    const el = ref.current;
    if (el)
      update(zoomAt(current.current, zoom, { x: el.clientWidth / 2, y: el.clientHeight / 2 }));
  }
  function fitBounds(bounds: { x: number; y: number; width: number; height: number }) {
    const el = ref.current;
    if (!el) return;
    const scale = fitted.current.width / width;
    const zoom = Math.max(
      0.25,
      Math.min(
        4,
        (el.clientWidth - 96) / (bounds.width * scale),
        (el.clientHeight - 96) / (bounds.height * scale),
      ),
    );
    update({
      zoom,
      x: el.clientWidth / 2 - (bounds.x + bounds.width / 2) * scale * zoom,
      y: el.clientHeight / 2 - (bounds.y + bounds.height / 2) * scale * zoom,
    });
  }
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const resize = () => {
      const w = Math.max(
        40,
        Math.min(el.clientWidth - 40, ((el.clientHeight - 40) * width) / height),
      );
      const next = { width: w, height: (w * height) / width };
      fitted.current = next;
      setBase(next);
      const value = {
        zoom: 1,
        x: (el.clientWidth - next.width) / 2,
        y: (el.clientHeight - next.height) / 2,
      };
      current.current = value;
      setView(value);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const wheel = (e: WheelEvent) => {
      if (!e.cancelable) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const next = zoomAt(
          current.current,
          current.current.zoom * Math.exp(-e.deltaY * unit * 0.002),
          { x: e.clientX - r.left - el.clientLeft, y: e.clientY - r.top - el.clientTop },
        );
        current.current = next;
        setView(next);
      } else {
        const next = {
          ...current.current,
          x: current.current.x - e.deltaX * unit,
          y: current.current.y - e.deltaY * unit,
        };
        current.current = next;
        setView(next);
      }
    };
    const prevent = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    for (const name of ["gesturestart", "gesturechange", "gestureend"])
      el.addEventListener(name, prevent, { passive: false });
    const keydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.code === "Space" &&
        !target.closest("input,textarea,select,button,summary,[contenteditable='true']")
      ) {
        space.current = true;
        if (el.contains(target) || hovered.current) e.preventDefault();
      }
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    const blur = () => {
      space.current = false;
      points.current.clear();
      gesture.current = null;
      hovered.current = false;
    };
    const enter = () => {
        hovered.current = true;
      },
      leave = () => {
        hovered.current = false;
      };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", wheel);
      for (const name of ["gesturestart", "gesturechange", "gestureend"])
        el.removeEventListener(name, prevent);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [width, height, enabled]);
  function down(e: PointerEvent, panTool: boolean) {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return false;
    const p = position(e);
    points.current.set(e.pointerId, p);
    // Capture on the entire viewport; cropped SVG handles may take capture afterwards.
    ref.current?.setPointerCapture(e.pointerId);
    if (points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      gesture.current = {
        kind: "pinch",
        start: current.current,
        midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      };
      if (first.current) first.current.multi = true;
      tap.current = null;
      e.preventDefault();
      return true;
    }
    const target = e.target as Element;
    const empty = !target.closest("[data-layer-id],[data-crop-handle]");
    if (points.current.size === 1) {
      first.current = { point: p, time: performance.now(), multi: false };
      gesture.current =
        panTool || space.current || e.button === 1 || empty
          ? { kind: "pan", start: current.current, point: p }
          : null;
      if (gesture.current) e.preventDefault();
    }
    return false;
  }
  function move(e: PointerEvent) {
    if (!points.current.has(e.pointerId)) return false;
    const p = position(e);
    points.current.set(e.pointerId, p);
    const g = gesture.current;
    if (points.current.size >= 2 && g?.kind === "pinch") {
      const [a, b] = [...points.current.values()];
      update(
        gestureView(
          g.start,
          g.midpoint,
          { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          Math.hypot(a.x - b.x, a.y - b.y) / g.distance,
        ),
      );
      return true;
    }
    if (g?.kind === "pan") {
      update({ ...g.start, x: g.start.x + p.x - g.point.x, y: g.start.y + p.y - g.point.y });
      return true;
    }
    return g?.kind === "blocked";
  }
  function end(e: PointerEvent, cancel = false) {
    const wasGesture = Boolean(gesture.current),
      p = position(e),
      start = first.current;
    points.current.delete(e.pointerId);
    if (
      (e.pointerType === "touch" || (e.pointerType === "mouse" && e.button === 0)) &&
      !cancel &&
      points.current.size === 0 &&
      start &&
      !start.multi &&
      performance.now() - start.time < 300 &&
      Math.hypot(p.x - start.point.x, p.y - start.point.y) < 8
    ) {
      const previous = tap.current;
      if (
        previous &&
        performance.now() - previous.time < 350 &&
        Math.hypot(p.x - previous.point.x, p.y - previous.point.y) <
          (e.pointerType === "touch" ? 30 : 6)
      ) {
        fit();
        tap.current = null;
      } else tap.current = { point: p, time: performance.now() };
    }
    gesture.current = points.current.size ? { kind: "blocked" } : null;
    if (!points.current.size) first.current = null;
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    return wasGesture;
  }
  return {
    ref,
    base,
    view,
    fit,
    setZoom,
    fitBounds,
    down,
    move,
    end,
    isPanning: () => Boolean(gesture.current),
    overridesLayer: (e: { button: number }) =>
      space.current || e.button === 1 || points.current.size > 1,
  };
}
