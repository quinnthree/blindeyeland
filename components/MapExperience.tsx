'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FogCanvas from './FogCanvas';
import LocationPanel from './LocationPanel';
import ResidentsPanel from './ResidentsPanel';
import type { LocationData, CharacterData } from '@/lib/content';

const VISITED_KEY = 'blindeye-visited';
const INTRO_KEY = 'blindeye-intro';

function Train() {
  return (
    <div className="train-wrap pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <svg
        className="train-svg"
        viewBox="0 0 120 26"
        width="120"
        height="26"
        aria-hidden
      >
        <rect x="2" y="8" width="34" height="14" rx="2" fill="#141824" />
        <rect x="40" y="10" width="26" height="12" rx="2" fill="#1a2033" />
        <rect x="70" y="10" width="26" height="12" rx="2" fill="#1a2033" />
        <rect x="100" y="10" width="16" height="12" rx="2" fill="#1a2033" />
        <rect x="6" y="11" width="8" height="6" fill="#e8a33d" opacity="0.85" />
        <rect x="44" y="12" width="6" height="5" fill="#e8a33d" opacity="0.6" />
        <rect x="74" y="12" width="6" height="5" fill="#e8a33d" opacity="0.6" />
        <circle cx="10" cy="23" r="2.4" fill="#0a0d1c" />
        <circle cx="28" cy="23" r="2.4" fill="#0a0d1c" />
        <circle cx="53" cy="23" r="2.4" fill="#0a0d1c" />
        <circle cx="83" cy="23" r="2.4" fill="#0a0d1c" />
        <circle cx="108" cy="23" r="2.4" fill="#0a0d1c" />
      </svg>
    </div>
  );
}

export default function MapExperience({
  locations,
  characters,
}: {
  locations: LocationData[];
  characters: CharacterData[];
}) {
  const [selected, setSelected] = useState<LocationData | null>(null);
  const [showResidents, setShowResidents] = useState(false);
  const [intro, setIntro] = useState(true);
  const [visited, setVisited] = useState<string[]>([]);
  const [par, setPar] = useState({ x: 0, y: 0 });
  const [trainOn, setTrainOn] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setVisited(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'));
      if (localStorage.getItem(INTRO_KEY)) setIntro(false);
    } catch {
      /* ignore */
    }
  }, []);

  // The train runs on an unlisted schedule. No timetable. That's the point.
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      t1 = setTimeout(
        () => {
          setTrainOn(true);
          t2 = setTimeout(() => setTrainOn(false), 11000);
          schedule();
        },
        50000 + Math.random() * 60000,
      );
    };
    schedule();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setPar({
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    });
  }, []);

  const openLocation = (loc: LocationData) => {
    setSelected(loc);
    setVisited((v) => {
      if (v.includes(loc.slug)) return v;
      const nv = [...v, loc.slug];
      try {
        localStorage.setItem(VISITED_KEY, JSON.stringify(nv));
      } catch {
        /* ignore */
      }
      return nv;
    });
  };

  const dismissIntro = () => {
    setIntro(false);
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      className="relative h-dvh w-full overflow-hidden bg-[#0b0e1f] text-[#f2e8d5]"
    >
      {/* map, drifting gently against the cursor */}
      <div
        className="absolute -inset-8 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${par.x * -26}px, ${par.y * -18}px)`,
        }}
      >
        <img
          src="/art/IMG_7262.webp"
          alt="Painted map of Blind Eye at dusk"
          className="h-full w-full object-cover"
        />
      </div>

      <FogCanvas />

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 52%, rgba(5,7,18,0.6) 100%)',
        }}
      />

      {trainOn && <Train />}

      {/* markers drift a little more than the map — depth */}
      <div
        className="absolute -inset-8 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${par.x * -52}px, ${par.y * -36}px)`,
        }}
      >
        {locations.map((loc) => (
          <button
            key={loc.slug}
            onClick={() => openLocation(loc)}
            aria-label={loc.name}
            className="group absolute -translate-x-1/2 -translate-y-1/2 p-3"
            style={{ left: `${loc.map.x}%`, top: `${loc.map.y}%` }}
          >
            <span
              className={`marker-dot ${
                loc.deep ? 'marker-deep' : 'marker-quiet'
              } ${visited.includes(loc.slug) ? 'marker-visited' : ''}`}
            />
            <span className="marker-label">{loc.name}</span>
          </button>
        ))}
      </div>

      {/* header */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-5">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-amber-50 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Blind Eye Land
          </h1>
          <p className="mt-0.5 text-xs text-white/60 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
            Discovered {visited.length} of {locations.length} corners
          </p>
        </div>
        <button
          onClick={() => setShowResidents(true)}
          className="rounded-full border border-amber-100/30 bg-black/40 px-4 py-2 text-sm text-amber-50 backdrop-blur-sm transition-colors hover:bg-amber-100/15"
        >
          Residents
        </button>
      </header>

      <LocationPanel location={selected} onClose={() => setSelected(null)} />
      <ResidentsPanel
        open={showResidents}
        characters={characters}
        onClose={() => setShowResidents(false)}
      />

      {/* intro */}
      <AnimatePresence>
        {intro && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0e1f]/85 p-6 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="max-w-md text-center">
              <h2 className="font-display text-5xl leading-tight text-amber-50">
                Blind Eye Land
              </h2>
              <p className="mt-4 text-lg italic leading-relaxed text-white/75">
                You&apos;ve arrived in Blind Eye.
                <br />
                Nobody remembers getting here.
              </p>
              <p className="mt-4 text-sm text-white/50">
                Click the glowing marks to wander.
              </p>
              <button
                onClick={dismissIntro}
                className="mt-8 rounded-full border border-amber-100/40 px-8 py-3 text-sm tracking-[0.2em] text-amber-50 uppercase transition-colors hover:bg-amber-100/15"
              >
                Wander in
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
