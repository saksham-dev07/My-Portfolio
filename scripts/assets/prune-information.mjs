import { readFile, writeFile } from "node:fs/promises";
import {
  informationNodeName,
  retiredInformationCollisions,
  retiredInformationMeshes,
} from "../../experiments/saksham-driving-world/src/javascript/World/InformationLayout.js";
import { pruneStaticGlb } from "./prune-crossroads.mjs";

for (const [file, retired] of [
  ["base", retiredInformationMeshes],
  ["collision", retiredInformationCollisions],
]) {
  const target = new URL(
    `../../experiments/saksham-driving-world/static/models/information/static/${file}.glb`,
    import.meta.url,
  );
  const before = await readFile(target);
  const jsonLength = before.readUInt32LE(12);
  const document = JSON.parse(before.subarray(20, 20 + jsonLength).toString());
  const retained = document.nodes
    .filter((node) => !retired.has(informationNodeName(node.name ?? "")))
    .map((node) => informationNodeName(node.name ?? ""));
  const after = pruneStaticGlb(before, retained);
  await writeFile(target, after);
  console.log(
    `Information ${file}: ${before.length} -> ${after.length} bytes.`,
  );
}
