"use client";

import { useEffect, useRef, useState } from "react";
import { previewText } from "@/lib/ticket-filters";

const DELAY_MS = 450;
const WIDTH = 520;

/**
 * Hover preview of a ticket's request text. Place it inside the row: it listens on the row itself,
 * shows after a short pause with a mouse (never on touch), and floats above the page so the list
 * card can't clip it.
 */
export function RequestPreview({ text }: { text: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const body = previewText(text);

  useEffect(() => {
    const row = anchor.current?.parentElement;
    if (!row || !body) return;
    let timer = 0;
    const hide = () => { window.clearTimeout(timer); setBox(null); };
    const show = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const rect = row.getBoundingClientRect();
        const left = Math.max(12, Math.min(rect.left + 96, window.innerWidth - WIDTH - 12));
        const below = window.innerHeight - rect.bottom > 280 || rect.top < 280;
        setBox(below ? { left, top: rect.bottom + 6 } : { left, bottom: window.innerHeight - rect.top + 6 });
      }, DELAY_MS);
    };
    row.addEventListener("pointerenter", show);
    row.addEventListener("pointerleave", hide);
    row.addEventListener("pointerdown", hide);
    window.addEventListener("scroll", hide, true);
    return () => { hide(); row.removeEventListener("pointerenter", show); row.removeEventListener("pointerleave", hide); row.removeEventListener("pointerdown", hide); window.removeEventListener("scroll", hide, true); };
  }, [body]);

  return (
    <span ref={anchor} className="contents">
      {box ? (
        <span role="tooltip" className="card pointer-events-none fixed z-50 block max-h-[260px] overflow-hidden whitespace-pre-wrap p-4 text-left text-xs font-normal leading-6 text-[var(--text)] shadow-2xl" style={{ ...box, width: `min(${WIDTH}px, calc(100vw - 24px))` }}>
          {body}
        </span>
      ) : null}
    </span>
  );
}
