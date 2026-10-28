"use client";
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import type { Layer, PosterGroup, Scene } from "@/lib/types";
import {
  applyCrop,
  clamp,
  cropImageFrame,
  FULL_CROP,
  imagePoint,
  presetCrop,
  resizeCrop,
  type CropHandle,
  type CropRect,
  type Point,
} from "./geometry";
type Session = {
  layer: Layer;
  draft: CropRect;
  locked: boolean;
  ratio: string;
  group?: PosterGroup;
};
export function useImageCrop(
  scene: Scene,
  selected: Layer | undefined,
  commit: (next: Scene) => void,
  point: (e: { clientX: number; clientY: number }) => Point,
  selectedGroup?: PosterGroup,
) {
  const [session, setSession] = useState<Session | null>(null);
  const drag = useRef<{ start: Point; draft: CropRect; handle: CropHandle } | null>(null);
  useEffect(() => {
    if (!session) return;
    const current = session.group
      ? scene.groups?.find((group) => group.id === session.group?.id)
      : scene.layers.find((layer) => layer.id === session.layer.id);
    const expected = session.group ?? session.layer;
    if (!current || JSON.stringify(current) !== JSON.stringify(expected)) {
      setSession(null);
      drag.current = null;
    }
  }, [scene, session]);
  function ratio(value: string, layer: Layer) {
    const frame = cropImageFrame(layer),
      aspect = frame.width / frame.height;
    return value === "original"
      ? 1
      : value === "square"
        ? 1 / aspect
        : value === "a-series"
          ? Math.SQRT1_2 / aspect
          : value === "social"
            ? 0.8 / aspect
            : value === "wide"
              ? 16 / 9 / aspect
              : undefined;
  }
  function minimum(layer: Layer) {
    const frame = cropImageFrame(layer);
    return { x: Math.max(0.02, 10 / frame.width), y: Math.max(0.02, 10 / frame.height) };
  }
  function start() {
    if (!selected || selected.kind === "text" || selected.locked) return;
    const group = selectedGroup ? structuredClone(selectedGroup) : undefined;
    const layer = group
      ? {
          ...selected,
          id: group.id,
          kind: "rectangle" as const,
          x: group.x,
          y: group.y,
          width: group.width,
          height: group.height,
          rotation: group.rotation,
          crop: undefined,
        }
      : structuredClone(selected);
    setSession({
      layer,
      draft: group?.crop ?? selected.crop ?? FULL_CROP,
      locked: false,
      ratio: "free",
      group,
    });
  }
  function pointerStart(e: PointerEvent<SVGElement>, handle: CropHandle) {
    if (!session) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current = { start: imagePoint(session.layer, point(e)), draft: session.draft, handle };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!session || !drag.current) return false;
    const d = drag.current,
      p = imagePoint(session.layer, point(e));
    const locked =
      session.locked || e.shiftKey
        ? (ratio(session.ratio, session.layer) ?? d.draft.width / d.draft.height)
        : undefined;
    setSession({
      ...session,
      draft: resizeCrop(
        d.draft,
        d.handle,
        p.x - d.start.x,
        p.y - d.start.y,
        locked,
        minimum(session.layer),
      ),
    });
    return true;
  }
  function end(cancel = false) {
    const previous = drag.current?.draft;
    if (cancel && previous)
      setSession((current) => (current ? { ...current, draft: previous } : null));
    drag.current = null;
  }
  function nudge(e: KeyboardEvent<SVGElement>, handle: CropHandle) {
    if (!session || !e.key.startsWith("Arrow")) return;
    e.preventDefault();
    e.stopPropagation();
    const step = e.shiftKey ? 0.02 : 0.002;
    const locked = session.locked
      ? (ratio(session.ratio, session.layer) ?? session.draft.width / session.draft.height)
      : undefined;
    setSession({
      ...session,
      draft: resizeCrop(
        session.draft,
        handle,
        e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0,
        e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0,
        locked,
        minimum(session.layer),
      ),
    });
  }
  function chooseRatio(value: string) {
    if (!session) return;
    const chosen = ratio(value, session.layer);
    const draft = chosen ? presetCrop(FULL_CROP, chosen) : session.draft;
    const min = minimum(session.layer);
    // Keep an image too small for a preset intact; enlarge it before cropping.
    if (draft.width < min.x || draft.height < min.y) return;
    setSession({ ...session, ratio: value, locked: value !== "free", draft });
  }
  function numeric(key: keyof CropRect, value: number) {
    if (!session || !Number.isFinite(value)) return;
    const d = session.draft,
      min = minimum(session.layer);
    const locked = session.locked
      ? (ratio(session.ratio, session.layer) ?? d.width / d.height)
      : undefined;
    const next =
      key === "x" || key === "y"
        ? resizeCrop(
            d,
            key === "x" ? "w" : "n",
            key === "x" ? value - d.x : 0,
            key === "y" ? value - d.y : 0,
            locked,
            min,
          )
        : resizeCrop(
            d,
            key === "width" ? "e" : "s",
            key === "width" ? clamp(value, min.x, 1) - d.width : 0,
            key === "height" ? clamp(value, min.y, 1) - d.height : 0,
            locked,
            min,
          );
    setSession({ ...session, draft: next });
  }
  return {
    session,
    start,
    pointerStart,
    move,
    end,
    nudge,
    chooseRatio,
    numeric,
    cancel: () => {
      drag.current = null;
      setSession(null);
    },
    reset: () =>
      setSession((current) =>
        current ? { ...current, draft: FULL_CROP, locked: false, ratio: "free" } : null,
      ),
    lock: (locked: boolean) => setSession((current) => (current ? { ...current, locked } : null)),
    apply: () => {
      if (!session) return;
      commit(
        session.group
          ? {
              ...scene,
              groups: scene.groups?.map((group) =>
                group.id === session.group?.id ? { ...group, crop: session.draft } : group,
              ),
            }
          : {
              ...scene,
              layers: scene.layers.map((layer) =>
                layer.id === session.layer.id ? applyCrop(session.layer, session.draft) : layer,
              ),
            },
      );
      setSession(null);
      drag.current = null;
    },
  };
}
