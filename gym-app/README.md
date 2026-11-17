# IronLog: gym app (Next.js + TypeScript)

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

## Design

- **Plate colours.** Every muscle group wears the colour of a weight plate (chest red, back blue,
  shoulders yellow, and so on, defined in `src/lib/plates.ts`). The same marker appears in filters,
  exercise tiles, the workout summary and the player, so you can tell what you're training at a glance.
- **Plate ring timer.** In the player, sets and rests are drawn as a weight plate that unwinds.
  Rep-based exercises show one arc per set instead.
- **Two moods.** A light "gym floor" interface for browsing and planning, and a dark focus mode for the
  workout player so it stays readable under gym lighting. The player takes the whole screen.
- **Type.** Archivo for text and Archivo Narrow for headlines and big numbers (loaded with `next/font`,
  so the first build needs internet access).
- Plain CSS with design tokens at the top of `src/app/globals.css`. No CSS framework to configure.

## How it's built

```
src/
  app/                 pages + two small API routes
    api/exercises          GET ?ids=0001,0025  -> full exercise records
    api/workouts/generate  GET ?preset=push&seed=1 -> a generated workout
  components/          UI (client components where state/timers are needed)
    PlayerView.tsx       everything the workout player shows, as a pure function of its state
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

## Accounts and admin

The app now has sign-in, a shop, memberships and an admin panel. Browsing exercises and building a workout
still work without an account.

```
Next.js app (this folder)  --Firebase ID token-->  Express API (server/)  -->  MongoDB
        |                                                  |
   Firebase Auth (sign-in)                      verifies the token with firebase-admin
```

- **Firebase** only handles who you are (email + password, Google). **MongoDB** stores everything else:
  profiles and roles, saved workouts, products, plans, orders, custom exercises.
- **Roles:** `user` and `admin`. The role lives in MongoDB and is checked on the server for every `/api/admin/*` call;
  the admin screens in the browser are only a convenience.
- **First admin:** put your email in `ADMIN_EMAILS` (server/.env). When you sign in with that email and it is
  *verified* (Google does this automatically; for email + password click the link Firebase emails you, then
  "I verified it" on the Account page) you become admin. After that, promote others in Admin > Users.

### 1. Firebase (5 minutes)
1. Create a project at https://console.firebase.google.com
2. Build > Authentication > Get started > enable **Email/Password** and **Google**.
3. Project settings > General > Your apps > add a **Web app**; copy its config into `.env.local` in this folder
   (see `.env.example`: `NEXT_PUBLIC_FIREBASE_*`).
4. Project settings > Service accounts > **Generate new private key**. Save the file as
   `server/serviceAccountKey.json` (it is git-ignored. Never commit it).

### 2. MongoDB
Install MongoDB locally, or create a free cluster on MongoDB Atlas and use its connection string.

### 3. Run the API
```bash
cd server
cp .env.example .env      # edit MONGODB_URI, ADMIN_EMAILS
npm install
npm run seed              # optional: sample plans and products
npm run dev               # http://localhost:4000
```

### 4. Run the site (second terminal, in the project root)
```bash
cp .env.example .env.local    # add the Firebase web keys
npm install
npm run dev
```

### What each role can do
| | Visitor | User | Admin |
| --- | :-: | :-: | :-: |
| Browse exercises, build and play workouts | yes | yes | yes |
| Workout saved to the account (syncs devices) | | yes | yes |
| Shop, cart, orders, cancel a pending order | browse only | yes | yes |
| Buy a membership | | yes | yes |
| Users: change role, disable, delete | | | yes |
| Products: add, edit, stock, hide, delete | | | yes |
| Plans: add, edit, delete | | | yes |
| Orders: see all, move pending > paid > shipped > completed, cancel | | | yes |
| Exercises: add custom ones, hide library ones | | | yes |
| Dashboard: users, revenue, orders by status, low stock | | | yes |

### Notes
- Checkout is a **demo**: no payment provider is connected. Stock is reduced atomically when an order is placed
  and restored if the order is cancelled.
- Money is stored in cents. Orders keep a snapshot of name and price, so editing a product later does not change history.
- Custom exercises can be viewed but not yet added to a workout (the workout player reads the bundled library).
- Disabling a user also disables them in Firebase; deleting removes both records.


## Gym website features

The site now works like a real gym's website plus a member app.

| Area | Pages | What it does |
| --- | --- | --- |
| Public website | `/`, `/classes`, `/trainers`, `/membership` (pricing), `/shop`, `/contact` | Landing page with live class preview, pricing, coaches, FAQ, free-trial enquiry form |
| Class booking | `/classes`, `/bookings` | Weekly timetable with spots left. Members book and cancel (up to 2 hours before). Needs an active membership on the class day. Seats are taken atomically, so a full class cannot be overbooked |
| Check-in | `/checkin`, `/admin/desk` | Each member has a 6-character code. Staff enter it (or search the member) at the front desk. Expired memberships are refused unless staff override. Visits, monthly count and week streak show in the app |
| Progress | `/progress` | Log weight, body fat and measurements with a chart, plus workouts finished in the player (counted per week) |
| Admin | `/admin/...` | Dashboard, front desk, classes (with weekly repeat and roster/attendance), trainers, users, products, plans, orders, exercises, enquiries |

- Edit the gym name, address, opening hours and FAQ in `src/lib/gym.ts`.
- `npm run seed` in `server/` adds sample trainers, a two-week timetable, plans and products.
- The member area is now at `/train` (muscle groups and today's sessions); `/` is the public landing page.
- Class times are stored in UTC and shown in each visitor's own time zone. "Repeat weekly" adds 7 days each time, so it can shift by an hour across a daylight-saving change.
- Not included yet: online payments, email/SMS reminders, waitlists, QR-scan check-in. The check-in code can later be turned into a QR code.
