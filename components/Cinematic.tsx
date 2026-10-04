'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Arrival from './Arrival';
import TownScene from './TownScene';
import EyelidExterior from './EyelidExterior';
import EyelidLobby from './EyelidLobby';
import RoomSix from './RoomSix';
import { ambience, type AmbienceScene } from '@/lib/ambience';

const ROOM6_KEY = 'blindeye-cine-room6';

type Phase = 'arrival' | 'town' | 'exterior' | 'lobby' | 'room6';

const SCENE_SOUND: Record<Exclude<Phase, 'arrival'>, AmbienceScene> = {
  town: 'town',
  exterior: 'exterior',
  lobby: 'lobby',
  room6: 'room6',
};

/**
 * Cinematic Blind Eye: arrival → town → Eyelid exterior → lobby → Room #6 → town (changed).
 * No player character, no counters, no HUD. The town remembers.
 */
export default function Cinematic() {
  const [phase, setPhase] = useState<Phase>('arrival');
  const [room6, setRoom6] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ROOM6_KEY)) setRoom6(true);
    } catch {
      /* ignore */
    }
  }, []);

  const go = useCallback((p: Phase) => {
    setPhase(p);
    if (p !== 'arrival') ambience.setScene(SCENE_SOUND[p]);
    window.scrollTo(0, 0);
  }, []);

  const leaveRoom6 = useCallback(() => {
    setRoom6(true);
    try {
      localStorage.setItem(ROOM6_KEY, '1');
    } catch {
      /* ignore */
    }
    go('town');
  }, [go]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-[#f2e8d5]">
      <AnimatePresence mode="wait">
        {phase === 'arrival' && <Arrival key="arrival" onEnter={() => go('town')} />}
        {phase === 'town' && (
          <motion.div
            key="town"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <TownScene changed={room6} onEnterEyelid={() => go('exterior')} />
          </motion.div>
        )}
        {phase === 'exterior' && (
          <motion.div
            key="exterior"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <EyelidExterior onEnter={() => go('lobby')} onBack={() => go('town')} />
          </motion.div>
        )}
        {phase === 'lobby' && (
          <motion.div
            key="lobby"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <EyelidLobby onEnterRoom={() => go('room6')} onBack={() => go('exterior')} />
          </motion.div>
        )}
        {phase === 'room6' && (
          <motion.div
            key="room6"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6 }}
          >
            <RoomSix onLeave={leaveRoom6} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
