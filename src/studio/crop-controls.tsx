"use client";
import { useEffect, useRef } from "react";
import { UiText } from "@/i18n/client";
import type { useImageCrop } from "./use-image-crop";
export function CropControls({ crop }: { crop: ReturnType<typeof useImageCrop> }) {
  const ref = useRef<HTMLDivElement>(null),
    active = Boolean(crop.session);
  useEffect(() => {
    if (active)
      ref.current?.querySelector<HTMLSelectElement>("select")?.focus({ preventScroll: true });
  }, [active]);
  const session = crop.session;
  if (!session) return null;
  return (
    <div ref={ref} className="crop-toolbar" role="region" aria-label="Image crop controls">
      <strong>
        <UiText id="Crop image" />
      </strong>
      <label>
        <UiText id="Crop ratio" />
        <select value={session.ratio} onChange={(e) => crop.chooseRatio(e.target.value)}>
          <option value="free">
            <UiText id="Free ratio" />
          </option>
          <option value="original">
            <UiText id="Original ratio" />
          </option>
          <option value="square">1:1</option>
          <option value="a-series">
            <UiText id="A-series ratio" />
          </option>
          <option value="social">4:5</option>
          <option value="wide">16:9</option>
        </select>
      </label>
      <label className="crop-lock">
        <input
          type="checkbox"
          checked={session.locked}
          onChange={(e) => crop.lock(e.target.checked)}
        />
        <UiText id="Lock crop ratio" />
      </label>
      <div className="crop-actions">
        <button onClick={crop.apply} className="accent">
          <UiText id="Apply crop" />
        </button>
        <button onClick={crop.cancel}>
          <UiText id="Cancel crop" />
        </button>
        <button onClick={crop.reset}>
          <UiText id="Reset crop" />
        </button>
      </div>
      <details>
        <summary>
          <UiText id="Crop dimensions" />
        </summary>
        <p className="small">
          <UiText id="Percent of the original image. Drag any edge or corner; move inside the crop. Shift locks the ratio. Arrow keys adjust a focused handle." />
        </p>
        <div className="coordinate-grid">
          {(["x", "y", "width", "height"] as const).map((key) => (
            <label className="control" key={key}>
              <UiText
                id={
                  {
                    x: "Crop left (%)",
                    y: "Crop top (%)",
                    width: "Crop width (%)",
                    height: "Crop height (%)",
                  }[key]
                }
              />
              <input
                type="number"
                step=".1"
                min={key === "x" || key === "y" ? 0 : 2}
                max={100}
                value={Math.round(session.draft[key] * 1000) / 10}
                onChange={(e) => crop.numeric(key, Number(e.target.value) / 100)}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
