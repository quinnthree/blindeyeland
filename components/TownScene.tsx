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
const EYELID_WINDOW2 = { x: 0.404, y: 0.423 };
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
  // stage 1: a window illuminates · stage 2: someone passes it · stage 3: a second window wakes
  const eyelidStage = useStagedCues([14, 26, 38]);
  const stageRef = useRef(0);
  stageRef.current = eyelidStage;
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
    sil: { active: false, t: 0, passes: 0, cool: 0, started: false },
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
      // someone passes the lit window, twice, when the invitation deepens
      const eStg = stageRef.current;
      if (eStg >= 2 && !s.sil.started) {
        s.sil.started = true;
        s.sil.cool = 1.5;
      }
      if (s.sil.started && s.sil.passes < 2) {
        if (!s.sil.active) {
          s.sil.cool -= dt;
          if (s.sil.cool <= 0) {
            s.sil.active = true;
            s.sil.t = 0;
          }
        } else {
          s.sil.t += dt;
          if (s.sil.t > 3.2) {
            s.sil.active = false;
            s.sil.passes++;
            s.sil.cool = 9;
          }
        }
      }
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

      // eyelid invitation, in stages: a window illuminates → someone passes it
      // → a second window wakes. No markers, no magnification — only light and shadow.
      const eStage = stageRef.current;
      if (eStage >= 1 || changed) {
        const im2 = imgRef.current;
        if (im2 && im2.complete && im2.naturalWidth > 0) {
          const pulse = changed ? 0.85 : 0.45 + 0.35 * Math.sin(s.time * 1.4);
          const wx = EYELID_WINDOW.x * WORLD_W;
          const wy = EYELID_WINDOW.y * WORLD_H;
          const g = ctx.createRadialGradient(wx, wy, 2, wx, wy, 40);
          g.addColorStop(0, `rgba(255,196,110,${0.7 * pulse})`);
          g.addColorStop(1, 'rgba(255,196,110,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(wx, wy, 40, 0, Math.PI * 2);
          ctx.fill();
          // someone passes the lit window
          if (s.sil.active) {
            const prog = s.sil.t / 3.2;
            const sx = wx - 34 + prog * 68;
            const sg = ctx.createRadialGradient(sx, wy, 2, sx, wy, 22);
            sg.addColorStop(0, 'rgba(24,16,10,0.55)');
            sg.addColorStop(1, 'rgba(24,16,10,0)');
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.ellipse(sx, wy, 14, 22, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          if (eStage >= 3 && !changed) {
            // a second window wakes upstairs
            const w2x = EYELID_WINDOW2.x * WORLD_W;
            const w2y = EYELID_WINDOW2.y * WORLD_H;
            const p2 = 0.4 + 0.25 * Math.sin(s.time * 1.1 + 2);
            const g2 = ctx.createRadialGradient(w2x, w2y, 2, w2x, w2y, 34);
            g2.addColorStop(0, `rgba(255,196,110,${0.6 * p2})`);
            g2.addColorStop(1, 'rgba(255,196,110,0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(w2x, w2y, 34, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Anna's signal: a watermelon by the road, and snakes arranged beside it
      // in a deliberate pattern. Deterministic — it is simply there after Room #6.
      if (annaPresentRef.current) {
        const ax = ANNA_SPOT.x * WORLD_W;
        const ay = ANNA_SPOT.y * WORLD_H;
        // soft ground shadow
        ctx.fillStyle = 'rgba(30,22,14,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 12, 52, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // snakes in a loose figure-eight
        ctx.strokeStyle = '#3d4a2b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax - 62, ay + 6);
        ctx.bezierCurveTo(ax - 40, ay - 22, ax - 12, ay - 22, ax, ay + 2);
        ctx.bezierCurveTo(ax + 12, ay + 26, ax + 42, ay + 26, ax + 64, ay - 2);
        ctx.stroke();
        ctx.strokeStyle = '#55663a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ax - 62, ay + 6);
        ctx.bezierCurveTo(ax - 40, ay - 22, ax - 12, ay - 22, ax, ay + 2);
        ctx.bezierCurveTo(ax + 12, ay + 26, ax + 42, ay + 26, ax + 64, ay - 2);
        ctx.stroke();
        // second snake, coiled
        ctx.strokeStyle = '#3d4a2b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(ax + 34, ay - 26, 13, 0.4, Math.PI * 2.2);
        ctx.stroke();
        // the watermelon
        ctx.fillStyle = '#2e4a2a';
        ctx.beginPath();
        ctx.ellipse(ax - 34, ay - 4, 20, 15, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(190,220,150,0.6)';
        ctx.lineWidth = 2;
        for (const off of [-0.4, 0, 0.4]) {
          ctx.beginPath();
          ctx.ellipse(ax - 34, ay - 4, 20 * (1 - Math.abs(off)), 13, -0.1, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = '#4a6a3a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ax - 26, ay - 17);
        ctx.quadraticCurveTo(ax - 22, ay - 23, ax - 17, ay - 22);
        ctx.stroke();
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
