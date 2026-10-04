'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CHARACTERS } from '@/lib/characters';
import { ambience } from '@/lib/ambience';

/**
 * First character encounter: the town falls away and the original painting
 * arrives. No biography, no buttons. Just the person.
 */
export default function AnnaEncounter({ onDone }: { onDone: () => void }) {
  const anna = CHARACTERS.anna;

  useEffect(() => {
    ambience.setDim(true);
    return () => ambience.setDim(false);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-30 cursor-pointer overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8 }}
      onClick={onDone}
    >
      <motion.img
        src={anna.asset}
        alt={anna.name}
        className="h-full w-full object-cover"
        initial={{ scale: 1.07, filter: 'brightness(0.45)' }}
        animate={{ scale: 1, filter: 'brightness(1)' }}
        transition={{ duration: 5, ease: 'easeOut' }}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }}
      />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 1.6 }}
        className="absolute bottom-24 left-0 right-0 text-center font-display text-2xl tracking-[0.2em] text-amber-50/90"
      >
        {anna.name}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 6.5, duration: 2 }}
        className="absolute bottom-14 left-0 right-0 px-8 text-center font-serif text-[15px] italic text-white/60"
      >
        The snake is arranged very deliberately. She doesn’t look up.
      </motion.p>
    </motion.div>
  );
}
