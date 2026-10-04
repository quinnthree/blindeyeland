'use client';
import { motion } from 'framer-motion';

const PAPER_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.34 0 0 0 0 0.24 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface Entry {
  room: string;
  name: string;
  note?: string;
  scratched?: boolean;
}

const PORCH_ENTRIES: Entry[] = [
  { room: '3', name: "A. d'Konda" },
  { room: '4', name: 'L. Ledbetter' },
  { room: '5', name: 'The Fairlys' },
  { room: '6', name: '', scratched: true },
];

const LOBBY_ENTRIES: Entry[] = [
  { room: '3', name: "A. d'Konda", note: '"snakes in the bathtub again"' },
  { room: '4', name: 'L. Ledbetter' },
  { room: '5', name: 'The Fairlys', note: '"do not move them"' },
  { room: '6', name: '', scratched: true },
];

/** The register as a physical object: the camera has moved to the book. */
export default function RegisterView({
  variant,
  onClose,
}: {
  variant: 'porch' | 'lobby';
  onClose: () => void;
}) {
  const entries = variant === 'porch' ? PORCH_ENTRIES : LOBBY_ENTRIES;
  return (
    <motion.div
      className="absolute inset-0 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      onClick={onClose}
    >
      {/* the page fills the world */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(155deg, #e9dab9 0%, #e0cba1 45%, #d6bd90 100%)',
        }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: PAPER_NOISE }} />
        {/* ledger margin line */}
        <div className="absolute bottom-0 left-14 top-0 w-px bg-red-900/25" />
        {/* edge darkening */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(90,60,25,0.35) 100%)' }}
        />

        <div className="relative mx-auto flex h-full max-w-lg flex-col justify-center px-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-display text-sm uppercase tracking-[0.3em] text-[#4a3a24]"
          >
            Eyelid Boarding House
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="mt-1 font-serif text-sm italic text-[#4a3a24]"
          >
            register of guests
          </motion.p>

          <div className="mt-10 space-y-7">
            {entries.map((en, i) => (
              <motion.div
                key={en.room}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.55, duration: 0.8 }}
                className="relative flex items-baseline gap-4"
              >
                <span className="w-8 shrink-0 font-serif text-xl text-[#4a3a24]/80">{en.room}</span>
                <span className="relative font-serif text-[26px] italic leading-snug text-[#33261a]">
                  {en.scratched ? (
                    <span className="relative inline-block">
                      <span className="opacity-40">—</span>
                      {/* scratched through the paper */}
                      <span className="absolute -left-2 top-1/2 h-[3px] w-[130%] -translate-y-1/2 rotate-[-4deg] rounded bg-[#241a10]/85" />
                      <span className="absolute -left-1 top-1/2 h-[2px] w-[120%] -translate-y-1/2 rotate-[3deg] rounded bg-[#241a10]/70" />
                      <span className="absolute left-0 top-1/2 h-[4px] w-[110%] -translate-y-1/2 rotate-[-1deg] rounded bg-[#2e2114]/80" />
                      <span className="absolute -left-2 top-[38%] h-[1.5px] w-[125%] rotate-[7deg] rounded bg-[#241a10]/60" />
                    </span>
                  ) : (
                    en.name
                  )}
                  {en.note && (
                    <span className="ml-3 text-[17px] not-italic opacity-55">{en.note}</span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          {variant === 'lobby' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6, duration: 1.2 }}
              className="mt-12 -rotate-2 font-serif text-[19px] italic text-[#5a2e1e]/85"
            >
              Beneath the scratched-out name, in a different hand:
              <br />
              <span className="text-[22px]">“Do not assign 6.”</span>
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 4.2, duration: 1.5 }}
            className="mt-14 text-center font-serif text-sm italic text-[#4a3a24]"
          >
            tap anywhere to put it back
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
