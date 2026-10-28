"use client";
import { useId, type PointerEvent, type KeyboardEvent } from "react";
import type { Layer } from "@/lib/types";
import { cropImageFrame, type CropHandle, type CropRect } from "./geometry";
import { useI18n } from "@/i18n/client";
export const CROP_HANDLES: { id: CropHandle; name: string; x: number; y: number }[] = [
  { id: "nw", name: "Crop top left", x: 0, y: 0 },
  { id: "n", name: "Crop top edge", x: 0.5, y: 0 },
  { id: "ne", name: "Crop top right", x: 1, y: 0 },
  { id: "e", name: "Crop right edge", x: 1, y: 0.5 },
  { id: "se", name: "Crop bottom right", x: 1, y: 1 },
  { id: "s", name: "Crop bottom edge", x: 0.5, y: 1 },
  { id: "sw", name: "Crop bottom left", x: 0, y: 1 },
  { id: "w", name: "Crop left edge", x: 0, y: 0.5 },
];
export function CropOverlay({
  layer,
  draft,
  scale,
  start,
  nudge,
  preview,
}: {
  layer: Layer;
  draft: CropRect;
  scale: number;
  start: (event: PointerEvent<SVGElement>, handle: CropHandle) => void;
  nudge: (event: KeyboardEvent<SVGElement>, handle: CropHandle) => void;
  preview?: string;
}) {
  const id = useId().replaceAll(":", ""),
    { t } = useI18n(),
    frame = cropImageFrame(layer);
  const box = {
    x: frame.x + draft.x * frame.width,
    y: frame.y + draft.y * frame.height,
    width: draft.width * frame.width,
    height: draft.height * frame.height,
  };
  const hit = 44 / Math.max(0.01, scale),
    mark = 12 / Math.max(0.01, scale);
  return (
    <g
      className="crop-overlay"
      transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation} ${layer.width / 2} ${layer.height / 2})`}
    >
      <defs>
        <mask
          id={`crop-mask-${id}`}
          maskUnits="userSpaceOnUse"
          x={frame.x}
          y={frame.y}
          width={frame.width}
          height={frame.height}
        >
          <rect {...frame} fill="white" />
          <rect {...box} fill="black" />
        </mask>
      </defs>
      {layer.kind === "image" ? (
        <image href={layer.image} {...frame} preserveAspectRatio="none" />
      ) : (
        <g dangerouslySetInnerHTML={{ __html: preview ?? "" }} />
      )}
      <rect
        {...frame}
        fill="#000"
        opacity=".6"
        mask={`url(#crop-mask-${id})`}
        pointerEvents="none"
      />
      <rect
        {...box}
        fill="transparent"
        stroke="white"
        strokeWidth={2 / scale}
        data-crop-handle="move"
        role="button"
        tabIndex={0}
        aria-label={t("Move crop area")}
        onPointerDown={(e) => start(e, "move")}
        onKeyDown={(e) => nudge(e, "move")}
      />
      {CROP_HANDLES.map((handle) => {
        const x = box.x + box.width * handle.x,
          y = box.y + box.height * handle.y;
        return (
          <g key={handle.id}>
            <rect
              x={x - mark / 2}
              y={y - mark / 2}
              width={mark}
              height={mark}
              fill="white"
              stroke="#151515"
              strokeWidth={2 / scale}
              pointerEvents="none"
            />
            <rect
              x={x - hit / 2}
              y={y - hit / 2}
              width={hit}
              height={hit}
              fill="transparent"
              data-crop-handle={handle.id}
              role="button"
              tabIndex={0}
              aria-label={t(handle.name)}
              style={{ cursor: `${handle.id}-resize` }}
              onPointerDown={(e) => start(e, handle.id)}
              onKeyDown={(e) => nudge(e, handle.id)}
            />
          </g>
        );
      })}
    </g>
  );
}
