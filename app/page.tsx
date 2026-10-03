import GameMap from '@/components/GameMap';
import { locations, characters } from '@/lib/content';

export default function Home() {
  return <GameMap locations={locations} characters={characters} />;
}
