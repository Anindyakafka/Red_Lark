import type { Layer } from "@/lib/types";
export type Point = { x: number; y: number };
export type CropRect = { x: number; y: number; width: number; height: number };
export type CropHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "move";
export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export function localPoint(layer: Layer, point: Point): Point {
  const radians = (-layer.rotation * Math.PI) / 180;
  const dx = point.x - layer.x - layer.width / 2,
    dy = point.y - layer.y - layer.height / 2;
  return {
    x: dx * Math.cos(radians) - dy * Math.sin(radians) + layer.width / 2,
    y: dx * Math.sin(radians) + dy * Math.cos(radians) + layer.height / 2,
  };
}
export function worldPoint(layer: Layer, point: Point): Point {
  const radians = (layer.rotation * Math.PI) / 180;
  const dx = point.x - layer.width / 2,
    dy = point.y - layer.height / 2;
  return {
    x: layer.x + layer.width / 2 + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: layer.y + layer.height / 2 + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}
export function cropImageFrame(layer: Layer) {
  const crop = layer.crop ?? FULL_CROP;
  return {
    x: (-crop.x * layer.width) / crop.width,
    y: (-crop.y * layer.height) / crop.height,
    width: layer.width / crop.width,
    height: layer.height / crop.height,
  };
}
export function imagePoint(layer: Layer, point: Point): Point {
  const local = localPoint(layer, point),
    frame = cropImageFrame(layer);
  return { x: (local.x - frame.x) / frame.width, y: (local.y - frame.y) / frame.height };
}
/** Crop in normalized original-image coordinates, keeping the opposite edge/corner anchored. */
export function resizeCrop(
  rect: CropRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  ratio?: number,
  minimum = { x: 0.02, y: 0.02 },
): CropRect {
  const minX = minimum.x,
    minY = minimum.y;
  if (handle === "move")
    return {
      ...rect,
      x: clamp(rect.x + dx, 0, 1 - rect.width),
      y: clamp(rect.y + dy, 0, 1 - rect.height),
    };
  let left = rect.x,
    top = rect.y,
    right = rect.x + rect.width,
    bottom = rect.y + rect.height;
  if (!ratio) {
    if (handle.includes("w")) left = clamp(left + dx, 0, right - minX);
    if (handle.includes("e")) right = clamp(right + dx, left + minX, 1);
    if (handle.includes("n")) top = clamp(top + dy, 0, bottom - minY);
    if (handle.includes("s")) bottom = clamp(bottom + dy, top + minY, 1);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  const horizontal = handle.includes("w") || handle.includes("e"),
    vertical = handle.includes("n") || handle.includes("s");
  const anchorX = horizontal ? (handle.includes("w") ? right : left) : (left + right) / 2;
  const anchorY = vertical ? (handle.includes("n") ? bottom : top) : (top + bottom) / 2;
  const maxWidth = horizontal
    ? handle.includes("w")
      ? anchorX
      : 1 - anchorX
    : 2 * Math.min(anchorX, 1 - anchorX);
  const maxHeight = vertical
    ? handle.includes("n")
      ? anchorY
      : 1 - anchorY
    : 2 * Math.min(anchorY, 1 - anchorY);
  let width = rect.width + (handle.includes("w") ? -dx : handle.includes("e") ? dx : 0);
  const height = rect.height + (handle.includes("n") ? -dy : handle.includes("s") ? dy : 0);
  if (!horizontal || (vertical && Math.abs(dy / rect.height) > Math.abs(dx / rect.width)))
    width = height * ratio;
  const max = Math.max(Number.EPSILON, Math.min(maxWidth, maxHeight * ratio));
  width = clamp(width, Math.min(max, Math.max(minX, minY * ratio)), max);
  const adjustedHeight = width / ratio;
  return {
    x: horizontal ? (handle.includes("w") ? anchorX - width : anchorX) : anchorX - width / 2,
    y: vertical
      ? handle.includes("n")
        ? anchorY - adjustedHeight
        : anchorY
      : anchorY - adjustedHeight / 2,
    width,
    height: adjustedHeight,
  };
}
export function presetCrop(rect: CropRect, ratio: number): CropRect {
  let width = Math.min(rect.width, rect.height * ratio),
    height = width / ratio;
  if (width < 0.02 || height < 0.02) {
    width = Math.min(1, ratio);
    height = width / ratio;
  }
  return {
    x: clamp(rect.x + (rect.width - width) / 2, 0, 1 - width),
    y: clamp(rect.y + (rect.height - height) / 2, 0, 1 - height),
    width,
    height,
  };
}
export function applyCrop(layer: Layer, crop: CropRect): Layer {
  const old = layer.crop ?? FULL_CROP,
    frame = cropImageFrame(layer);
  const width = frame.width * crop.width,
    height = frame.height * crop.height;
  const center = worldPoint(layer, {
    x: (crop.x - old.x) * frame.width + width / 2,
    y: (crop.y - old.y) * frame.height + height / 2,
  });
  return { ...layer, x: center.x - width / 2, y: center.y - height / 2, width, height, crop };
}

export type View = { zoom: number; x: number; y: number };
export function zoomAt(view: View, zoom: number, anchor: Point): View {
  const next = clamp(zoom, 0.25, 4),
    ratio = next / view.zoom;
  return {
    zoom: next,
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
  };
}
export function gestureView(
  start: View,
  startMidpoint: Point,
  midpoint: Point,
  distanceRatio: number,
): View {
  const zoomed = zoomAt(start, start.zoom * distanceRatio, startMidpoint);
  return {
    ...zoomed,
    x: zoomed.x + midpoint.x - startMidpoint.x,
    y: zoomed.y + midpoint.y - startMidpoint.y,
  };
}
