// Genera las variantes responsivas de cada imagen de media/ dentro de public/media/
// y escribe src/data/media-manifest.json (dimensiones, anchos disponibles y color dominante).
//
// El sitio se exporta como HTML estático, así que no existe el optimizador de imágenes
// de Next en tiempo de ejecución: las variantes AVIF/WebP se generan aquí una sola vez
// y se versionan junto con el código. Es incremental: solo procesa lo que falta.
//
//   media/nike/02.jpg  →  public/media/nike/02-640.avif, 02-640.webp, …, 02.jpg (respaldo)

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "media");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "src", "data", "media-manifest.json");

const WIDTHS = [640, 1080, 1600, 2400];
const FALLBACK_WIDTH = 1600;
const force = process.argv.includes("--force");

const exists = (p) => fs.access(p).then(() => true, () => false);
const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

async function isStale(src, out) {
  if (force || !(await exists(out))) return true;
  const [a, b] = await Promise.all([fs.stat(src), fs.stat(out)]);
  return a.mtimeMs > b.mtimeMs;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : /\.(jpe?g|png|webp|tiff?)$/i.test(e.name) ? [p] : [];
    }),
  );
  return files.flat().sort();
}

const manifest = {};
let generated = 0;

for (const file of await walk(SRC)) {
  const rel = path.relative(SRC, file);
  const key = rel.replace(/\.[^.]+$/, "").split(path.sep).join("/");
  const outBase = path.join(OUT, key);
  await fs.mkdir(path.dirname(outBase), { recursive: true });

  const image = sharp(file).rotate(); // respeta la orientación EXIF
  const meta = await image.metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  // Nunca se amplía: anchos menores al original más el ancho original (con tope).
  const maxWidth = Math.min(width, WIDTHS.at(-1));
  const widths = [...WIDTHS.filter((w) => w < maxWidth), maxWidth];

  for (const w of widths) {
    for (const [ext, encode] of [
      ["avif", (s) => s.avif({ quality: 55, effort: 5 })],
      ["webp", (s) => s.webp({ quality: 76, effort: 5 })],
    ]) {
      const out = `${outBase}-${w}.${ext}`;
      if (await isStale(file, out)) {
        await encode(image.clone().resize({ width: w })).toFile(out);
        generated++;
      }
    }
  }

  const fallback = `${outBase}.jpg`;
  if (await isStale(file, fallback)) {
    await image
      .clone()
      .resize({ width: Math.min(width, FALLBACK_WIDTH) })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(fallback);
    generated++;
  }

  const { dominant } = await image.clone().resize(64).stats();
  manifest[key] = { width, height, widths, color: hex(dominant) };
  process.stdout.write(`· ${key}\n`);
}

await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${Object.keys(manifest).length} imágenes, ${generated} archivos generados.`);
