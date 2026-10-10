import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, draco, getBounds, prune } from "@gltf-transform/functions";
import draco3d from "draco3d";
import sharp from "sharp";

// Authoring copies stay local. Shipping copies keep every triangle and the
// original texture dimensions; no mesh simplification or lossy image encoding.
const root = fileURLToPath(new URL("../../", import.meta.url));
const world = join(root, "experiments/saksham-driving-world");
const input =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ||
  join(root, ".local-history/landmark-sources");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const output = join(world, "static/saksham/models/optimized");
await mkdir(input, { recursive: true });
await mkdir(output, { recursive: true });
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });
const manifestPath = join(
  world,
  "src/javascript/World/Sections/landmark-assets.json",
);
const manifest = only ? JSON.parse(await readFile(manifestPath, "utf8")) : {};
for (const [id, filename] of [
  ["avatar", "saksham-face.glb"],
  ["campus", "vit-bhopal.glb"],
  ["skills", "skills-pc.glb"],
  ["flag", "flag-india.glb"],
]) {
  if (only && id !== only) continue;
  const sourcePath = join(input, filename);
  try {
    await readFile(sourcePath);
  } catch {
    await copyFile(join(world, "static/saksham/models", filename), sourcePath);
  }
  const source = await readFile(sourcePath);
  const document = await io.read(sourcePath);
  const bounds = getBounds(document.getRoot().listScenes()[0]);
  const originalTriangles = document
    .getRoot()
    .listMeshes()
    .reduce(
      (sum, mesh) =>
        sum +
        mesh
          .listPrimitives()
          .reduce((count, p) => count + p.getIndices().getCount() / 3, 0),
      0,
    );
  const textureMetrics = new Map();
  for (const texture of document.getRoot().listTextures()) {
    const bytes = Buffer.from(texture.getImage());
    const pixels = await sharp(bytes).ensureAlpha().raw().toBuffer();
    const pixelHash = createHash("sha256").update(pixels).digest("hex");
    const metadata = await sharp(bytes).metadata();
    const candidate = await sharp(bytes)
      .webp({ lossless: true, effort: 6 })
      .toBuffer();
    // A lossless WebP of an existing JPEG can be larger. Keep the original in
    // that case; compression must reduce transfer without altering its pixels.
    const useWebP = candidate.length < bytes.length;
    if (useWebP) {
      document.createExtension(EXTTextureWebP).setRequired(true);
      texture.setImage(candidate).setMimeType("image/webp");
    }
    textureMetrics.set(texture, {
      width: metadata.width,
      height: metadata.height,
      originalBytes: bytes.length,
      bytes: useWebP ? candidate.length : bytes.length,
      format: useWebP ? "image/webp" : texture.getMimeType(),
      pixelHash,
    });
  }
  await document.transform(
    dedup(),
    prune(),
    draco({
      method: "edgebreaker",
      encodeSpeed: 5,
      decodeSpeed: 7,
      quantizePosition: 16,
      quantizeNormal: 12,
      quantizeTexcoord: 16,
    }),
  );
  const bytes = await io.writeBinary(document);
  const textures = document
    .getRoot()
    .listTextures()
    .map((texture) => textureMetrics.get(texture));
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const name = filename.replace(".glb", `-${hash}.glb`);
  await writeFile(join(output, name), bytes);
  manifest[id] = {
    url: `./saksham/models/optimized/${name}`,
    bytes: bytes.length,
    originalBytes: source.length,
    triangles: originalTriangles,
    bounds,
    textures,
  };
  console.log(
    `${id}: ${source.length.toLocaleString()} -> ${bytes.length.toLocaleString()} bytes; ${originalTriangles.toLocaleString()} triangles retained`,
  );
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
