'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ambience } from '@/lib/ambience';
import { useStagedCues } from '@/lib/cues';

const WORLD_SRC = '/art/world-golden.WEBP';
const WORLD_W = 2016;
const WORLD_H = 1152;

/** Boarding house on the town painting (fractions). */
const EYELID = { x: 0.455, y: 0.47 };
const EYELID_WINDOW = { x: 0.494, y: 0.42 };
const EYELID_PORCH = { x: 0.43, y: 0.56 };
/** Chimney tops on the boarding house (fractions). */
const CHIMNEYS = [
  { x: 0.538, y: 0.368 },
  { x: 0.39, y: 0.332 },
];
/** Where Anna is seen after Room #6 (fractions). */
const ANNA_SPOT = { x: 0.32, y: 0.82 };

const FOLLOW_HINT_KEY = 'blindeye-cine-followhint';


export default function TownScene({
  changed,
  annaPresent,
  onEnterEyelid,
  onEncounterAnna,
}: {
  changed: boolean;
  annaPresent: boolean;
  onEnterEyelid: () => void;
  onEncounterAnna: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [muted, setMuted] = useState(ambience.muted);
  const [followHint, setFollowHint] = useState(false);
  // progressive invitations: the building calls attention to itself in stages
  const eyelidStage = useStagedCues([14, 26, 38, 50]);
  const annaStage = useStagedCues([10, 24, 40], annaPresent);
  const stageRef = useRef({ eyelid: 0, anna: 0 });
  stageRef.current.eyelid = eyelidStage;
  stageRef.current.anna = annaStage;
  const annaPresentRef = useRef(annaPresent);
  annaPresentRef.current = annaPresent;

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(FOLLOW_HINT_KEY);
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t1 = window.setTimeout(() => setFollowHint(true), 9000);
    const t2 = window.setTimeout(() => {
      setFollowHint(false);
      try {
        localStorage.setItem(FOLLOW_HINT_KEY, '1');
      } catch {
        /* ignore */
      }
    }, 20000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // a faint rustle when Anna's invitation deepens
  useEffect(() => {
    if (annaStage === 3) ambience.rustle();
  }, [annaStage]);
  const st = useRef({
    panX: 0,
    panY: 0,
    tPanX: 0,
    tPanY: 0,
    zoom: 1.12,
    tZoom: 1.12,
    time: 0,
    motes: [] as { x: number; y: number; vx: number; vy: number; r: number; a: number }[],
    chimney: [] as { x: number; y: number; life: number; ch: number }[],
    cueDust: [] as { x: number; y: number; life: number }[],
    cueDustT: 0,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = st.current;
    for (let i = 0; i < 40; i++) {
      s.motes.push({
        x: Math.random() * WORLD_W,
        y: WORLD_H * 0.3 + Math.random() * WORLD_H * 0.65,
        vx: 5 + Math.random() * 12,
        vy: -3 - Math.random() * 7,
        r: 1 + Math.random() * 2.2,
        a: 0.1 + Math.random() * 0.2,
      });
    }

    const img = new Image();
    imgRef.current = img;
    img.src = WORLD_SRC;
    img.onload = () => setReady(true);

    let cssW = 1;
    let cssH = 1;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // --- camera input: drag to pan (limited), pinch to zoom (limited) ---
    const pointers = new Map<number, { x: number; y: number; sx: number; sy: number }>();
    let pinchD0 = 0;
    let pinchZ0 = 1;
    let downAt = 0;

    const toWorld = (sx: number, sy: number) => {
      const base = Math.max(cssW / WORLD_W, cssH / WORLD_H);
      const sc = base * s.zoom;
      const cx = WORLD_W / 2 + s.panX;
      const cy = WORLD_H / 2 + s.panY;
      return { x: (sx - cssW / 2) / sc + cx, y: (sy - cssH / 2) / sc + cy, sc };
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const r = canvas.getBoundingClientRect();
      pointers.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top, sx: e.clientX - r.left, sy: e.clientY - r.top });
      downAt = performance.now();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZ0 = s.tZoom;
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      const dx = nx - p.x;
      const dy = ny - p.y;
      p.x = nx;
      p.y = ny;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD0 > 0) s.tZoom = Math.min(1.6, Math.max(1, pinchZ0 * (d / pinchD0)));
        return;
      }
      const base = Math.max(cssW / WORLD_W, cssH / WORLD_H);
      const sc = base * s.zoom;
      s.tPanX = Math.max(-WORLD_W * 0.09, Math.min(WORLD_W * 0.09, s.tPanX + dx / sc));
      s.tPanY = Math.max(-WORLD_H * 0.07, Math.min(WORLD_H * 0.07, s.tPanY + dy / sc));
    };
    const onUp = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (!p || pointers.size > 0) return;
      const moved = Math.hypot(p.x - p.sx, p.y - p.sy);
      const quick = performance.now() - downAt < 500;
      if (moved < 10 && quick) {
        const w = toWorld(p.x, p.y);
        const dx = w.x - EYELID.x * WORLD_W;
        const dy = w.y - EYELID.y * WORLD_H;
        if (Math.hypot(dx, dy) < 190) {
          setPushing(true);
          return;
        }
        if (annaPresentRef.current) {
          const ax = w.x - ANNA_SPOT.x * WORLD_W;
          const ay = w.y - ANNA_SPOT.y * WORLD_H;
          if (Math.hypot(ax, ay) < 170) {
            onEncounterAnna();
          }
        }
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.time += dt;
      // ease camera
      const k = Math.min(1, dt * 5);
      s.panX += (s.tPanX - s.panX) * k;
      s.panY += (s.tPanY - s.panY) * k;
      s.zoom += (s.tZoom - s.zoom) * k;
      // idle drift
      const driftX = Math.sin(s.time * 0.05) * WORLD_W * 0.012;
      const driftY = Math.cos(s.time * 0.04) * WORLD_H * 0.008;

      // chimney smoke from the real chimney tops, sparse
      if (Math.random() < dt * 1.4) {
        const ch = Math.random() < 0.75 ? 0 : 1;
        s.chimney.push({ x: WORLD_W * CHIMNEYS[ch].x, y: WORLD_H * CHIMNEYS[ch].y, life: 1, ch });
      }
      s.chimney = s.chimney.filter((p) => (p.life -= dt * 0.25) > 0);
      // Anna's invitation: faint dust where something moved, on its own rhythm
      const aStage = annaPresentRef.current ? stageRef.current.anna : 0;
      if (aStage >= 1) {
        s.cueDustT -= dt;
        if (s.cueDustT <= 0) {
          s.cueDustT = aStage >= 3 ? 4 : 7;
          for (let i = 0; i < 3; i++) {
            s.cueDust.push({
              x: WORLD_W * ANNA_SPOT.x + (Math.random() - 0.5) * 60,
              y: WORLD_H * ANNA_SPOT.y + (Math.random() - 0.5) * 24,
              life: 1,
            });
          }
        }
      }
      s.cueDust = s.cueDust.filter((p) => (p.life -= dt * 0.5) > 0);
      // motes
      for (const m of s.motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x > WORLD_W + 8) m.x = -8;
        if (m.y < WORLD_H * 0.25) m.y = WORLD_H * 0.95;
      }

      // ---- render ----
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#17100a';
      ctx.fillRect(0, 0, cssW, cssH);
      const base = Math.max(cssW / WORLD_W, cssH / WORLD_H);
      const sc = base * s.zoom;
      const cx = WORLD_W / 2 + s.panX + driftX;
      const cy = WORLD_H / 2 + s.panY + driftY;
      ctx.save();
      ctx.translate(cssW / 2, cssH / 2);
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
      const im = imgRef.current;
      if (im && im.complete && im.naturalWidth > 0) ctx.drawImage(im, 0, 0, WORLD_W, WORLD_H);

      // dust
      for (const m of s.motes) {
        ctx.globalAlpha = m.a * (0.7 + 0.3 * Math.sin(s.time * 2 + m.x));
        ctx.fillStyle = '#ffd98a';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // chimney smoke
      for (const p of s.chimney) {
        ctx.globalAlpha = Math.max(0, p.life) * 0.28;
        ctx.fillStyle = '#d8cfbc';
        ctx.beginPath();
        ctx.arc(p.x + (1 - p.life) * 30, p.y - (1 - p.life) * 90, 6 + (1 - p.life) * 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // eyelid invitation, in stages: light → flicker → porch → stronger breath
      const eStage = stageRef.current.eyelid;
      if (eStage >= 1 || changed) {
        const im2 = imgRef.current;
        if (im2 && im2.complete && im2.naturalWidth > 0) {
          let pulse = changed ? 0.85 : 0.45 + 0.35 * Math.sin(s.time * 1.4);
          if (eStage === 2 && !changed) {
            // the light flickers once, as if someone passed it
            const fl = Math.sin(s.time * 9);
            if (fl > 0.86) pulse *= 0.3;
          }
          const wx = EYELID_WINDOW.x * WORLD_W;
          const wy = EYELID_WINDOW.y * WORLD_H;
          const g = ctx.createRadialGradient(wx, wy, 2, wx, wy, 46);
          g.addColorStop(0, `rgba(255,196,110,${0.75 * pulse})`);
          g.addColorStop(1, 'rgba(255,196,110,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(wx, wy, 46, 0, Math.PI * 2);
          ctx.fill();
          if (eStage >= 3 && !changed) {
            // the porch light comes on
            const px = EYELID_PORCH.x * WORLD_W;
            const py = EYELID_PORCH.y * WORLD_H;
            const pg = ctx.createRadialGradient(px, py, 2, px, py, 70);
            const pp = 0.5 + 0.2 * Math.sin(s.time * 1.1);
            pg.addColorStop(0, `rgba(255,200,120,${0.5 * pp})`);
            pg.addColorStop(1, 'rgba(255,200,120,0)');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, 70, 0, Math.PI * 2);
            ctx.fill();
          }
          // a breath of warmth over the house — the faintest invitation, stronger late
          const breath = Math.max(0, Math.sin(s.time * 0.7));
          const strength = eStage >= 4 || changed ? 0.16 : 0.1;
          const bx = EYELID.x * WORLD_W;
          const by = EYELID.y * WORLD_H;
          const bg2 = ctx.createRadialGradient(bx, by, 20, bx, by, 190);
          bg2.addColorStop(0, `rgba(255,205,130,${strength * breath * breath})`);
          bg2.addColorStop(1, 'rgba(255,205,130,0)');
          ctx.fillStyle = bg2;
          ctx.beginPath();
          ctx.arc(bx, by, 190, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Anna's invitation: dust where something moved
      if (aStage >= 1) {
        for (const p of s.cueDust) {
          ctx.globalAlpha = Math.max(0, p.life) * (aStage >= 3 ? 0.4 : 0.25);
          ctx.fillStyle = '#cbb98f';
          ctx.beginPath();
          ctx.arc(p.x, p.y - (1 - p.life) * 18, 3 + (1 - p.life) * 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (aStage >= 2) {
          // a soft shadow, there and not there
          const shx = ANNA_SPOT.x * WORLD_W;
          const shy = ANNA_SPOT.y * WORLD_H;
          const shimmer = 0.5 + 0.5 * Math.sin(s.time * 0.9);
          ctx.fillStyle = `rgba(30,22,14,${0.14 * shimmer})`;
          ctx.beginPath();
          ctx.ellipse(shx, shy, 26, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // vignette
      const vg = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.42, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(12,7,3,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cssW, cssH);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changed]);

  // cinematic push-in toward the Eyelid, then hand off
  useEffect(() => {
    if (!pushing) return;
    const t = window.setTimeout(onEnterEyelid, 2600);
    return () => clearTimeout(t);
  }, [pushing, onEnterEyelid]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#17100a]">
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" style={{ cursor: 'grab' }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="animate-pulse font-display text-xl text-amber-100/60">Blind Eye is waking up…</p>
        </div>
      )}

      {/* push-in transition */}
      <AnimatePresence>
        {pushing && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 1] }}
            transition={{ duration: 2.6, times: [0, 0.55, 1] }}
          />
        )}
      </AnimatePresence>

      {/* one quiet lesson, then nothing */}
      <AnimatePresence>
        {followHint && !pushing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6 }}
            className="pointer-events-none absolute bottom-10 left-1/2 z-10 w-max max-w-[92%] -translate-x-1/2 text-center font-serif text-[15px] italic tracking-wide text-white/55"
          >
            If something changes, follow it.
          </motion.p>
        )}
      </AnimatePresence>

      {/* sound toggle, barely there */}
      <button
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => setMuted(ambience.toggleMute())}
        className="absolute bottom-5 left-5 z-10 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/50 backdrop-blur-sm transition-colors hover:text-white/80"
      >
        {muted ? 'sound off' : 'sound on'}
      </button>
    </div>
  );
}
