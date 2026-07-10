"use client";
import { type ReactNode } from "react";
import { useLiquidGlass, type LiquidGlassOptions, type LiquidGlassResult } from "@/lib/use-liquid-glass";
import { cn } from "@/lib/utils";

interface GlassProps {
  children: ReactNode;
  className?: string;
  /** "lg" = card-size panel, "sm" = small chrome (medallions, pills). */
  size?: "lg" | "sm";
  options?: LiquidGlassOptions;
}

/**
 * Liquid-glass surface. Wraps `useLiquidGlass` so the ref never escapes to a
 * parent's render — keeps react-hooks/refs happy and gives a single tidy API:
 *
 *   <Glass size="lg" className="p-8">…</Glass>
 *
 * The lib attaches the SVG displacement filter + backdrop-filter to this
 * element; the `.lg-glass` / `.lg-glass-sm` classes provide the material
 * dressing (tint, specular border, shadow). The border-radius is set via
 * Tailwind classes so it can vary per surface.
 */
export function Glass({ children, className, size = "lg", options }: GlassProps) {
  const result = useLiquidGlass<HTMLDivElement>(options);
  const glassCls = size === "sm" ? "lg-glass-sm" : "lg-glass";
  const defaultRadius = size === "sm" ? "rounded-2xl" : "rounded-[28px]";
  const fallback = result.supported === false ? "lg-fallback" : "";
  return (
    <div ref={result.ref} className={cn(glassCls, defaultRadius, fallback, className)}>
      {children}
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  options?: LiquidGlassOptions;
}

/**
 * Drop-in replacement for shadcn `<Card>` with liquid-glass refraction.
 * Same structural classes (flex flex-col gap-6 py-6) so `<CardHeader>`,
 * `<CardContent>`, `<CardFooter>` all work unchanged inside it.
 *
 * Uses a slightly tighter radius (rounded-2xl = 16px) suited to cards,
 * and gentler refraction options than the login panels.
 */
const DEFAULT_CARD_OPTIONS: LiquidGlassOptions = {
  scale: -80,
  chroma: 4,
  border: 0.08,
  mapBlur: 10,
  blur: 6,
  saturate: 1.4,
  fallbackBlur: 16,
};

export function GlassCard({ children, className, options }: GlassCardProps) {
  const result = useLiquidGlass<HTMLDivElement>(options ?? DEFAULT_CARD_OPTIONS);
  const fallback = result.supported === false ? "lg-fallback" : "";
  return (
    <div
      ref={result.ref}
      data-slot="card"
      className={cn(
        "lg-glass rounded-2xl text-card-foreground flex flex-col gap-6 py-6",
        fallback,
        className,
      )}
    >
      {children}
    </div>
  );
}

export type { LiquidGlassResult };
