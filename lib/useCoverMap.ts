/* Maps image fractions to element pixels for object-cover images.
   Phones crop the painting's sides heavily; this keeps overlays and touch
   targets on the actual painted objects instead of drifting. */
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

export interface CoverMap {
  el: { w: number; h: number };
  px: (fx: number, fy: number) => { x: number; y: number };
  /** one image-width in displayed px */
  unit: number;
}

export function useCoverMap(src: string, elRef: RefObject<HTMLDivElement | null>): CoverMap | null {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [el, setEl] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const im = new Image();
    im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = src;
  }, [src]);
  useEffect(() => {
    const elx = elRef.current;
    if (!elx) return;
    const measure = () => {
      const r = elx.getBoundingClientRect();
      setEl({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(elx);
    return () => ro.disconnect();
  }, [elRef]);
  return useMemo(() => {
    if (!nat || !el) return null;
    const scale = Math.max(el.w / nat.w, el.h / nat.h);
    const dw = nat.w * scale;
    const dh = nat.h * scale;
    const ox = (el.w - dw) / 2;
    const oy = (el.h - dh) / 2;
    return {
      el,
      px: (fx: number, fy: number) => ({ x: fx * dw + ox, y: fy * dh + oy }),
      unit: dw,
    };
  }, [nat, el]);
}

/** Shared hotspot button: generous target, whisper shimmer, hover glow. */
export function useShimmerDelay() {
  const ref = useRef(Math.random() * 9);
  return ref.current;
}
