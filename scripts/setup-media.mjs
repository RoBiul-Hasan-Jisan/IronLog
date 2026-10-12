// Optional: download the exercise GIFs/thumbnails once so the app serves them
// locally instead of loading them from GitHub.
//
//   npm run setup:media
//   then set NEXT_PUBLIC_MEDIA_BASE=/media in .env.local and restart `npm run dev`
//
// Needs `git`. Clones the library (shallow) into .cache/ and copies the media
// into public/media/{images,videos}. Media is © Gym visual — keep the attribution.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const cache = resolve(root, ".cache/exercises-library");

if (!existsSync(cache)) {
  mkdirSync(dirname(cache), { recursive: true });
  console.log("Cloning plataformafitness/exercises-library (shallow)…");
  execFileSync(
    "git",
    ["clone", "--depth", "1", "https://github.com/plataformafitness/exercises-library.git", cache],
    { stdio: "inherit" },
  );
}

for (const dir of ["images", "videos"]) {
  const dest = resolve(root, "public/media", dir);
  mkdirSync(dest, { recursive: true });
  cpSync(resolve(cache, dir), dest, { recursive: true });
  console.log(`Copied ${dir}/ -> public/media/${dir}/`);
}

console.log("\nDone. Add this line to .env.local and restart the dev server:\n  NEXT_PUBLIC_MEDIA_BASE=/media");
