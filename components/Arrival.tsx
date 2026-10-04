'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ambience } from '@/lib/ambience';

/**
 * Arrival: black screen. Sound begins first (on the visitor's first tap,
 * which the browser requires). Then the name. Then ENTER.
 */
export default function Arrival({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState<'black' | 'title' | 'enter'>('black');

  const begin = () => {
    if (phase !== 'black') return;
    ambience.ensure();
    ambience.setScene('town');
    setPhase('title');
    window.setTimeout(() => setPhase('enter'), 2600);
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex cursor-pointer items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.6 } }}
      onClick={begin}
    >
      <AnimatePresence mode="wait">
        {phase === 'black' && (
          <motion.p
            key="b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="text-sm tracking-[0.35em] text-white/35"
          >
            listen
          </motion.p>
        )}
        {phase !== 'black' && (
          <motion.div key="t" className="px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
            <h1 className="font-display text-6xl tracking-[0.18em] text-amber-50/95 md:text-7xl">
              BLIND EYE
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1.6 }}
              className="mt-5 font-serif text-lg italic text-white/50"
            >
              Nobody remembers getting here.
            </motion.p>
            <AnimatePresence>
              {phase === 'enter' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.4 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnter();
                  }}
                  className="mt-12 rounded-full border border-amber-100/35 px-10 py-3 text-sm uppercase tracking-[0.3em] text-amber-50/90 transition-colors hover:bg-amber-100/10"
                >
                  Enter
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
