'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RegisterView from './RegisterView';
import { ambience } from '@/lib/ambience';
import { setPresence } from '@/lib/characters';
import { useCoverMap } from '@/lib/useCoverMap';

export interface Artifact {
  title: string;
  body: string;
  sign?: string;
}

const IMG_SRC = '/art/eyelid-exterior.webp';
/** Hotspot positions in IMAGE fractions. */
const DOOR = { x: 0.556, y: 0.61 };
const REGISTER = { x: 0.742, y: 0.67 };
const CHAIR = { x: 0.23, y: 0.69 };
const WINDOW = { x: 0.37, y: 0.3 };
/** Rocking-chair sprite bbox in image fractions (cropped from the painting itself). */
const CHAIR_BBOX = { x: 0.165, y: 0.595, w: 0.13, h: 0.19 };

function Spot({ x, y, label, onTap }: { x: number; y: number; label: string; onTap: () => void }) {
  const [hov, setHov] = useState(false);
  const [shimmerDelay] = useState(() => Math.random() * 9);
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer p-10"
      style={{ left: x, top: y }}
    >
      <span className="relative block h-14 w-14">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,205,120,0.32) 0%, transparent 70%)' }}
          animate={{ opacity: [0, 0, 0.75, 0] }}
          transition={{ duration: 9, repeat: Infinity, times: [0, 0.72, 0.86, 1], delay: shimmerDelay }}
        />
        <span
          className="absolute inset-0 rounded-full transition-opacity duration-700"
          style={{
            opacity: hov ? 1 : 0,
            background: 'radial-gradient(circle, rgba(255,205,120,0.28) 0%, transparent 70%)',
          }}
        />
      </span>
    </button>
  );
}

function feather(canvas: HTMLCanvasElement, px: number) {
  const x = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  x.globalCompositeOperation = 'destination-in';
  const edge = (x0: number, y0: number, x1: number, y1: number, horizontal: boolean) => {
    const g = horizontal ? x.createLinearGradient(x0, 0, x1, 0) : x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = g;
    x.fillRect(Math.min(x0, x1), Math.min(y0, y1), horizontal ? px : w, horizontal ? h : px);
  };
  edge(0, 0, px, 0, true);
  edge(w, 0, w - px, 0, true);
  edge(0, 0, 0, px, false);
  edge(0, h, 0, h - px, false);
  x.globalCompositeOperation = 'source-over';
}

