# IronLog — gym app (Next.js + TypeScript)

Browse **1,324 exercises** with animated demos, numbered step-by-step instructions and suggested
sets / reps / time. Build a workout and follow it with automatic **set and rest timers**.
No login — your workout is saved in the browser (`localStorage`).

Exercise data and media come from
[plataformafitness/exercises-library](https://github.com/plataformafitness/exercises-library).

## Run it

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

That's all — exercise GIFs load straight from the GitHub repo.

### Optional: serve the GIFs locally (faster, works offline)

```bash
npm run setup:media                      # clones the library, copies ~140 MB into public/media
echo "NEXT_PUBLIC_MEDIA_BASE=/media" > .env.local
npm run dev
```

## What's in the app

| Page | What it does |
| --- | --- |
| `/` | Quick-start presets (full body, push, pull, legs, core, cardio) and body-part tiles |
| `/exercises` | Search + filter by body part, equipment, target muscle. Deep-linkable: `/exercises?bodyPart=chest` |
| `/exercises/[id]` | Animation, target and secondary muscles, **suggested sets × reps / time**, numbered steps, stopwatch + rest timer, similar exercises |
| `/workout` | Your workout: edit sets, reps (or seconds for timed moves) and rest, reorder, remove, see total time |
| `/workout/play` | The player: one exercise at a time with its animation and steps, automatic rest countdown with 3-2-1 beeps, +15 s / skip rest, pause, skip / back, summary at the end. Keeps the screen awake. |

## How it's built

```
src/
  app/                 pages + two small API routes
    api/exercises          GET ?ids=0001,0025  -> full exercise records
    api/workouts/generate  GET ?preset=push&seed=1 -> a generated workout
  components/          UI (client components where state/timers are needed)
  lib/                 plain TypeScript, no React — easy to test
    search.ts            filtering + facets
    prescription.ts      sets/reps/time defaults and duration estimates
    workouts.ts          presets + seeded random workout generator
    player.ts            the workout player as a pure state machine
    workoutStorage.ts    validation of saved workouts
  data/                English-only slice of the library (0.9 MB; the original is 17 MB)
scripts/
  build-data.mjs       regenerates src/data from a clone of the library
  setup-media.mjs      optional local copy of GIFs/thumbnails
```

To refresh the data from the library: `npm run setup:media` (clones it into `.cache/`) then
`npm run build:data`.

## Notes

- **Media license.** The GIFs/images are © [Gym visual](https://gymvisual.com/), redistributed in the
  library under separate permission (180×180 only, attribution required — the footer keeps it).
  Read their [terms](https://gymvisual.com/content/3-terms-and-conditions-of-use) and get your own
  license before shipping the app publicly. The code and instruction text are MIT.
- **Hotlinking.** The default media URL points at `raw.githubusercontent.com`, which is fine for
  development but not for production — use `setup:media` and host the files yourself.
- **Time estimates** assume 4 s per rep and 20 s between exercises (`src/lib/prescription.ts`).
- **Next steps if you want them:** accounts + saving workouts to a database, workout history /
  progress charts, more languages (the library has instructions in 10).
