# Blind Eye Land — Character Asset Map (internal)

Source of truth for original character artwork. **Do not rename, overwrite, regenerate,
stylize, or alter these files.** Derivatives for web use get separate filenames.

All files live in `public/art/paintings/`. All are fully opaque (no alpha transparency —
square-ish portraits with painted backgrounds), so presentation should use the
vignette/encounter approach, not cutout compositing.

| File | Character | Dimensions | Mode | URL |
|---|---|---|---|---|
| `alma.png` | Alma | 852×856 | RGBA (opaque) | `/art/paintings/alma.png` |
| `alvin_dupe.png` | Alvin Dupe (surname spelling not fully locked; prototype used “Alvin Dupé”) | 855×856 | RGBA (opaque) | `/art/paintings/alvin_dupe.png` |
| `anna_d'konda.png` | Anna d'Konda | 858×857 | RGBA (opaque) | `/art/paintings/anna_d%27konda.png` |
| `hollywood.png` | Hollywood | 850×856 | RGBA (opaque) | `/art/paintings/hollywood.png` |
| `horace_hand.png` | Horace Hand | 856×856 | RGBA (opaque) | `/art/paintings/horace_hand.png` |
| `ida_noe.png` | Ida Noe (pronounced “I dunno”; never “Ida Know”) | 683×858 | RGBA (opaque) | `/art/paintings/ida_noe.png` |
| `judge_fairly.png` | Judge Fairly | 576×898 | RGBA (opaque) | `/art/paintings/judge_fairly.png` |
| `lewis_ledbetter.png` | Lewis Ledbetter | 858×860 | RGBA (opaque) | `/art/paintings/lewis_ledbetter.png` |
| `blind_eye_hero.png` | — (hero/title art, not a resident) | 1024×1024 | RGB | `/art/paintings/blind_eye_hero.png` |
| `blind_eye_land.png` | — (map art, not a resident) | 1597×906 | RGBA (opaque) | `/art/paintings/blind_eye_land.png` |

Notes:
- Drumstick has no dedicated file; per project memory, the Alma painting is used where appropriate.
- `anna_d'konda.png` contains an apostrophe — URL-encode as `anna_d%27konda.png`.
- Character presence/state is tracked in `lib/characters.ts`, not by filename conventions.
