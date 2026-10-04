'use client';
import { useState } from 'react';
import { getPresence, type CharacterId } from '@/lib/characters';

const KEYS = ['blindeye-cine-room6', 'blindeye-characters', 'blindeye-cine-followhint'];

export function qaReset() {
  KEYS.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

/** Temporary development diagnostics. Only rendered with ?qa in the URL. */
export default function QaOverlay() {
  const [, bump] = useState(0);
  const read = (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const chars: CharacterId[] = ['anna', 'lewis', 'judge', 'hollywood', 'alma', 'alvin', 'ida', 'horace'];
  return (
    <div className="absolute bottom-2 right-2 z-[100] max-w-[240px] rounded bg-black/80 p-3 font-mono text-[10px] leading-relaxed text-lime-300">
      <p className="mb-1 text-white/70">QA STATE — tap to refresh</p>
      <div onClick={() => bump((n) => n + 1)} className="cursor-pointer">
        <p>room6Visited: {read('blindeye-cine-room6') ? 'true' : 'false'}</p>
        <p>followHintSeen: {read('blindeye-cine-followhint') ? 'true' : 'false'}</p>
        {chars.map((c) => (
          <p key={c}>
            {c}: {getPresence(c)}
          </p>
        ))}
      </div>
      <button
        className="mt-2 rounded bg-red-900/80 px-2 py-1 text-white"
        onClick={() => {
          qaReset();
          window.location.replace(window.location.pathname);
        }}
      >
        RESET + RELOAD
      </button>
    </div>
  );
}
