'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArtifactOverlay from './ArtifactOverlay';
import type { Artifact } from './EyelidExterior';

const IMG_SRC = '/art/room-six.webp';
/** Hotspot positions in IMAGE fractions (object-cover crops on phones). */
const CLOCK = { x: 0.546, y: 0.614 };
const MELON = { x: 0.608, y: 0.628 };

/** Maps image fractions to element pixels under object-cover. */
function useCoverMap(src: string, elRef: React.RefObject<HTMLDivElement | null>) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [el, setEl] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const im = new Image();
    im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = src;
  }, [src ]);
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
      unit: dw, // one image-width in px
    };
  }, [nat, el]);
}

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
          style={{ opacity: hov ? 1 : 0, background: 'radial-gradient(circle, rgba(255,205,120,0.22) 0%, transparent 70%)' }}
        />
      </span>
    </button>
  );
}

const PHOTO_FIRST: Artifact = {
  title: 'Photograph',
  body: `A framed photograph, silvered a little with age.\n\nA porch, empty, in daylight.\n\nNothing else.`,
};

const PHOTO_SECOND: Artifact = {
  title: 'Photograph',
  body: `A framed photograph, silvered a little with age.\n\nA porch. Someone is standing on it now.\n\nYou are fairly sure no one was standing on it before.`,
};

export default function RoomSix({ onLeave }: { onLeave: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = useCoverMap(IMG_SRC, wrapRef);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [photoViews, setPhotoViews] = useState(0);
  const melonTarget = useRef(0);

  const melonShown = photoViews >= 2;
  useEffect(() => {
    melonTarget.current = melonShown ? 1 : 0;
  }, [melonShown]);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 4200);
  };

  // living overlay: the clock runs backward; the watermelon fades in
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(map.el.w * dpr);
    canvas.height = Math.round(map.el.h * dpr);
    let raf = 0;
    let melon = 0;
    let last = performance.now();
    const t0 = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      melon += (melonTarget.current - melon) * Math.min(1, dt / 1.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, map.el.w, map.el.h);

      // clock face: cover the painted hands with a clean face, then run backward
      const c = map.px(CLOCK.x, CLOCK.y);
      const R = map.unit * 0.031;
      ctx.fillStyle = '#d9c9a4';
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,45,25,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(a) * R * 0.82, c.y + Math.sin(a) * R * 0.82);
        ctx.lineTo(c.x + Math.cos(a) * R * 0.95, c.y + Math.sin(a) * R * 0.95);
        ctx.stroke();
      }
      const hand = (len: number, ang: number, w: number, col: string) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x + Math.cos(ang) * len, c.y + Math.sin(ang) * len);
        ctx.stroke();
      };
      // all hands run backward. the second hand makes it undeniable.
      hand(R * 0.52, -Math.PI / 2 - t * ((Math.PI * 2) / 150), 3, '#3a2c1c'); // hour, backward creep
      hand(R * 0.8, -Math.PI / 2 - t * ((Math.PI * 2) / 40), 2.2, '#3a2c1c'); // minute, backward
      hand(R * 0.88, -Math.PI / 2 - t * ((Math.PI * 2) / 16), 1.2, '#8a2f22'); // second, backward sweep
      ctx.fillStyle = '#3a2c1c';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // the watermelon, once noticed
      if (melon > 0.01) {
        const m = map.px(MELON.x, MELON.y);
        const mw = map.unit * 0.042;
        const mh = mw * 0.72;
        ctx.globalAlpha = Math.min(1, melon);
        ctx.fillStyle = '#2e4a2a';
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, mw / 2, mh / 2, -0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(190,220,150,0.55)';
        ctx.lineWidth = 2;
        for (const off of [-0.22, 0, 0.22]) {
          ctx.beginPath();
          ctx.ellipse(m.x, m.y, (mw / 2) * (1 - Math.abs(off) * 1.4), mh / 2 - 2, -0.08, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = '#4a6a3a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.x + mw * 0.1, m.y - mh / 2);
        ctx.quadraticCurveTo(m.x + mw * 0.16, m.y - mh / 2 - 6, m.x + mw * 0.24, m.y - mh / 2 - 5);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [map]);

  const spot = (fx: number, fy: number) => {
    if (!map) return { x: -100, y: -100 };
    const p = map.px(fx, fy);
    return { x: p.x, y: p.y };
  };

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#100d08]">
      <motion.img
        src={IMG_SRC}
        alt="Room 6"
        className="h-full w-full object-cover"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        draggable={false}
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />
      {/* the room breathes, almost imperceptibly */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[6] bg-black"
        animate={{ opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(5,4,2,0.6) 100%)' }}
      />

      {map && (
        <>
          <Spot
            {...spot(0.185, 0.3)}
            label="The photograph"
            onTap={() => {
              const v = photoViews + 1;
              setPhotoViews(v);
              setArtifact(v === 1 ? PHOTO_FIRST : PHOTO_SECOND);
            }}
          />
          <Spot
            {...spot(CLOCK.x, CLOCK.y)}
            label="The clock"
            onTap={() => flashNote('The hands are moving backward — slowly, like they\u2019re sure of it.')}
          />
          <Spot
            {...spot(0.52, 0.38)}
            label="The window"
            onTap={() => flashNote('Through the window: the old well. The well is on the other side of town.')}
          />
          {melonShown && (
            <Spot
              {...spot(MELON.x, MELON.y)}
              label="The watermelon"
              onTap={() => flashNote('There wasn\u2019t a watermelon there before.')}
            />
          )}
          <Spot {...spot(0.85, 0.42)} label="The door" onTap={onLeave} />
        </>
      )}

      <AnimatePresence>
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
      </AnimatePresence>

      <button
        onClick={onLeave}
        className="absolute bottom-5 left-5 z-20 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs tracking-widest text-white/50 backdrop-blur-sm transition-colors hover:text-white/85"
      >
        ← hallway
      </button>

      <ArtifactOverlay artifact={artifact} onClose={() => setArtifact(null)} />
    </div>
  );
}
