'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ambience } from '@/lib/ambience';

const WORLD_SRC = '/art/world-golden.WEBP';
const WORLD_W = 2016;
const WORLD_H = 1152;

/** Boarding house on the town painting (fractions). */
const EYELID = { x: 0.455, y: 0.47 };
const EYELID_WINDOW = { x: 0.47, y: 0.36 };

/** Railroad, traced from the painted rails. */
const TRACK = [
  { x: 0.15, y: 0.33 },
  { x: 0.168, y: 0.375 },
  { x: 0.174, y: 0.417 },
  { x: 0.2, y: 0.52 },
  { x: 0.235, y: 0.62 },
  { x: 0.25, y: 0.686 },
  { x: 0.32, y: 0.7 },
  { x: 0.436, y: 0.705 },
  { x: 0.5, y: 0.72 },
  { x: 0.625, y: 0.755 },
  { x: 0.75, y: 0.79 },
  { x: 0.88, y: 0.8 },
  { x: 1.04, y: 0.81 },
].map((p) => ({ x: p.x * WORLD_W, y: p.y * WORLD_H }));

function buildPath(pts: { x: number; y: number }[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1];
  return {
    total,
    at(s: number) {
      const c = Math.max(0, Math.min(total, s));
      let i = 1;
      while (i < cum.length - 1 && cum[i] < c) i++;
      const t = (c - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      const a = pts[i - 1];
      const b = pts[i];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    },
  };
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  // tire
  ctx.fillStyle = '#1a1a1c';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a8f96';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();
  // spokes
  ctx.strokeStyle = '#3d3a35';
  ctx.lineWidth = 2.5;
  ctx.rotate(rot);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r + 3);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a5650';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEngine(ctx: CanvasRenderingContext2D, rot: number) {
  // shadow
  ctx.fillStyle = 'rgba(20,12,6,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 62, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // frame
  ctx.fillStyle = '#4a2320';
  ctx.beginPath();
  ctx.roundRect(-62, 2, 124, 10, 3);
  ctx.fill();
  // cowcatcher
  ctx.strokeStyle = '#2b2b2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(62, 4);
  ctx.lineTo(78, 16);
  ctx.moveTo(62, 4);
  ctx.lineTo(70, 16);
  ctx.moveTo(66, 6);
  ctx.lineTo(74, 16);
  ctx.stroke();
  // boiler with warm top-light
  const bg = ctx.createLinearGradient(0, -26, 0, 0);
  bg.addColorStop(0, '#3d4a3f');
  bg.addColorStop(0.45, '#232b25');
  bg.addColorStop(1, '#12160f');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(-58, -26, 88, 26, 9);
  ctx.fill();
  // boiler bands
  ctx.strokeStyle = 'rgba(201,151,63,0.55)';
  ctx.lineWidth = 1.6;
  for (const bx of [-40, -22, -4]) {
    ctx.beginPath();
    ctx.moveTo(bx, -25);
    ctx.lineTo(bx, -1);
    ctx.stroke();
  }
  // smokebox + headlamp
  ctx.fillStyle = '#0e0f11';
  ctx.beginPath();
  ctx.roundRect(28, -24, 16, 24, 6);
  ctx.fill();
  const lamp = ctx.createRadialGradient(52, -14, 1, 52, -14, 12);
  lamp.addColorStop(0, '#ffe9b8');
  lamp.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(52, -14, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9973f';
  ctx.beginPath();
  ctx.arc(48, -14, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // smokestack
  ctx.fillStyle = '#191b1d';
  ctx.beginPath();
  ctx.moveTo(36, -26);
  ctx.lineTo(40, -44);
  ctx.lineTo(52, -44);
  ctx.lineTo(56, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a2d30';
  ctx.fillRect(37, -48, 18, 5);
  // brass domes
  ctx.fillStyle = '#c9973f';
  ctx.beginPath();
  ctx.arc(-8, -26, 7, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-26, -26, 5, Math.PI, 0);
  ctx.fill();
  // cab
  const cab = ctx.createLinearGradient(0, -46, 0, -4);
  cab.addColorStop(0, '#31402f');
  cab.addColorStop(1, '#1c231b');
  ctx.fillStyle = cab;
  ctx.beginPath();
  ctx.roundRect(-62, -46, 32, 44, 4);
  ctx.fill();
  // cab roof
  ctx.fillStyle = '#101310';
  ctx.beginPath();
  ctx.roundRect(-66, -50, 40, 7, 3);
  ctx.fill();
  // lit cab window
  const wg = ctx.createLinearGradient(0, -40, 0, -24);
  wg.addColorStop(0, '#ffd98f');
  wg.addColorStop(1, '#e89b4a');
  ctx.fillStyle = wg;
  ctx.fillRect(-56, -40, 16, 15);
  ctx.strokeStyle = '#1c231b';
  ctx.lineWidth = 2;
  ctx.strokeRect(-56, -40, 16, 15);
  ctx.beginPath();
  ctx.moveTo(-48, -40);
  ctx.lineTo(-48, -25);
  ctx.stroke();
  // wheels: 3 drivers + rod
  drawWheel(ctx, -44, 12, 11, rot);
  drawWheel(ctx, -22, 12, 11, rot);
  drawWheel(ctx, 0, 12, 11, rot);
  drawWheel(ctx, 44, 13, 8, -rot * 1.4);
  const rodY = 12 + Math.sin(rot) * 4;
  ctx.strokeStyle = '#9aa0a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-44, rodY);
  ctx.lineTo(0, rodY);
  ctx.stroke();
}

function drawTender(ctx: CanvasRenderingContext2D, rot: number) {
  ctx.fillStyle = 'rgba(20,12,6,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 40, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const tg = ctx.createLinearGradient(0, -24, 0, 4);
  tg.addColorStop(0, '#2c362b');
  tg.addColorStop(1, '#161b15');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.roundRect(-38, -24, 76, 28, 4);
  ctx.fill();
  ctx.fillStyle = '#101310';
  ctx.beginPath();
  ctx.roundRect(-40, -28, 80, 6, 3);
  ctx.fill();
  // coal
  ctx.fillStyle = '#0b0c0d';
  for (const [cx, cy, cr] of [[-24, -26, 7], [-10, -28, 8], [5, -27, 7], [20, -26, 6], [-2, -24, 6]] as const) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  drawWheel(ctx, -24, 12, 8, rot);
  drawWheel(ctx, 24, 12, 8, rot);
}

function drawCoach(ctx: CanvasRenderingContext2D, rot: number) {
  ctx.fillStyle = 'rgba(20,12,6,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 44, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const cg = ctx.createLinearGradient(0, -30, 0, 2);
  cg.addColorStop(0, '#6e2f26');
  cg.addColorStop(0.6, '#54231d');
  cg.addColorStop(1, '#3a1712');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.roundRect(-42, -30, 84, 32, 4);
  ctx.fill();
  // gold trim
  ctx.strokeStyle = 'rgba(201,151,63,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-42, -8);
  ctx.lineTo(42, -8);
  ctx.stroke();
  // roof
  ctx.fillStyle = '#1d1a16';
  ctx.beginPath();
  ctx.roundRect(-44, -36, 88, 8, 4);
  ctx.fill();
  // lit windows
  for (const wx of [-28, -10, 8, 26]) {
    const wg = ctx.createLinearGradient(0, -26, 0, -14);
    wg.addColorStop(0, '#ffd98f');
    wg.addColorStop(1, '#e89b4a');
    ctx.fillStyle = wg;
    ctx.fillRect(wx - 6, -26, 12, 12);
    ctx.strokeStyle = '#2c130e';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(wx - 6, -26, 12, 12);
  }
  drawWheel(ctx, -26, 12, 8, rot);
  drawWheel(ctx, 26, 12, 8, rot);
}

function drawTrainUnit(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, kind: 'engine' | 'tender' | 'coach', rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (kind === 'engine') drawEngine(ctx, rot);
  else if (kind === 'tender') drawTender(ctx, rot);
  else drawCoach(ctx, rot);
  ctx.restore();
}

export default function TownScene({
  changed,
  onEnterEyelid,
}: {
  changed: boolean;
  onEnterEyelid: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [muted, setMuted] = useState(ambience.muted);
  const [hint, setHint] = useState(false);
  const st = useRef({
    panX: 0,
    panY: 0,
    tPanX: 0,
    tPanY: 0,
    zoom: 1.12,
    tZoom: 1.12,
    time: 0,
    trainOn: false,
    trainS: 0,
    nextTrain: 26 + Math.random() * 30,
    cueT: 0,
    cueOn: false,
    motes: [] as { x: number; y: number; vx: number; vy: number; r: number; a: number }[],
    smoke: [] as { x: number; y: number; life: number }[],
    chimney: [] as { x: number; y: number; life: number }[],
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

    const path = buildPath(TRACK);
    const hintTimer = window.setTimeout(() => setHint(true), 14000);
    const hintOff = window.setTimeout(() => setHint(false), 21000);

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

      // train
      if (!s.trainOn) {
        s.nextTrain -= dt;
        if (s.nextTrain <= 0) {
          s.trainOn = true;
          s.trainS = -300;
          ambience.whistle();
        }
      } else {
        s.trainS += 150 * dt;
        if (Math.random() < dt * 7) {
          const h = path.at(s.trainS + 48);
          s.smoke.push({ x: h.x + 10, y: h.y - 28, life: 1 });
        }
        if (s.trainS > path.total + 340) {
          s.trainOn = false;
          s.nextTrain = 70 + Math.random() * 60;
        }
      }
      s.smoke = s.smoke.filter((p) => (p.life -= dt * 0.6) > 0);
      // chimney smoke, sparse
      if (Math.random() < dt * 1.6) {
        s.chimney.push({ x: WORLD_W * 0.485, y: WORLD_H * 0.30, life: 1 });
      }
      s.chimney = s.chimney.filter((p) => (p.life -= dt * 0.25) > 0);
      // eyelid cue
      s.cueT += dt;
      if (s.cueT > 18) s.cueOn = true;
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

      // train — a little storybook steam engine with tender and two coaches
      if (s.trainOn) {
        const wheelRot = s.trainS * 0.06;
        const units = [
          { off: 0, kind: 'engine' },
          { off: -128, kind: 'tender' },
          { off: -224, kind: 'coach' },
          { off: -322, kind: 'coach' },
        ] as const;
        for (const u of units) {
          const pt = path.at(s.trainS + u.off);
          drawTrainUnit(ctx, pt.x, pt.y, pt.ang, u.kind, wheelRot);
        }
        for (const p of s.smoke) {
          ctx.globalAlpha = Math.max(0, p.life) * 0.4;
          ctx.fillStyle = '#e8ddc8';
          ctx.beginPath();
          ctx.arc(p.x, p.y - (1 - p.life) * 44, 6 + (1 - p.life) * 15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // eyelid window cue — a light that wasn't on before
      if (s.cueOn || changed) {
        const im2 = imgRef.current;
        if (im2 && im2.complete && im2.naturalWidth > 0) {
        const pulse = changed ? 0.85 : 0.45 + 0.35 * Math.sin(s.time * 1.4);
        const wx = EYELID_WINDOW.x * WORLD_W;
        const wy = EYELID_WINDOW.y * WORLD_H;
        const g = ctx.createRadialGradient(wx, wy, 2, wx, wy, 46);
        g.addColorStop(0, `rgba(255,196,110,${0.75 * pulse})`);
        g.addColorStop(1, 'rgba(255,196,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(wx, wy, 46, 0, Math.PI * 2);
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
      clearTimeout(hintTimer);
      clearTimeout(hintOff);
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

      {/* one quiet hint, then nothing */}
      <AnimatePresence>
        {hint && !pushing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6 }}
            className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2 font-serif text-sm italic tracking-wide text-white/45"
          >
            Look around.
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
