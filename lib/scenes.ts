/* Blind Eye scene contract — deliberately light.
   A scene is a React component plus a small declaration. The declaration
   exists so future locations (Chix, the Opry, …) can be authored without
   copying large amounts of custom code. Components keep full control of
   their own rendering; this registry only describes what the world needs
   to know: art, sound, and how the visitor gets in and out. */

import type { AmbienceScene } from './ambience';

export type SceneId =
  | 'arrival'
  | 'town'
  | 'eyelid-exterior'
  | 'eyelid-lobby'
  | 'room-6'
  | 'anna-encounter';

export interface SceneDef {
  id: SceneId;
  /** full-bleed background art */
  art: string;
  /** ambient sound for this scene */
  sound: AmbienceScene | null;
  /** where the visitor can go from here, in plain words */
  exits: string[];
  /** what invites the visitor onward (environmental, never a button label) */
  invitations: string[];
  /** localStorage keys this scene reads/writes */
  stateKeys: string[];
}

export const SCENES: Record<SceneId, SceneDef> = {
  arrival: {
    id: 'arrival',
    art: '(black)',
    sound: null,
    exits: ['town'],
    invitations: ['the word "listen"'],
    stateKeys: [],
  },
  town: {
    id: 'town',
    art: '/art/world-golden.WEBP',
    sound: 'town',
    exits: ['eyelid-exterior', 'anna-encounter'],
    invitations: [
      'upstairs window illuminates → flickers → porch light → stronger breath',
      'after Room #6: dust and shadow by the road (Anna)',
    ],
    stateKeys: ['blindeye-cine-room6', 'blindeye-characters', 'blindeye-cine-followhint'],
  },
  'eyelid-exterior': {
    id: 'eyelid-exterior',
    art: '/art/eyelid-exterior.webp',
    sound: 'exterior',
    exits: ['eyelid-lobby', 'town'],
    invitations: ['screen door ajar', 'register shimmer', 'rocking chair moving in still air'],
    stateKeys: ['blindeye-characters'],
  },
  'eyelid-lobby': {
    id: 'eyelid-lobby',
    art: '/art/eyelid-lobby.webp',
    sound: 'lobby',
    exits: ['room-6', 'eyelid-exterior'],
    invitations: ['hallway shimmer', 'bell', 'key hooks', 'photographs'],
    stateKeys: ['blindeye-characters'],
  },
  'room-6': {
    id: 'room-6',
    art: '/art/room-six.webp',
    sound: 'room6',
    exits: ['town'],
    invitations: ['clock running backward (visible)', 'photograph changes', 'watermelon appears'],
    stateKeys: ['blindeye-cine-room6', 'blindeye-characters'],
  },
  'anna-encounter': {
    id: 'anna-encounter',
    art: '/art/paintings/anna_d%27konda.png',
    sound: 'town',
    exits: ['town'],
    invitations: ['the painting itself'],
    stateKeys: ['blindeye-characters'],
  },
};
