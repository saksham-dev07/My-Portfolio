import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { retainedHubNodes } from "../../experiments/saksham-driving-world/src/javascript/World/HubLayout.js";

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const sanitize = (name) => name.replace(/\s/g, "_").replace(/[[\].:/]/g, "");

function parseGlb(input) {
  const bytes = Buffer.from(input);
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2)
    throw new Error("Expected GLB 2.0.");
  if (bytes.readUInt32LE(8) !== bytes.length)
    throw new Error("GLB length does not match its header.");
  let json;
  let binary;
  for (let at = 12; at < bytes.length; ) {
    const length = bytes.readUInt32LE(at);
    const type = bytes.readUInt32LE(at + 4);
    const chunk = bytes.subarray(at + 8, at + 8 + length);
    if (chunk.length !== length) throw new Error("Truncated GLB chunk.");
    if (type === JSON_CHUNK) json = JSON.parse(chunk.toString());
    else if (type === BIN_CHUNK) binary = chunk;
    else throw new Error("Unexpected GLB chunk type.");
    at += length + 8;
  }
  if (!json || !binary || json.buffers.length !== 1 || json.buffers[0].uri)
    throw new Error("Expected one embedded geometry buffer.");
  return { json, binary };
}

// Repack dependencies, including Draco buffer views, rather than merely hiding
// scene nodes and continuing to download the discarded sculpture geometry.
export function pruneStaticGlb(input, retainedNodes) {
  const { json: source, binary } = parseGlb(input);
  if (source.animations?.length || source.skins?.length)
    throw new Error("Pruning expects an unanimated static scene.");
  const output = structuredClone(source);
  const maps = Object.fromEntries(
    [
      "nodes",
      "meshes",
      "accessors",
      "bufferViews",
      "materials",
      "textures",
      "images",
      "samplers",
      "cameras",
    ].map((key) => [key, new Map()]),
  );
  const chunks = [];
  let binaryLength = 0;
  for (const key of Object.keys(maps)) output[key] = [];

  const copy = (key, index, modify = (item) => item) => {
    if (maps[key].has(index)) return maps[key].get(index);
    const newIndex = output[key].length;
    maps[key].set(index, newIndex);
    output[key].push(null);
    output[key][newIndex] = modify(structuredClone(source[key][index]));
    return newIndex;
  };
  const copyView = (index) =>
    copy("bufferViews", index, (view) => {
      if (view.buffer !== 0) throw new Error("Unexpected external buffer.");
      const at = view.byteOffset ?? 0;
      if (at + view.byteLength > binary.length)
        throw new Error("Buffer view exceeds the binary chunk.");
      const padding = (4 - (binaryLength % 4)) % 4;
      if (padding) {
        chunks.push(Buffer.alloc(padding));
        binaryLength += padding;
      }
      chunks.push(binary.subarray(at, at + view.byteLength));
      view.byteOffset = binaryLength;
      binaryLength += view.byteLength;
      return view;
    });
  const copyAccessor = (index) =>
    copy("accessors", index, (accessor) => {
      if (accessor.bufferView !== undefined)
        accessor.bufferView = copyView(accessor.bufferView);
      if (accessor.sparse) {
        accessor.sparse.indices.bufferView = copyView(
          accessor.sparse.indices.bufferView,
        );
        accessor.sparse.values.bufferView = copyView(
          accessor.sparse.values.bufferView,
        );
      }
      return accessor;
    });
  const copyImage = (index) =>
    copy("images", index, (image) => {
      if (image.bufferView !== undefined)
        image.bufferView = copyView(image.bufferView);
      return image;
    });
  const copyTexture = (index) =>
    copy("textures", index, (texture) => {
      if (texture.source !== undefined)
        texture.source = copyImage(texture.source);
      if (texture.sampler !== undefined)
        texture.sampler = copy("samplers", texture.sampler);
      for (const extension of Object.values(texture.extensions ?? {}))
        if (extension.source !== undefined)
          extension.source = copyImage(extension.source);
      return texture;
    });
  const copyMaterial = (index) =>
    copy("materials", index, (material) => {
      const visit = (value) => {
        for (const [key, child] of Object.entries(value)) {
          if (!child || typeof child !== "object") continue;
          if (key.endsWith("Texture") && child.index !== undefined)
            child.index = copyTexture(child.index);
          else visit(child);
        }
      };
      visit(material);
      return material;
    });
  const copyMesh = (index) =>
    copy("meshes", index, (mesh) => {
      for (const primitive of mesh.primitives) {
        for (const key of Object.keys(primitive.attributes))
          primitive.attributes[key] = copyAccessor(primitive.attributes[key]);
        if (primitive.indices !== undefined)
          primitive.indices = copyAccessor(primitive.indices);
        if (primitive.material !== undefined)
          primitive.material = copyMaterial(primitive.material);
        for (const target of primitive.targets ?? [])
          for (const key of Object.keys(target))
            target[key] = copyAccessor(target[key]);
        for (const [name, extension] of Object.entries(
          primitive.extensions ?? {},
        )) {
          if (name !== "KHR_draco_mesh_compression")
            throw new Error(`Unsupported geometry extension: ${name}`);
          extension.bufferView = copyView(extension.bufferView);
        }
      }
      return mesh;
    });
  const copyNode = (index) =>
    copy("nodes", index, (node) => {
      if (node.mesh !== undefined) node.mesh = copyMesh(node.mesh);
      if (node.camera !== undefined) node.camera = copy("cameras", node.camera);
      if (node.children) node.children = node.children.map(copyNode);
      return node;
    });

  const allowed = new Set(retainedNodes);
  const found = new Set();
  output.scenes = source.scenes.map((scene) => ({
    ...structuredClone(scene),
    nodes: scene.nodes
      .filter((index) => {
        const name = sanitize(source.nodes[index].name ?? "");
        if (!allowed.has(name)) return false;
        found.add(name);
        return true;
      })
      .map(copyNode),
  }));
  if (found.size !== allowed.size)
    throw new Error(
      `Missing retained nodes: ${[...allowed].filter((name) => !found.has(name)).join(", ")}`,
    );
  for (const key of Object.keys(maps))
    if (!output[key].length) delete output[key];
  const usedExtensions = new Set();
  const findExtensions = (item) => {
    if (!item || typeof item !== "object") return;
    for (const name of Object.keys(item.extensions ?? {}))
      usedExtensions.add(name);
    for (const [key, value] of Object.entries(item))
      if (key !== "extensionsUsed" && key !== "extensionsRequired")
        findExtensions(value);
  };
  findExtensions(output);
  for (const key of ["extensionsUsed", "extensionsRequired"]) {
    const extensions = (output[key] ?? []).filter((name) =>
      usedExtensions.has(name),
    );
    if (extensions.length) output[key] = extensions;
    else delete output[key];
  }
  output.buffers = [{ byteLength: binaryLength }];
  const jsonBytes = Buffer.from(JSON.stringify(output));
  const jsonLength = (jsonBytes.length + 3) & ~3;
  const binLength = (binaryLength + 3) & ~3;
  const packed = Buffer.alloc(28 + jsonLength + binLength);
  packed.writeUInt32LE(0x46546c67, 0);
  packed.writeUInt32LE(2, 4);
  packed.writeUInt32LE(packed.length, 8);
  packed.writeUInt32LE(jsonLength, 12);
  packed.writeUInt32LE(JSON_CHUNK, 16);
  packed.fill(0x20, 20, 20 + jsonLength);
  jsonBytes.copy(packed, 20);
  packed.writeUInt32LE(binLength, 20 + jsonLength);
  packed.writeUInt32LE(BIN_CHUNK, 24 + jsonLength);
  Buffer.concat(chunks).copy(packed, 28 + jsonLength);
  return packed;
}

export const pruneCrossroads = (input) =>
  pruneStaticGlb(input, retainedHubNodes);

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const target = process.argv[2]
    ? pathToFileURL(resolve(process.argv[2]))
    : new URL(
        "../../experiments/saksham-driving-world/static/models/crossroads/static/base.glb",
        import.meta.url,
      );
  const before = await readFile(target);
  const after = pruneCrossroads(before);
  await writeFile(target, after);
  console.log(
    `Crossroads: ${before.length.toLocaleString()} -> ${after.length.toLocaleString()} bytes; ${retainedHubNodes.length} retained nodes.`,
  );
}
