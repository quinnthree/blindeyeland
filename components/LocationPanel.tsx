'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LocationData } from '@/lib/content';

const ROOM6_KEY = 'blindeye-room6';

function RoomSix() {
  const [tries, setTries] = useState(0);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    try {
      setTries(parseInt(localStorage.getItem(ROOM6_KEY) || '0', 10));
    } catch {
      /* ignore */
    }
  }, []);

  const tryDoor = () => {
    const n = tries + 1;
    setTries(n);
    setTried(true);
    try {
      localStorage.setItem(ROOM6_KEY, String(n));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-amber-200/20 bg-black/30 p-4">
      {!tried ? (
        <button
          onClick={tryDoor}
          className="w-full rounded-md border border-amber-200/40 px-4 py-2 text-sm tracking-wide text-amber-100 transition-colors hover:bg-amber-200/10"
        >
          Try the door.
        </button>
      ) : (
        <div className="text-sm leading-relaxed text-amber-100/90">
          <p>The door doesn&apos;t open. It notes that you tried.</p>
          <p className="mt-2 italic opacity-70">
            The house has noticed you {tries} {tries === 1 ? 'time' : 'times'}.
          </p>
        </div>
      )}
    </div>
  );
}

export default function LocationPanel({
  location,
  onClose,
}: {
  location: LocationData | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {location && (
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
                  {location.name}
                </h2>
                <p className="mt-1 text-sm italic text-amber-100/60">
                  {location.tagline}
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

            {!location.deep && location.teaser && (
              <p className="text-[15px] leading-relaxed text-white/80">
                {location.teaser}
              </p>
            )}

            {location.fragments.map((f) => (
              <article key={f.title} className="mb-6">
                <h3 className="font-display text-xl text-amber-100">
                  {f.title}
                </h3>
                <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-white/80">
                  {f.body.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {f.thread && (
                  <p className="mt-3 border-l-2 border-amber-200/30 pl-3 text-sm italic text-amber-100/70">
                    {f.thread}
                  </p>
                )}
                {f.interactive === 'room6' && <RoomSix />}
              </article>
            ))}

            <p className="mt-6 text-center text-xs italic text-white/40">
              Paintings by Sherry S. Pearl
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
