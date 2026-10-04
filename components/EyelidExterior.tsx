'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ArtifactOverlay from './ArtifactOverlay';
import { ambience } from '@/lib/ambience';

export interface Artifact {
  title: string;
  body: string;
  sign?: string;
}

/** Invisible hotspot with a whisper of a cue on hover. */
function Spot({
  x,
  y,
  label,
  onTap,
}: {
  x: number;
  y: number;
  label: string;
  onTap: () => void;
}) {
  const [hov, setHov] = useState(false);
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
      <span
        className="block h-14 w-14 rounded-full transition-opacity duration-700"
        style={{
          opacity: hov ? 1 : 0,
          background: 'radial-gradient(circle, rgba(255,205,120,0.28) 0%, transparent 70%)',
        }}
      />
    </button>
  );
}

const REGISTER_ARTIFACT: Artifact = {
  title: 'Porch register',
  body: `The book lies open on the porch table, as if someone stepped away mid-sentence.\n\nA. d'Konda — 3\nL. Ledbetter — 4\nThe Fairlys — 5\n\n6 —\n\nThe entry for 6 is scratched out so hard the paper tore.`,
};

export default function EyelidExterior({
  onEnter,
  onBack,
}: {
  onEnter: () => void;
  onBack: () => void;
}) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const flashNote = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote(null), 3400);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#17100a]">
      <motion.img
        src="/art/eyelid-exterior.webp"
        alt="The Eyelid Boarding House at dusk"
        className="h-full w-full object-cover"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(12,7,3,0.5) 100%)' }}
      />

      {/* fireflies */}
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
          style={{ background: '#ffdf9e', boxShadow: '0 0 8px 2px rgba(255,223,158,0.7)', left: `${12 + ((i * 37) % 76)}%`, top: `${55 + ((i * 23) % 35)}%` }}
          animate={{ x: [0, 14, -10, 0], y: [0, -12, 8, 0], opacity: [0.2, 0.9, 0.3, 0.2] }}
          transition={{ duration: 7 + (i % 4) * 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}

      <Spot x={0.6} y={0.62} label="The screen door" onTap={() => { ambience.screenDoor(); window.setTimeout(onEnter, 450); }} />
      <Spot x={0.82} y={0.68} label="The register" onTap={() => setArtifact(REGISTER_ARTIFACT)} />
      <Spot x={0.42} y={0.3} label="The upstairs window" onTap={() => flashNote('The curtain doesn\u2019t move. The room behind it is dark.')} />
      <Spot x={0.2} y={0.7} label="The rocking chair" onTap={() => flashNote('The chair is still rocking, though the air is still.')} />

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

      <ArtifactOverlay artifact={artifact} onClose={() => setArtifact(null)} />
    </div>
  );
}
