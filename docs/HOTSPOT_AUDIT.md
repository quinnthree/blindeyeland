# Eyelid Hotspot Audit (internal)

Every interaction must answer: **what visibly invites interaction?**
Rule: phenomenon first → interaction second → text third. No required
progression may depend on a completely invisible hit region.

Touch targets are generous everywhere (p-10 buttons / ~170–190 unit radii);
only the *invitation* must be visible and in-world. No glowing markers,
no pulses, no magnification effects.

## Town

| Object | Visible invitation | Touch target | After touch |
|---|---|---|---|
| Eyelid building | Staged: upstairs window illuminates (14s) → a silhouette passes the lit window, twice (26s) → a second window wakes (38s) | 190-unit region over the house | Cinematic push-in → exterior |
| Anna signal (only after Room #6; deterministic) | A watermelon beside the road with snakes arranged in a deliberate figure-eight. Simply there — no timing. | 170-unit region over the objects | Cinematic transition → Anna's original painting, full-frame |

## Eyelid exterior

| Object | Visible invitation | Touch target | After touch |
|---|---|---|---|
| Screen door | Lamplight stirs behind the ajar door, periodically | mapped hotspot | Screen-door sound → lobby |
| Porch register | The open book on the table; it catches the light periodically | mapped hotspot | Immersive register view (porch variant) |
| Rocking chair | The chair visibly rocks, slow and endless | mapped hotspot | “The chair is still rocking, though the air is still.” |
| Upstairs window | A silhouette crosses the lit window periodically | mapped hotspot | “Something moved behind the curtain.” |

## Lobby

| Object | Visible invitation | Touch target | After touch |
|---|---|---|---|
| Guest register | The open book on the desk | mapped hotspot | Immersive register view (lobby variant, “Do not assign 6.”) |
| Photographs | The frames catch the light periodically | mapped hotspot | Push-in; Anna's painting as a framed photograph; “On the back, in pencil: ‘A.’” |
| Key rack | The board itself; brass glints | mapped hotspot | Push-in; light pool; tag “6” sways on its hook; “One hook hangs empty.” / “Its tag reads: 6.” |
| Bell | It rings once, by itself (~22s in) | mapped hotspot | Ding; “The bell rings. Somewhere upstairs, something stops.” |
| Hallway | Light appears beneath the far door | mapped hotspot | Room #6 |

## Room #6

| Object | Visible invitation | Touch target | After touch |
|---|---|---|---|
| Clock | The hands visibly run backward (transparent overlay; painted face untouched) | mapped hotspot | “The hands are moving backward — slowly, like they're sure of it.” |
| Photograph | The frame catches the light periodically | mapped hotspot | 1st look: empty porch. 2nd look: someone is standing on it. |
| Watermelon | Fades into view on the nightstand after the 2nd photo look | mapped hotspot (only then) | “There wasn't a watermelon there before.” |
| Window | The daylight swells, as if something outside passed | mapped hotspot | “Through the window: the old well. The well is on the other side of town.” |
| Door | Navigation | mapped hotspot + ← hallway | Return to town (Anna now present) |

## Anna encounter

| Object | Visible invitation | Touch target | After touch |
|---|---|---|---|
| The painting | The painting itself, arriving full-frame; sound dims | tap anywhere | Return to town; Anna marked encountered |

## Notes

- Hotspot positions are stored in **image fractions** and mapped through
  `lib/useCoverMap.ts`, so they stay on the painted objects at any viewport
  (phones crop the paintings heavily under object-cover).
- `?qa-reset` clears all experience state; `?qa` shows the state overlay.
- The visitor-name mechanic is intentionally not implemented (next pass).
