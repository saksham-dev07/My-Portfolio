import { copyFile, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const directory = new URL(
  "../../experiments/saksham-driving-world/static/favicon/",
  import.meta.url,
);
const logo = await readFile(new URL("../../public/logo.svg", import.meta.url));
const icon = await sharp(logo).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icon.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(
  new URL("favicon.ico", directory),
  Buffer.concat([header, icon]),
);
await writeFile(new URL("safari-pinned-tab.svg", directory), logo);
for (const [name, size] of [
  ["android-chrome-192x192.png", 192],
  ["android-chrome-256x256.png", 256],
  ["apple-touch-icon.png", 180],
  ["mstile-150x150.png", 150],
  ["favicon-32x32.png", 32],
  ["favicon-16x16.png", 16],
]) {
  await writeFile(
    new URL(name, directory),
    await sharp(logo)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );
}
await writeFile(
  new URL("site.webmanifest", directory),
  `${JSON.stringify(
    {
      name: "Saksham Agarwal | The Driving World",
      short_name: "Saksham",
      icons: [192, 256].map((size) => ({
        src: `./android-chrome-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
      theme_color: "#16192b",
      background_color: "#16192b",
      display: "standalone",
    },
    null,
    2,
  )}\n`,
);
// Keep the legacy source icon set consistent with the publicly served set.
const source = new URL(
  "../../experiments/saksham-driving-world/src/favicon/",
  import.meta.url,
);
for (const name of [
  "favicon.ico",
  "safari-pinned-tab.svg",
  "site.webmanifest",
  "browserconfig.xml",
  "android-chrome-192x192.png",
  "android-chrome-256x256.png",
  "apple-touch-icon.png",
  "mstile-150x150.png",
  "favicon-32x32.png",
  "favicon-16x16.png",
]) {
  await copyFile(new URL(name, directory), new URL(name, source));
}
