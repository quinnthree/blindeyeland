'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArtifactOverlay from './ArtifactOverlay';
import type { Artifact } from './EyelidExterior';
import { ambience } from '@/lib/ambience';

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

const REGISTER: Artifact = {
  title: 'Guest register',
  body: `The pages go back years. The handwriting changes; the ink doesn't.\n\nA. d'Konda — 3, "snakes in the bathtub again"\nL. Ledbetter — 4\nThe Fairlys — 5, "do not move them"\n\n6 —\n\nBeneath the scratched-out name, in a different hand:\n"Do not assign 6."`,
};

const PHOTOS: Artifact = {
  title: 'Photographs',
  body: `A wall of framed photographs, all a little faded.\n\nA wedding. Every face is turned away from the camera.\n\nA county fair. The Ferris wheel is empty, mid-spin.\n\nA porch with six rocking chairs. Five are occupied.`,
};

const KEYS: Artifact = {
  title: 'Key hooks',
  body: `Rows of brass keys, each tagged in the same careful hand.\n\nOne hook hangs empty.\n\nIts tag reads: 6.`,
};

export default function EyelidLobby({ onEnterRoom, onBack }: { onEnterRoom: () => void; onBack: () => void }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 3600);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#141009]">
      <motion.img
        src="/art/eyelid-lobby.webp"
        alt="The lobby of the Eyelid Boarding House"
        className="h-full w-full object-cover"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(8,5,2,0.55) 100%)' }}
      />

      {/* dust in the window light */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-100/60"
          style={{ left: `${62 + ((i * 29) % 30)}%`, top: `${18 + ((i * 41) % 60)}%` }}
          animate={{ y: [0, -26, 0], x: [0, 8, 0], opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      <Spot x={0.42} y={0.72} label="The guest register" onTap={() => setArtifact(REGISTER)} />
      <Spot x={0.08} y={0.3} label="The photographs" onTap={() => setArtifact(PHOTOS)} />
      <Spot x={0.42} y={0.42} label="The keys" onTap={() => setArtifact(KEYS)} />
      <Spot
        x={0.56}
        y={0.66}
        label="The bell"
        onTap={() => {
          ambience.ding();
          flashNote('The bell rings. Somewhere upstairs, something stops.');
        }}
      />
      <Spot x={0.8} y={0.45} label="The hallway" onTap={onEnterRoom} />

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
        onClick={onBack}
        className="absolute bottom-5 left-5 z-20 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs tracking-widest text-white/50 backdrop-blur-sm transition-colors hover:text-white/85"
      >
        ← porch
      </button>

      <ArtifactOverlay artifact={artifact} onClose={() => setArtifact(null)} />
    </div>
  );
}
