import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The client build and the server build can hash the same stylesheet differently.
// Netlify then publishes only the client file, while the HTML points at the
// server hash, which 404s. Copy the real file onto every name the build mentions.
const assetsDir = join(process.cwd(), "dist/assets");
if (!existsSync(assetsDir)) {
  console.log("[css] no dist/assets — nothing to sync.");
  process.exit(0);
}

const files = readdirSync(assetsDir).filter((name) => /^styles-.*\.css$/.test(name));
if (files.length === 0) {
  console.log("[css] no stylesheet in dist/assets.");
  process.exit(0);
}

const canonical = files.sort((a, b) => statSync(join(assetsDir, b)).size - statSync(join(assetsDir, a)).size)[0];
const mentioned = new Set(files);

function walk(dir) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(m?js|html|json|css)$/.test(entry.name)) continue;
    if (statSync(path).size > 8_000_000) continue;
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(/styles-[A-Za-z0-9_-]+\.css/g)) mentioned.add(match[0]);
  }
}

for (const root of [".netlify", ".vercel", ".output", "dist"]) {
  if (existsSync(root)) walk(root);
}

for (const name of mentioned) {
  if (name === canonical) continue;
  const target = join(assetsDir, name);
  if (!existsSync(target)) {
    copyFileSync(join(assetsDir, canonical), target);
    console.log(`[css] ${canonical} also published as ${name}`);
  }
}
