import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";
import {
  playgroundNodeName,
  retiredPlaygroundCollisions,
  retiredPlaygroundMeshes,
} from "../../experiments/saksham-driving-world/src/javascript/World/ScenicRouteLayout.js";
import { pruneStaticGlb } from "./prune-crossroads.mjs";

const at = (path) => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const [name, budget, quantized] of [
  ["scenic-kit", 512000, true],
  ["skate-deck", 180000, false],
]) {
  const input = at(`.local-history/blender-models/${name}.raw.glb`);
  const output = at(
    `experiments/saksham-driving-world/static/saksham/models/${name === "skate-deck" ? "ramp-deck" : name}.glb`,
  );
  const document = await io.read(input);
  await document.transform(dedup(), weld(), prune());
  if (quantized)
    await document.transform(
      quantize({ quantizePosition: 16, quantizeNormal: 12, quantizeColor: 8 }),
    );
  await io.write(output, document);
  const bytes = (await stat(output)).size;
  if (bytes > budget) throw new Error(`${name} exceeds its transfer budget`);
  console.log(`${name}: ${(await stat(input)).size} -> ${bytes} bytes`);
}
// Drop the retired source meshes/proxies too, including their binary payloads.
for (const [name, retired] of [
  ["base", retiredPlaygroundMeshes],
  ["collision", retiredPlaygroundCollisions],
]) {
  const target = at(
    `experiments/saksham-driving-world/static/models/playground/static/${name}.glb`,
  );
  const before = await readFile(target);
  const json = JSON.parse(
    before.subarray(20, 20 + before.readUInt32LE(12)).toString(),
  );
  const kept = json.nodes
    .filter((n) => !retired.has(playgroundNodeName(n.name || "")))
    .map((n) => playgroundNodeName(n.name || ""));
  const after = pruneStaticGlb(before, kept);
  await writeFile(target, after);
  console.log(`Playground ${name}: ${before.length} -> ${after.length} bytes`);
}
