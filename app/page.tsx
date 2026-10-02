import MapExperience from '@/components/MapExperience';
import { locations, characters } from '@/lib/content';

export default function Home() {
  return <MapExperience locations={locations} characters={characters} />;
}
