export interface Fragment {
  title: string;
  body: string;
  thread?: string;
  interactive?: 'room6';
}

export interface LocationData {
  slug: string;
  name: string;
  tagline: string;
  map: { x: number; y: number };
  deep: boolean;
  teaser?: string;
  fragments: Fragment[];
}

export interface CharacterData {
  slug: string;
  name: string;
  place: string;
  habit: string;
  rumor: string;
  portrait?: string;
}

import littleOpry from '@/content/locations/little-opry.json';
import eyelid from '@/content/locations/eyelid-boarding-house.json';
import chix from '@/content/locations/chix-cafe.json';
import generalStore from '@/content/locations/general-store.json';
import oldWell from '@/content/locations/old-well.json';
import crossing from '@/content/locations/railroad-crossing.json';

import alvin from '@/content/characters/alvin-dupe.json';
import lewis from '@/content/characters/lewis-ledbetter.json';
import judge from '@/content/characters/judge-fairly.json';
import hollywood from '@/content/characters/hollywood.json';
import alma from '@/content/characters/alma.json';
import anna from '@/content/characters/anna-dkonda.json';
import ida from '@/content/characters/ida-noe.json';
import horace from '@/content/characters/horace-hand.json';
import drumstick from '@/content/characters/drumstick.json';

export const locations: LocationData[] = [
  littleOpry as LocationData,
  eyelid as LocationData,
  chix as LocationData,
  generalStore as LocationData,
  oldWell as LocationData,
  crossing as LocationData,
];

export const characters: CharacterData[] = [
  alvin as CharacterData,
  lewis as CharacterData,
  judge as CharacterData,
  hollywood as CharacterData,
  alma as CharacterData,
  anna as CharacterData,
  ida as CharacterData,
  horace as CharacterData,
  drumstick as CharacterData,
];
