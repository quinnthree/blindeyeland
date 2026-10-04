'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArtifactOverlay from './ArtifactOverlay';
import type { Artifact } from './EyelidExterior';

function Spot({ x, y, label, onTap }: { x: number; y: number; label: string; onTap: () => void }) {
  const [hov, setHov] = useState(false);
  // each hotspot breathes a faint shimmer on its own slow rhythm — a whisper, not a marker
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
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer p-8"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
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

const PHOTO_FIRST: Artifact = {
  title: 'Photograph',
  body: `A framed photograph, silvered a little with age.\n\nA porch, empty, in daylight.\n\nNothing else.`,
};

const PHOTO_SECOND: Artifact = {
  title: 'Photograph',
  body: `A framed photograph, silvered a little with age.\n\nA porch. Someone is standing on it now.\n\nYou are fairly sure no one was standing on it before.`,
};

export default function RoomSix({ onLeave }: { onLeave: () => void }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [photoViews, setPhotoViews] = useState(0);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 4200);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#100d08]">
      <motion.img
        src="/art/room-six.webp"
        alt="Room 6"
        className="h-full w-full object-cover"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        draggable={false}
      />
      {/* the room breathes, almost imperceptibly */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-black"
        animate={{ opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(5,4,2,0.6) 100%)' }}
      />

      <Spot
        x={0.22}
        y={0.28}
        label="The photograph"
        onTap={() => {
          const v = photoViews + 1;
          setPhotoViews(v);
          setArtifact(v === 1 ? PHOTO_FIRST : PHOTO_SECOND);
        }}
      />
      <Spot
        x={0.57}
        y={0.66}
        label="The clock"
        onTap={() => flashNote('The hands are moving backward — slowly, like they\u2019re sure of it.')}
      />
      <Spot
        x={0.52}
        y={0.38}
        label="The window"
        onTap={() => flashNote('Through the window: the old well. The well is on the other side of town.')}
      />
      <Spot x={0.85} y={0.42} label="The door" onTap={onLeave} />

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
