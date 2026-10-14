import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";

const input = new URL(
  "../../.local-history/blender-models/meadow-environment.raw.glb",
  import.meta.url,
);
const output = new URL(
  "../../experiments/saksham-driving-world/static/saksham/models/environment-refresh.glb",
  import.meta.url,
);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(fileURLToPath(input));
for (const mesh of document.getRoot().listMeshes()) {
  let count = 0;
  for (const primitive of mesh.listPrimitives())
    count +=
      (primitive.getIndices()?.getCount() ||
        primitive.getAttribute("POSITION").getCount()) / 3;
  if (count > 500) throw new Error(`${mesh.getName()} exceeds 500 triangles`);
}
await document.transform(
  dedup(),
  weld(),
  prune(),
  quantize({ quantizePosition: 16, quantizeNormal: 12, quantizeColor: 8 }),
);
await io.write(fileURLToPath(output), document);
const bytes = (await stat(output)).size;
if (bytes > 200000) throw new Error("Environment kit exceeds 200 KB");
console.log(`New environment kit: ${bytes} bytes; shared palette, no images.`);
