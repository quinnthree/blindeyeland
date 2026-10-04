'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RegisterView from './RegisterView';
import { ambience } from '@/lib/ambience';
import { setPresence, CHARACTERS } from '@/lib/characters';
import { useCoverMap } from '@/lib/useCoverMap';

const IMG_SRC = '/art/eyelid-lobby.webp';
/** Hotspot positions in IMAGE fractions. */
const REGISTER_POS = { x: 0.405, y: 0.655 };
const BELL_POS = { x: 0.552, y: 0.64 };
const KEYS_POS = { x: 0.44, y: 0.4 };
const TAG_POS = { x: 0.45, y: 0.44 };
const PHOTOS_POS = { x: 0.11, y: 0.24 };
const HALLWAY_POS = { x: 0.8, y: 0.45 };
const DOOR_LIGHT = { x: 0.71, y: 0.715 };

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
          style={{ opacity: hov ? 1 : 0, background: 'radial-gradient(circle, rgba(255,205,120,0.25) 0%, transparent 70%)' }}
        />
      </span>
    </button>
  );
}

export default function EyelidLobby({ onEnterRoom, onBack }: { onEnterRoom: () => void; onBack: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = useCoverMap(IMG_SRC, wrapRef);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [focus, setFocus] = useState<null | 'keys' | 'photos'>(null);
  const [keysCaption, setKeysCaption] = useState(0);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 3600);
  };

  // the bell rings once, by itself
  useEffect(() => {
    const t = window.setTimeout(() => ambience.ding(), 22000);
    return () => clearTimeout(t);
  }, []);

  // keys captions, staged
  useEffect(() => {
    if (focus !== 'keys') {
      setKeysCaption(0);
      return;
    }
    const t1 = window.setTimeout(() => setKeysCaption(1), 1200);
    const t2 = window.setTimeout(() => setKeysCaption(2), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [focus]);

  // living overlay: light under the hallway door; the photo wall catches light
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(map.el.w * dpr);
    canvas.height = Math.round(map.el.h * dpr);
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, map.el.w, map.el.h);
      // light beneath the far hallway door, after a while
      if (t > 15) {
        const dp = map.px(DOOR_LIGHT.x, DOOR_LIGHT.y);
        const fade = Math.min(1, (t - 15) / 4);
        const pulse = 0.55 + 0.2 * Math.sin(t * 0.8);
        const w = map.unit * 0.035;
        const g = ctx.createLinearGradient(dp.x - w, 0, dp.x + w, 0);
        g.addColorStop(0, 'rgba(255,200,120,0)');
        g.addColorStop(0.5, `rgba(255,200,120,${0.5 * fade * pulse})`);
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(dp.x - w, dp.y - 2, w * 2, 5);
      }
      // the photo wall catches the light, now and then
      const gleamCycle = (t % 17) / 17;
      if (gleamCycle > 0.85) {
        const gp = map.px(PHOTOS_POS.x, PHOTOS_POS.y);
        const ga = Math.sin(((gleamCycle - 0.85) / 0.15) * Math.PI) * 0.2;
        const gg = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, map.unit * 0.06);
        gg.addColorStop(0, `rgba(255,240,200,${ga})`);
        gg.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, map.unit * 0.06, 0, Math.PI * 2);
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

  const focusPt = (fx: number, fy: number) => {
    if (!map) return { x: 50, y: 50 };
    const p = map.px(fx, fy);
    return { x: (p.x / map.el.w) * 100, y: (p.y / map.el.h) * 100 };
  };
  const fp = focus === 'keys' ? focusPt(KEYS_POS.x, KEYS_POS.y) : focus === 'photos' ? focusPt(PHOTOS_POS.x, PHOTOS_POS.y) : null;
  const tagPx = map ? map.px(TAG_POS.x, TAG_POS.y) : { x: 0, y: 0 };

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#141009]">
      <div
        className="h-full w-full transition-transform duration-[1200ms] ease-out"
        style={fp ? { transform: 'scale(1.65)', transformOrigin: `${fp.x}% ${fp.y}%` } : { transform: 'scale(1)' }}
      >
        <motion.img
          src={IMG_SRC}
          alt="The lobby of the Eyelid Boarding House"
          className="h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          draggable={false}
        />
      </div>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(8,5,2,0.55) 100%)' }}
      />

      {/* dust in the window light */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute z-[7] h-1 w-1 rounded-full bg-amber-100/60"
          style={{ left: `${62 + ((i * 29) % 30)}%`, top: `${18 + ((i * 41) % 60)}%` }}
          animate={{ y: [0, -26, 0], x: [0, 8, 0], opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {map && !focus && (
        <>
          <Spot {...spot(REGISTER_POS.x, REGISTER_POS.y)} label="The guest register" onTap={() => { setPresence('anna', 'mentioned'); setRegisterOpen(true); }} />
          <Spot {...spot(PHOTOS_POS.x, PHOTOS_POS.y)} label="The photographs" onTap={() => setFocus('photos')} />
          <Spot {...spot(KEYS_POS.x, KEYS_POS.y)} label="The keys" onTap={() => setFocus('keys')} />
          <Spot
            {...spot(BELL_POS.x, BELL_POS.y)}
            label="The bell"
            onTap={() => {
              ambience.ding();
              flashNote('The bell rings. Somewhere upstairs, something stops.');
            }}
          />
          <Spot {...spot(HALLWAY_POS.x, HALLWAY_POS.y)} label="The hallway" onTap={onEnterRoom} />
        </>
      )}

      {/* keys: the rack comes closer; one tag hangs alone */}
      <AnimatePresence>
        {focus === 'keys' && (
          <motion.div
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onClick={() => setFocus(null)}
          >
            <div className="absolute inset-0 bg-black/35" />
            {/* light pool over the board */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: tagPx.x - 90,
                top: tagPx.y - 110,
                width: 180,
                height: 220,
                background: 'radial-gradient(ellipse, rgba(255,220,150,0.22) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 1.2 }}
            />
            {/* the tag */}
            <motion.div
              className="absolute"
              style={{ left: tagPx.x - 14, top: tagPx.y }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1 }}
            >
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="origin-top"
              >
                <div className="mx-auto h-8 w-px bg-amber-100/50" />
                <div className="flex h-11 w-9 items-center justify-center rounded-[3px] bg-[#e2d0a8] shadow-lg">
                  <span className="font-serif text-xl italic text-[#3a2c1c]">6</span>
                </div>
              </motion.div>
            </motion.div>
            {keysCaption >= 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-24 left-0 right-0 text-center font-serif text-[15px] italic text-amber-50/85"
              >
                One hook hangs empty.
              </motion.p>
            )}
            {keysCaption >= 2 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-16 left-0 right-0 text-center font-serif text-[15px] italic text-amber-50/85"
              >
                Its tag reads: 6.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* photographs: one frame isn't empty */}
      <AnimatePresence>
        {focus === 'photos' && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onClick={() => setFocus(null)}
          >
            <div className="absolute inset-0 bg-black/55" />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.1 }}
              className="relative w-full max-w-[380px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-[12px] border-[#241a10] bg-[#241a10] shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
                <img src={CHARACTERS.anna.asset} alt="A photograph of a girl with a snake" className="w-full" draggable={false} />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 1.4 }}
                className="mt-4 text-center font-serif text-[15px] italic text-amber-50/75"
              >
                On the back, in pencil: “A.”
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {!focus && (
        <button
          onClick={onBack}
          className="absolute bottom-5 left-5 z-20 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs tracking-widest text-white/50 backdrop-blur-sm transition-colors hover:text-white/85"
        >
          ← porch
        </button>
      )}

      <AnimatePresence>
        {registerOpen && <RegisterView variant="lobby" onClose={() => setRegisterOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
