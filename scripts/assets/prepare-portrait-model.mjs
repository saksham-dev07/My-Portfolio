import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MeshoptSimplifier } from "meshoptimizer";

// Prepare this supplied, static, single-mesh GLB. The original stays untouched.
const [input, output = "src/assets/models/saksham-model.glb", sharpPath] =
  process.argv.slice(2);
if (!input)
  throw new Error(
    "Pass the source GLB path, output path, and optional Sharp module path.",
  );
if (resolve(input).toLowerCase() === resolve(output).toLowerCase())
  throw new Error(
    "Choose a separate output file to preserve the original model.",
  );
const { default: sharp } = await import(
  sharpPath ? pathToFileURL(resolve(sharpPath)).href : "sharp"
);
const source = await readFile(input);
if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2)
  throw new Error("Expected a GLB 2.0 file.");
const jsonLength = source.readUInt32LE(12);
const json = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const binaryStart = 28 + jsonLength;
if (
  json.meshes.length !== 1 ||
  json.meshes[0].primitives.length !== 1 ||
  json.animations?.length ||
  json.skins?.length
)
  throw new Error("This preparation script expects one static mesh.");
const primitive = json.meshes[0].primitives[0];
if (primitive.targets || (primitive.mode ?? 4) !== 4)
  throw new Error("Expected a triangle mesh without morph targets.");
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function readAccessor(index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const width = components[accessor.type];
  if (
    !width ||
    accessor.sparse ||
    accessor.normalized ||
    ![5126, 5125, 5123].includes(accessor.componentType)
  )
    throw new Error("Unsupported accessor encoding.");
  const size = accessor.componentType === 5123 ? 2 : 4;
  const data = new DataView(source.buffer, source.byteOffset);
  const offset =
    binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const values =
    accessor.componentType === 5126
      ? new Float32Array(accessor.count * width)
      : new Uint32Array(accessor.count * width);
  for (let vertex = 0; vertex < accessor.count; vertex++)
    for (let axis = 0; axis < width; axis++) {
      const at =
        offset + vertex * (view.byteStride ?? width * size) + axis * size;
      values[vertex * width + axis] =
        accessor.componentType === 5126
          ? data.getFloat32(at, true)
          : size === 2
            ? data.getUint16(at, true)
            : data.getUint32(at, true);
    }
  return { accessor, width, values };
}
const attributes = Object.fromEntries(
  Object.entries(primitive.attributes).map(([name, index]) => [
    name,
    readAccessor(index),
  ]),
);
const indices = readAccessor(primitive.indices).values;
const positions = attributes.POSITION.values;
const count = attributes.POSITION.accessor.count;
const attributeData = new Float32Array(count * 5);
for (let vertex = 0; vertex < count; vertex++) {
  attributeData.set(
    attributes.NORMAL.values.subarray(vertex * 3, vertex * 3 + 3),
    vertex * 5,
  );
  attributeData.set(
    attributes.TEXCOORD_0.values.subarray(vertex * 2, vertex * 2 + 2),
    vertex * 5 + 3,
  );
}
await MeshoptSimplifier.ready;
const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(
  indices,
  positions,
  3,
  attributeData,
  5,
  [1, 1, 1, 1, 1],
  null,
  240000,
  0.001,
);
const originalTriangles = indices.length / 3;
const remap = new Map();
const compactIndices = new Uint32Array(simplified.length);
for (let index = 0; index < simplified.length; index++) {
  const old = simplified[index];
  if (!remap.has(old)) remap.set(old, remap.size);
  compactIndices[index] = remap.get(old);
}
const originalViews = json.bufferViews;
json.bufferViews = [];
json.accessors = [];
const chunks = [];
let binaryLength = 0;
function addView(bytes, target) {
  const padding = (4 - (binaryLength % 4)) % 4;
  if (padding) {
    chunks.push(Buffer.alloc(padding));
    binaryLength += padding;
  }
  const view = {
    buffer: 0,
    byteOffset: binaryLength,
    byteLength: bytes.length,
  };
  if (target) view.target = target;
  json.bufferViews.push(view);
  chunks.push(bytes);
  binaryLength += bytes.length;
  return json.bufferViews.length - 1;
}
primitive.attributes = {};
for (const [name, { accessor, width, values }] of Object.entries(attributes)) {
  const compact = new Float32Array(remap.size * width);
  for (const [old, next] of remap)
    compact.set(
      values.subarray(old * width, old * width + width),
      next * width,
    );
  const prepared = {
    bufferView: addView(Buffer.from(compact.buffer), 34962),
    componentType: 5126,
    count: remap.size,
    type: accessor.type,
  };
  if (name === "POSITION") {
    prepared.min = Array(width).fill(Infinity);
    prepared.max = Array(width).fill(-Infinity);
    for (let index = 0; index < compact.length; index++) {
      const axis = index % width;
      prepared.min[axis] = Math.min(prepared.min[axis], compact[index]);
      prepared.max[axis] = Math.max(prepared.max[axis], compact[index]);
    }
  }
  primitive.attributes[name] = json.accessors.length;
  json.accessors.push(prepared);
}
primitive.indices = json.accessors.length;
json.accessors.push({
  bufferView: addView(Buffer.from(compactIndices.buffer), 34963),
  componentType: 5125,
  count: compactIndices.length,
  type: "SCALAR",
});
const textureStats = [];
for (const image of json.images) {
  if (image.uri) throw new Error("External textures are not supported.");
  const view = originalViews[image.bufferView];
  const bytes = source.subarray(
    binaryStart + view.byteOffset,
    binaryStart + view.byteOffset + view.byteLength,
  );
  const meta = await sharp(bytes).metadata();
  const encoded = await sharp(bytes)
    .resize({
      width: 2048,
      height: 2048,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha()
    .jpeg({
      quality: image.name?.includes("normal") ? 94 : 91,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();
  textureStats.push({
    name: image.name,
    originalSize: [meta.width, meta.height],
    sourceBytes: bytes.length,
    outputBytes: encoded.length,
  });
  image.bufferView = addView(encoded);
  image.mimeType = "image/jpeg";
}
const finalPadding = (4 - (binaryLength % 4)) % 4;
if (finalPadding) {
  chunks.push(Buffer.alloc(finalPadding));
  binaryLength += finalPadding;
}
json.buffers = [{ byteLength: binaryLength }];
json.asset.extras = {
  ...json.asset.extras,
  portfolioOptimization: {
    originalTriangles,
    triangles: simplified.length / 3,
    normalizedError: error,
    maxTextureSize: 2048,
  },
};
const rawJson = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(Math.ceil(rawJson.length / 4) * 4, 0x20);
rawJson.copy(paddedJson);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + binaryLength, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(binaryLength, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, paddedJson, binaryHeader, ...chunks]);
await writeFile(output, result);
console.log(
  JSON.stringify(
    {
      inputBytes: source.length,
      outputBytes: result.length,
      originalTriangles,
      triangles: simplified.length / 3,
      vertices: remap.size,
      normalizedError: error,
      textures: textureStats,
    },
    null,
    2,
  ),
);
