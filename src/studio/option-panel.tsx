"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { UiText } from "@/i18n/client";

export type PanelId =
  "text" | "color" | "layers" | "images" | "shapes" | "paper" | "export" | "help";
export const PANELS: { id: PanelId; label: string }[] = [
  { id: "text", label: "Text / fonts" },
  { id: "color", label: "Colour / print" },
  { id: "layers", label: "Layers / transform" },
  { id: "images", label: "Images / captions" },
  { id: "shapes", label: "Shapes / effects" },
  { id: "paper", label: "Paper / background" },
  { id: "export", label: "Export / credits" },
  { id: "help", label: "Project / help" },
];
export function OptionPanel({
  id,
  open,
  close,
  children,
}: {
  id: PanelId;
  open: boolean;
  close: (restoreFocus?: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    root
      ?.querySelector<HTMLElement>("button,input,select,textarea,summary,[tabindex='0']")
      ?.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      const target = e.target;
      if (
        target instanceof Element &&
        !root?.contains(target) &&
        !target.closest("[data-studio-option]")
      )
        closeRef.current(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      ref={ref}
      id={`studio-option-${id}`}
      hidden={!open}
      className="studio-option-panel studio-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`studio-title-${id}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        }
        if (e.key === "Tab") {
          const focusable = Array.from(
            ref.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),summary,a[href],[tabindex='0']",
            ) ?? [],
          ).filter((el) => el.getClientRects().length);
          const first = focusable[0],
            last = focusable.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="studio-panel-heading">
        <h2 id={`studio-title-${id}`}>
          <UiText id={PANELS.find((p) => p.id === id)!.label} />
        </h2>
        <button type="button" onClick={() => close(true)}>
          <UiText id="Close options" />
        </button>
      </div>
      <div className="studio-panel-body">{children}</div>
    </div>
  );
}
