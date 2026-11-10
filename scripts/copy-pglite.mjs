import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Nitro puts the externalized PGLite bundle in `_libs`, and the wasm runtime
// then opens `pglite.data` next to that file (`/var/task/_libs/pglite.data`).
// The JS is copied; the data and wasm files are not. Put them there.
const names = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const sourceDir = join(process.cwd(), "node_modules/@electric-sql/pglite/dist");
const roots = [".vercel", ".netlify", ".output", "dist"].filter((dir) => existsSync(dir));

function findLibs(dir, found) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name === "_libs") found.add(path);
    else findLibs(path, found);
  }
}

const targets = new Set();
for (const root of roots) findLibs(root, targets);

if (targets.size === 0) {
  console.log("[pglite] no _libs directory in the build output — nothing to copy.");
} else {
  for (const dir of targets) {
    for (const name of names) cpSync(join(sourceDir, name), join(dir, name));
    console.log(`[pglite] copied data files to ${dir}`);
  }
}
