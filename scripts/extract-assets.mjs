// Builds transparent product cutouts from images extracted with `pdfimages -png` (image + soft mask pairs).
import sharp from "sharp";
import path from "node:path";

const src = process.argv[2]; // folder with img-XXX.png
const out = "public/products";
const pad = (n) => String(n).padStart(3, "0");
const map = {
  "frappe-cafe": 0, "milkshake-vanille": 2, "milkshake-chocolat": 4, "frappe-neutre": 6,
  "concentre-peche": 8, "concentre-framboise": 10, "sirop-caramel": 12, "sirop-vanille": 14,
  "sirop-noisette": 16, "puree-fruits-des-bois": 18,
  "creme-chicoree-light": 28, "creme-chicoree": 30, "cacao-poudre": 32, "chocolat-chaud": 34, "frazita": 36,
};
for (const [slug, i] of Object.entries(map)) {
  const img = path.join(src, `img-${pad(i)}.png`);
  const mask = await sharp(path.join(src, `img-${pad(i + 1)}.png`)).greyscale().raw().toBuffer();
  const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    rgba[p * 4] = data[p * 3]; rgba[p * 4 + 1] = data[p * 3 + 1]; rgba[p * 4 + 2] = data[p * 3 + 2]; rgba[p * 4 + 3] = mask[p];
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 5 }).resize({ height: 1000, width: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88 }).toFile(path.join(out, `${slug}.webp`));
  console.log("ok", slug);
}
// Brand pattern (page 11)
await sharp(path.join(src, "img-020.png")).resize(1200).webp({ quality: 80 }).toFile("public/brand/pattern.webp");
