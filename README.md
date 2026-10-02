# Blind Eye Land

An interactive fictional town you wander instead of read about. Map-first discovery site for the mythical small town of Blind Eye — its residents, stories, and mysteries.

Paintings by Sherry S. Pearl.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- framer-motion for panel transitions
- Canvas fog/atmosphere layers
- Content as flat JSON — no CMS

## Structure

```
app/            # Next.js routes (the map is the homepage)
content/
  locations/    # one JSON file per location
  characters/   # one JSON file per resident
  README.md     # content file format
docs/           # project docs (prototype spec, canon)
public/art/     # artwork (paintings, map layers) — added in Phase 1/2
```

## Adding a story fragment

Edit (or add) a JSON file in `content/locations/`. No build step beyond `npm run dev`.

## Deploy

Vercel, from `main`. Preview deploys on every push.

## Project phases

See `docs/PROTOTYPE_SPEC.md`. Gallery / art commerce lands near the end (Phase 3).
