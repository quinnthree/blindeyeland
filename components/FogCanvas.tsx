'use client';
import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
}

/** Drifting fog layer — canvas, zero assets, seamless by construction. */
export default function FogCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let blobs: Blob[] = [];

    const seed = () => {
      blobs = Array.from({ length: 14 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 120 + Math.random() * 240,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.18,
        a: 0.035 + Math.random() * 0.05,
      }));
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      seed();
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r) b.x = canvas.width + b.r;
        if (b.x > canvas.width + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = canvas.height + b.r;
        if (b.y > canvas.height + b.r) b.y = -b.r;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(196,202,232,${b.a})`);
        g.addColorStop(1, 'rgba(196,202,232,0)');
        ctx.fillStyle = g;
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onVis = () => {
      running = !document.hidden;
      if (running) tick();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
