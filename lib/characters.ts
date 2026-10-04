/* Blind Eye character state — lightweight, authored, local.
   A character is never just "unlocked". They move through presence states
   depending on what the visitor has experienced. */

export type CharacterId =
  | 'anna'
  | 'lewis'
  | 'judge'
  | 'hollywood'
  | 'alma'
  | 'alvin'
  | 'ida'
  | 'horace';

/** unseen → mentioned → present → encountered */
export type Presence = 'unseen' | 'mentioned' | 'present' | 'encountered';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  asset: string;
  note: string;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  anna: {
    id: 'anna',
    name: "Anna d'Konda",
    asset: '/art/paintings/anna_d%27konda.png',
    note: 'Arranges snakes into deliberate shapes. Claims they smell like watermelon.',
  },
  lewis: { id: 'lewis', name: 'Lewis Ledbetter', asset: '/art/paintings/lewis_ledbetter.png', note: '' },
  judge: { id: 'judge', name: 'Judge Fairly', asset: '/art/paintings/judge_fairly.png', note: '' },
  hollywood: { id: 'hollywood', name: 'Hollywood', asset: '/art/paintings/hollywood.png', note: '' },
  alma: { id: 'alma', name: 'Alma', asset: '/art/paintings/alma.png', note: '' },
  alvin: { id: 'alvin', name: 'Alvin Dupe', asset: '/art/paintings/alvin_dupe.png', note: 'Surname spelling not fully locked.' },
  ida: { id: 'ida', name: 'Ida Noe', asset: '/art/paintings/ida_noe.png', note: 'Pronounced "I dunno".' },
  horace: { id: 'horace', name: 'Horace Hand', asset: '/art/paintings/horace_hand.png', note: '' },
};

const KEY = 'blindeye-characters';

function readAll(): Record<string, Presence> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, Presence>;
  } catch {
    return {};
  }
}

export function getPresence(id: CharacterId): Presence {
  return readAll()[id] || 'unseen';
}

/** Presence only ever moves forward. */
export function setPresence(id: CharacterId, next: Presence): void {
  const order: Presence[] = ['unseen', 'mentioned', 'present', 'encountered'];
  const all = readAll();
  const cur = all[id] || 'unseen';
  if (order.indexOf(next) > order.indexOf(cur)) {
    all[id] = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }
}
