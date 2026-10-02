'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterData } from '@/lib/content';

function Portrait({ c }: { c: CharacterData }) {
  const [failed, setFailed] = useState(false);
  const initials = c.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-amber-100/25 bg-[#1c2242]">
      {!failed && c.portrait ? (
        <img
          src={c.portrait}
          alt={`Painting of ${c.name}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-2xl text-amber-100/80">
          {initials}
        </div>
      )}
    </div>
  );
}

export default function ResidentsPanel({
  open,
  characters,
  onClose,
}: {
  open: boolean;
  characters: CharacterData[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute bottom-0 left-0 right-0 z-40 max-h-[78dvh] overflow-y-auto rounded-t-2xl border-t border-amber-100/15 bg-[#12162e]/95 p-6 backdrop-blur-sm sm:bottom-6 sm:left-auto sm:right-6 sm:top-6 sm:w-[400px] sm:rounded-2xl sm:border"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl leading-tight text-amber-50">
                  Residents
                </h2>
                <p className="mt-1 text-sm italic text-amber-100/60">
                  Nobody remembers arriving. Everybody stayed.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {characters.map((c) => (
                <article key={c.slug} className="flex gap-4">
                  <Portrait c={c} />
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-amber-100">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      <span className="text-white/50">{c.place} · </span>
                      {c.habit}
                    </p>
                    <p className="mt-1 text-sm italic leading-relaxed text-amber-100/60">
                      {c.rumor}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-6 text-center text-xs italic text-white/40">
              Paintings by Sherry S. Pearl
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
