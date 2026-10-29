"use client";

import { useCallback, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card wrapper whose border lights up with a soft radial glow that follows the
 * pointer. Pointer position is written to CSS custom properties via a ref, so
 * moving the pointer never re-renders. Hidden entirely under prefers-reduced-motion.
 */
export function BorderGlow({
  children,
  className,
  glowColor = "#47918F",
  radius = 16,
  spread = 180,
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  radius?: number;
  /** Radius (px) of the light spot. */
  spread?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
    el.style.setProperty("--glow-o", "1");
  }, []);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty("--glow-o", "0");
  }, []);

  const spot = (alpha: number) =>
    `radial-gradient(${spread}px circle at var(--x, 50%) var(--y, 0%), color-mix(in srgb, ${glowColor} ${alpha}%, transparent), transparent 70%)`;

  const layer: CSSProperties = {
    borderRadius: radius,
    opacity: "var(--glow-o, 0)",
    transition: "opacity 300ms ease",
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative isolate", className)}
      style={{ borderRadius: radius }}
    >
      {children}
      {/* Faint outer glow behind the card. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 -z-10 blur-xl motion-reduce:hidden"
        style={{ ...layer, background: spot(45) }}
      />
      {/* Masked 1px gradient border. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
        style={{
          ...layer,
          padding: 1,
          background: spot(100),
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
      />
      {/* Very soft inner wash near the pointer. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
        style={{ ...layer, background: spot(8) }}
      />
    </div>
  );
}
