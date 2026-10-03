# Blind Eye Land — Rebuild: Prototype Spec (DRAFT for approval)

> **DIRECTION UPDATE — Oct 3, 2026 (Quinn):** The twilight folk-art map (direction B) is retired. The experience is now a **game-like explorable scene**: a little wanderer the visitor moves around the town (tap-to-move on mobile, WASD/arrows on desktop), follow camera, pinch/button zoom, proximity-based discovery, train on visible tracks. Art direction reverted to **a style like the original site**: warm golden-hour storybook Americana, dense painterly detail, much bigger scene. Zero baked-in text rule kept — all labels as overlays. Content (6 locations, 9 residents, fragments) carries over unchanged.

Status: draft. Built from the Oct 2, 2026 AI review + live-site audit. Nothing here is final until Quinn approves.

## Objective of the prototype

Prove the core fantasy in one clickable screen: **you arrive at a strange hand-drawn town, you wander, residents talk to you.** The prototype is the map as the entire homepage, with 3 deep locations and the 9 characters present as stubs. Deployed as a Vercel preview URL for Quinn to click through. No commerce, no accounts, no CMS — content lives in flat JSON files.

## What the audit taught us (constraints)

- Current site's map has heavy AI-garbled baked-in text ("LECKLID BOARDING HOUSE", "LITTLE OPPR"). **Rule: zero text baked into any generated image. All labels as HTML/SVG overlays.**
- Map modal images are broken/placeholder; character portraits on the homepage load fine and are stylistically consistent — determine whether these are Sherry's actual paintings or AI stand-ins once files arrive.
- Dead UI exists (Little Opry sub-buttons do nothing) — every interactive element in the prototype must do something.
- Content is thin (blurbs + 4-line dialogues). Prototype needs fewer locations but deeper: 3 locations × real fragments beats 9 locations × one-liners.
- "Ida Noe" (site) vs "Ida Know" (handoff) unresolved — pending Quinn asking Sherry. Prototype ships with a single constant so the rename is one-line.
- Footer claims Supabase; images actually on Vercel Blob. Prototype: pick one (Supabase, since it's already in the project's orbit) and tell the truth in the footer.

## Map art direction (3 options — pick one before generation)

All options: painterly, sepia/ink storybook feel, NO text in the image, delivered as separable layers (sky/atmosphere, town midground, foreground) for parallax depth.

- **A. Ink + selective red.** Closest to the original hand-drawn sketch: black ink linework, paper texture, red reserved strictly for interactive markers and 2–3 signature details (barn, snake). Most distinctive, most on-brand.
- **B. Twilight folk-art.** Richer painted look in the vein of the character portraits — dusk blues/ambers, glowing windows. Prettier at first glance, higher risk of generic "cozy mystery" feel.
- **C. Aged county map.** Faded archival document aesthetic — as if the map itself is an artifact found in the Eyelid Boarding House. Strong conceptually; risks feeling flat/static.

Recommendation: **A**, with B's warmth in the lighting. Generate at high resolution; downscale aggressively for web.

## Interaction design (prototype scope)

- **First 60 seconds:** full-viewport map, quiet. 3 red markers pulse gently. A single line of text: "You've arrived in Blind Eye. Nobody remembers getting here." One hint: "Click the red marks."
- **Locations (deep):** Little Opry, Eyelid Boarding House, Chix Cafe. Each opens a panel with: Sherry's artwork or art-directed illustration, 2–3 story fragments (150–250 words each, written to the snake-watermelon bar), and one thread to another location ("Ask Ida Know. She won't tell you either." — chains, not hubs).
- **Characters:** all 9 present with portrait + ≤150 words (one place, one habit, one rumor). Stubs in the prototype; full dialogue chains come in Phase 2.
- **The train:** one ambient crossing on an unlisted schedule (CSS/SVG animation, no video in prototype). No explanation, no timetable.
- **Atmosphere:** canvas-based drifting fog/mist layer (kilobytes, seamless, toggleable). No ambient audio in prototype (autoplay politics); design the toggle for Phase 2.
- **Room #6:** the door drawn slightly ajar, clickable — doesn't open, just notes that you tried. One line of text. That's the whole interaction.
- **Discovery state:** visited markers dim; progress persisted in localStorage ("You've met 3 of 9 residents"). No accounts in prototype.

## Tech

- Next.js App Router + Vercel (preview deploys per push), Supabase Storage for images, framer-motion for panel transitions, canvas for fog. Content as flat JSON (`/content/locations/*.json`, `/content/characters/*.json`) so Quinn can add a fragment by editing a file.
- Performance budget: first paint < 2s on mid-tier mobile; map art served responsive (srcset); fog canvas paused when tab hidden.

## Explicitly NOT in the prototype

## Explicitly NOT in the prototype

Commerce, Gallery, accounts/membership, email capture, CMS/admin UI. Video: no Higgsfield (decision Oct 2, 2026) — canvas/SVG for fog and ambient drift; 1–2 AI hero loops (train at dusk, glowing windows) via Luma Ray 3.2 image-to-video from the real artwork, in Phase 2, one-time cost <$30.

## Open decisions for Quinn

1. Map art direction: A, B, or C (recommendation: A).
2. Ida Know vs Ida Noe (ask Sherry).
3. Revenue model A/B/C (needed before Phase 3, not the prototype).
4. The 9 painting files + any location artwork — critical path for Phase 2.
5. GitHub login + Vercel auth — needed before first deploy.
