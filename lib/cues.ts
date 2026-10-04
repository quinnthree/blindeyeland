/* Environmental cue staging — the lightest possible event system.
   A scene declares the absolute times (seconds) at which its invitation
   deepens; the hook returns the current stage. Authored by hand, per scene. */
import { useEffect, useState } from 'react';

export function useStagedCues(atSeconds: number[], active = true): number {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timers = atSeconds.map((t, i) => window.setTimeout(() => setStage(i + 1), t * 1000));
    return () => timers.forEach(clearTimeout);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return stage;
}
