// Builds the slim, English-only data files the app uses from the full
// plataformafitness/exercises-library dataset (17 MB -> ~1 MB).
//
// Usage: node scripts/build-data.mjs [path-to-cloned-library]
// Default library path: .cache/exercises-library (created by `npm run setup:media`)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const libDir = resolve(process.argv[2] ?? process.env.LIB_DIR ?? resolve(here, "../.cache/exercises-library"));
const outDir = resolve(here, "../src/data");

const raw = JSON.parse(readFileSync(resolve(libDir, "data/exercises.json"), "utf8"));
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

function stepsFor(e) {
  const fromSteps = (e.instruction_steps?.en ?? []).map(clean).filter(Boolean);
  if (fromSteps.length) return fromSteps;
  return clean(e.instructions?.en)
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter(Boolean);
}

const full = raw.map((e) => ({
  id: String(e.id),
  name: clean(e.name),
  bodyPart: clean(e.body_part ?? e.category),
  equipment: clean(e.equipment),
  target: clean(e.target),
  secondary: (e.secondary_muscles ?? []).map(clean).filter(Boolean),
  steps: stepsFor(e),
  image: e.image,
  gif: e.gif_url,
}));

const index = full.map(({ id, name, bodyPart, equipment, target, image }) => ({
  id,
  name,
  bodyPart,
  equipment,
  target,
  image,
}));

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "exercises.json"), JSON.stringify(full));
writeFileSync(resolve(outDir, "exercises-index.json"), JSON.stringify(index));
console.log(`Wrote ${full.length} exercises to ${outDir}`);