export default function EyelidExterior({
  onEnter,
  onBack,
}: {
  onEnter: () => void;
  onBack: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = useCoverMap(IMG_SRC, wrapRef);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 3400);
  };

  // living overlay: the chair rocks; lamplight stirs behind the door;
  // the register catches light; something crosses the upstairs window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(map.el.w * dpr);
    canvas.height = Math.round(map.el.h * dpr);

    // chair sprite, cropped from the painting itself so it tiles invisibly
    const img = new Image();
    let sprite: HTMLCanvasElement | null = null;
    let spriteNat = { w: 0, h: 0 };
    img.onload = () => {
      const sw = Math.round(img.naturalWidth * CHAIR_BBOX.w);
      const sh = Math.round(img.naturalHeight * CHAIR_BBOX.h);
      sprite = document.createElement('canvas');
      sprite.width = sw;
      sprite.height = sh;
      const sx = sprite.getContext('2d')!;
      sx.drawImage(
        img,
        img.naturalWidth * CHAIR_BBOX.x,
        img.naturalHeight * CHAIR_BBOX.y,
        sw,
        sh,
        0,
        0,
        sw,
        sh
      );
      feather(sprite, Math.max(4, Math.round(sw * 0.03)));
      spriteNat = { w: img.naturalWidth, h: img.naturalHeight };
    };
    img.src = IMG_SRC;

    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, map.el.w, map.el.h);

      // rocking chair — a few degrees, slow, endless
      if (sprite && spriteNat.w) {
        const top = map.px(CHAIR_BBOX.x, CHAIR_BBOX.y);
        const dw = sprite.width * (map.unit / spriteNat.w);
        const dh = sprite.height * (map.unit / spriteNat.w);
        const pivotX = top.x + dw / 2;
        const pivotY = top.y + dh * 0.94;
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(Math.sin(t * ((Math.PI * 2) / 7)) * 0.021);
        ctx.drawImage(sprite, -dw / 2, -dh * 0.94, dw, dh);
        ctx.restore();
      }

      // lamplight stirs behind the ajar screen door
      const doorCycle = (t % 13) / 13;
      if (doorCycle > 0.8) {
        const dp = map.px(DOOR.x, DOOR.y);
        const da = Math.sin(((doorCycle - 0.8) / 0.2) * Math.PI) * 0.3;
        const dg = ctx.createRadialGradient(dp.x, dp.y, 2, dp.x, dp.y, map.unit * 0.045);
        dg.addColorStop(0, `rgba(255,205,130,${da})`);
        dg.addColorStop(1, 'rgba(255,205,130,0)');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, map.unit * 0.045, 0, Math.PI * 2);
        ctx.fill();
      }

      // the register catches the light
      const regCycle = (t % 12) / 12;
      if (regCycle > 0.85) {
        const rp = map.px(REGISTER.x, REGISTER.y);
        const ra = Math.sin(((regCycle - 0.85) / 0.15) * Math.PI) * 0.25;
        const rg = ctx.createRadialGradient(rp.x, rp.y, 2, rp.x, rp.y, map.unit * 0.04);
        rg.addColorStop(0, `rgba(255,240,200,${ra})`);
        rg.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, map.unit * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }

      // something crosses the upstairs window
      const winCycle = (t % 21) / 21;
      if (winCycle > 0.88 && winCycle < 0.97) {
        const prog = (winCycle - 0.88) / 0.09;
        const wp = map.px(WINDOW.x, WINDOW.y);
        const sx = wp.x - map.unit * 0.03 + prog * map.unit * 0.06;
        const sg = ctx.createRadialGradient(sx, wp.y, 1, sx, wp.y, map.unit * 0.02);
        sg.addColorStop(0, 'rgba(20,14,8,0.5)');
        sg.addColorStop(1, 'rgba(20,14,8,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(sx, wp.y, map.unit * 0.012, map.unit * 0.02, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [map]);

  const spot = (fx: number, fy: number) => {
    if (!map) return { x: -200, y: -200 };
    const p = map.px(fx, fy);
    return { x: p.x, y: p.y };
  };

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#17100a]">
      <motion.img
        src={IMG_SRC}
        alt="The Eyelid Boarding House at dusk"
        className="h-full w-full object-cover"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        draggable={false}
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(12,7,3,0.5) 100%)' }}
      />

      {/* fireflies */}
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute z-[7] h-1.5 w-1.5 rounded-full"
          style={{ background: '#ffdf9e', boxShadow: '0 0 8px 2px rgba(255,223,158,0.7)', left: `${12 + ((i * 37) % 76)}%`, top: `${55 + ((i * 23) % 35)}%` }}
          animate={{ x: [0, 14, -10, 0], y: [0, -12, 8, 0], opacity: [0.2, 0.9, 0.3, 0.2] }}
          transition={{ duration: 7 + (i % 4) * 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}

      {map && (
        <>
          <Spot {...spot(DOOR.x, DOOR.y)} label="The screen door" onTap={() => { ambience.screenDoor(); window.setTimeout(onEnter, 450); }} />
          <Spot {...spot(REGISTER.x, REGISTER.y)} label="The register" onTap={() => { setPresence('anna', 'mentioned'); setRegisterOpen(true); }} />
          <Spot {...spot(CHAIR.x, CHAIR.y)} label="The rocking chair" onTap={() => flashNote('The chair is still rocking, though the air is still.')} />
          <Spot {...spot(WINDOW.x, WINDOW.y)} label="The upstairs window" onTap={() => flashNote('Something moved behind the curtain.')} />
        </>
      )}

      {note && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-16 left-1/2 z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/55 px-5 py-2 text-center font-serif text-sm italic text-amber-100/90 backdrop-blur-sm"
        >
          {note}
        </motion.p>
      )}

      <button
        onClick={onBack}
        className="absolute bottom-5 left-5 z-20 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs tracking-widest text-white/50 backdrop-blur-sm transition-colors hover:text-white/85"
      >
        ← town
      </button>

      <AnimatePresence>
        {registerOpen && <RegisterView variant="porch" onClose={() => setRegisterOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
