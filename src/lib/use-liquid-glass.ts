"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

/** Options for the liquid-glass.js library. */
export interface LiquidGlassOptions {
  scale?: number;
  chroma?: number;
  border?: number;
  mapBlur?: number;
  blur?: number;
  saturate?: number;
  radius?: number | null;
  fallbackBlur?: number;
}

interface LiquidGlassInstance {
  supported: boolean;
  refresh: () => void;
  destroy: () => void;
}
type LiquidGlassFn = (el: HTMLElement, options?: LiquidGlassOptions) => LiquidGlassInstance;

declare global {
  interface Window {
    liquidGlass?: LiquidGlassFn;
  }
}

export interface LiquidGlassResult<T extends HTMLElement = HTMLDivElement> {
  /** Pass to the target element's `ref`. */
  ref: RefObject<T | null>;
  /** null = unknown yet, true = Chromium refraction, false = frosted fallback. */
  supported: boolean | null;
}

/**
 * Apply Apple-style liquid-glass refraction to an element.
 * Returns a stable ref to attach + a `supported` flag for styling the
 * frosted fallback. Handles the script-not-yet-loaded case by polling.
 */
export function useLiquidGlass<T extends HTMLElement = HTMLDivElement>(
  options?: LiquidGlassOptions,
): LiquidGlassResult<T> {
  const ref = useRef<T>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  // Store the latest options in a ref so the effect doesn't re-run on every
  // render (the library attaches once per element).
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let instance: LiquidGlassInstance | undefined;
    let cancelled = false;
    let tries = 0;

    const attach = () => {
      if (cancelled) return;
      const fn = window.liquidGlass;
      if (!fn) {
        if (tries++ < 40) {
          setTimeout(attach, 50);
        }
        return;
      }
      instance = fn(el, optsRef.current);
      setSupported(instance.supported);
    };
    attach();

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return { ref, supported };
}
