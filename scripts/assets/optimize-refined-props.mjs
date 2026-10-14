import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";

const input = fileURLToPath(
  new URL(
    "../../.local-history/blender-models/refined-props.raw.glb",
    import.meta.url,
  ),
);
const output = fileURLToPath(
  new URL(
    "../../experiments/saksham-driving-world/static/saksham/models/refined-props.glb",
    import.meta.url,
  ),
);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(input);
await document.transform(
  dedup(),
  weld(),
  prune(),
  quantize({ quantizePosition: 16, quantizeNormal: 12, quantizeColor: 8 }),
);
await io.write(output, document);
const bytes = (await stat(output)).size;
if (bytes > 512_000)
  throw new Error("Refined prop kit exceeds its shipping budget");
console.log(
  `Refined kit: ${(await stat(input)).size} -> ${bytes} bytes; 11 texture-free Blender designs.`,
);
