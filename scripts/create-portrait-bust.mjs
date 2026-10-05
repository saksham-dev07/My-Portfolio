import { mkdir, writeFile } from "node:fs/promises";
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// A deliberately stylized, photo-informed sculpture; this is not a face scan.
// Everything is geometry and material color. No private gallery image is embedded.
const bust = new Group();
bust.name = "Saksham_Agarwal_Stylized_Bust";
bust.userData = {
  description:
    "A stylized likeness modeled from supplied portrait references. Inferred depth and rear geometry; not a photogrammetric reconstruction.",
};
const material = (name, color, roughness = 0.8, metalness = 0) => {
  const result = new MeshStandardMaterial({ color, roughness, metalness });
  result.name = name;
  return result;
};
const skin = material("Warm_clay_skin", "#a96f50");
const earShade = material("Ear_and_nose_detail", "#935c43");
const hair = material("Swept_dark_hair", "#151619", 0.74);
const strand = material("Hair_ridges", "#25262b", 0.64);
const beard = material("Short_facial_hair", "#45352c", 0.97);
const shirt = material("Charcoal_crewneck", "#25292b", 0.98);
const seam = material("Crewneck_seam", "#383d3e");
const metal = material("Silver_double_bridge_frames", "#b7bdba", 0.27, 0.84);
const white = material("Eye_white", "#d6cbb8", 0.55);
const iris = material("Brown_iris", "#2b1b16", 0.5);
const pupil = material("Pupil", "#080a0a", 0.44);
const lip = material("Natural_lip", "#945d52", 0.88);
const crease = material("Mouth_crease", "#51392f");
const lens = new MeshStandardMaterial({
  color: "#c9d5cc",
  roughness: 0.25,
  transparent: true,
  opacity: 0.045,
  depthWrite: false,
  side: DoubleSide,
});
lens.name = "Clear_glasses_lenses";

function add(name, geometry, surface, position = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new Mesh(geometry, surface);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  bust.add(mesh);
  return mesh;
}
function ellipsoid(name, position, scale, surface, segments = 28) {
  return add(
    name,
    new SphereGeometry(1, segments, 18),
    surface,
    position,
    scale,
  );
}
function tube(name, points, radius, surface, closed = false, steps = 32) {
  return add(
    name,
    new TubeGeometry(
      new CatmullRomCurve3(
        points.map((p) => new Vector3(...p)),
        closed,
        "centripetal",
      ),
      steps,
      radius,
      6,
      closed,
    ),
    surface,
  );
}
function surface(name, rows, columns, point, material) {
  const positions = [];
  const indices = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= columns; c++)
      positions.push(...point(r / rows, c / columns));
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const a = r * (columns + 1) + c;
      const b = a + columns + 1;
      indices.push(a, a + 1, b + 1, a, b + 1, b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return add(name, geometry, material);
}
const rings = [
  [0.16, 0.13, 0.22],
  [0.27, 0.36, 0.39],
  [0.45, 0.59, 0.49],
  [0.7, 0.77, 0.57],
  [1, 0.86, 0.65],
  [1.35, 0.94, 0.7],
  [1.65, 0.96, 0.73],
  [2, 0.93, 0.74],
  [2.35, 0.91, 0.72],
  [2.65, 0.86, 0.68],
  [2.87, 0.7, 0.57],
  [3.02, 0.43, 0.38],
  [3.15, 0.02, 0.02],
];
function section(y) {
  let i = 0;
  while (i < rings.length - 2 && rings[i + 1][0] < y) i++;
  const a = rings[i],
    b = rings[i + 1];
  const t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const gaussian = (x, center, width) => Math.exp(-(((x - center) / width) ** 2));
function headPoint(y, theta, offset = 0) {
  const [width, depth] = section(y);
  const x = (width + offset) * Math.sin(theta);
  let z = (depth + offset) * Math.cos(theta) - 0.015;
  const front = Math.max(0, Math.cos(theta)) ** 5;
  z +=
    front *
    (0.28 * gaussian(x, 0, 0.13) * gaussian(y, 1.42, 0.24) +
      0.135 * gaussian(x, 0, 0.095) * gaussian(y, 1.76, 0.34) +
      0.045 * gaussian(x, 0, 0.32) * gaussian(y, 0.94, 0.15) +
      0.035 * gaussian(x, 0, 0.3) * gaussian(y, 0.4, 0.16) +
      0.045 *
        (gaussian(x, 0.58, 0.21) + gaussian(x, -0.58, 0.21)) *
        gaussian(y, 1.36, 0.3) -
      0.095 *
        (gaussian(x, 0.4, 0.24) + gaussian(x, -0.4, 0.24)) *
        gaussian(y, 1.85, 0.15));
  return [x, y, z];
}
surface(
  "Sculpted_head",
  54,
  64,
  (r, c) => headPoint(0.16 + r * 2.99, c * Math.PI * 2),
  skin,
);

surface(
  "Neck",
  12,
  40,
  (r, c) => {
    const theta = c * Math.PI * 2;
    return [
      (0.39 + 0.03 * (1 - r)) * Math.sin(theta),
      -0.41 + r * 0.88,
      0.37 * Math.cos(theta) - 0.085,
    ];
  },
  skin,
);
surface(
  "Shoulder_bust",
  18,
  48,
  (r, c) => {
    const theta = c * Math.PI * 2;
    const width = 1.5 - 0.91 * r ** 3;
    const depth = 0.51 - 0.13 * r;
    return [
      width * Math.sin(theta),
      -1.33 + r * 1.04 - 0.08 * Math.abs(Math.sin(theta)) * r,
      depth * Math.cos(theta) - 0.07,
    ];
  },
  shirt,
);
surface(
  "Bust_base",
  1,
  64,
  (r, c) => [
    r * 1.5 * Math.sin(-c * Math.PI * 2),
    -1.33,
    r * 0.51 * Math.cos(-c * Math.PI * 2) - 0.07,
  ],
  shirt,
);
tube(
  "Crewneck_collar",
  Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [
      0.45 * Math.sin(a),
      -0.26 - 0.12 * Math.max(0, Math.cos(a)),
      0.4 * Math.cos(a) - 0.085,
    ];
  }),
  0.033,
  seam,
  true,
  64,
);

for (const side of [-1, 1]) {
  const label = side < 0 ? "Left" : "Right";
  ellipsoid(
    `${label}_ear`,
    [side * 0.94, 1.55, -0.03],
    [0.14, 0.3, 0.16],
    skin,
  );
  ellipsoid(
    `${label}_ear_inner`,
    [side * 1.017, 1.57, 0.065],
    [0.055, 0.18, 0.052],
    earShade,
  );
  ellipsoid(
    `${label}_ear_lobe`,
    [side * 0.96, 1.3, 0.025],
    [0.1, 0.1, 0.09],
    skin,
  );
  const center = side * 0.4;
  ellipsoid(`${label}_eye`, [center, 1.86, 0.645], [0.17, 0.073, 0.086], white);
  ellipsoid(
    `${label}_iris`,
    [center + 0.008, 1.86, 0.724],
    [0.055, 0.058, 0.024],
    iris,
    20,
  );
  ellipsoid(
    `${label}_pupil`,
    [center + 0.008, 1.86, 0.746],
    [0.023, 0.032, 0.011],
    pupil,
    16,
  );
  ellipsoid(
    `${label}_catchlight`,
    [center - 0.01, 1.884, 0.757],
    [0.01, 0.011, 0.006],
    white,
    12,
  );
  tube(
    `${label}_upper_lid`,
    [
      [center - 0.17, 1.85, 0.66],
      [center - 0.09, 1.915, 0.7],
      [center + 0.03, 1.925, 0.71],
      [center + 0.17, 1.86, 0.66],
    ],
    0.025,
    skin,
  );
  tube(
    `${label}_lower_lid`,
    [
      [center - 0.17, 1.85, 0.66],
      [center, 1.795, 0.71],
      [center + 0.17, 1.86, 0.66],
    ],
    0.022,
    skin,
  );
  tube(
    `${label}_eyebrow`,
    [
      [side * 0.18, 2.15, 0.715],
      [side * 0.32, 2.21, 0.7],
      [side * 0.49, 2.215, 0.67],
      [side * 0.67, 2.16, 0.62],
    ],
    0.037,
    beard,
  );
  const frame = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    const x =
      side * 0.435 +
      0.355 * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.65;
    const y =
      1.875 + 0.235 * Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.55;
    return [x, y, 0.885 - 0.045 * Math.abs(x)];
  });
  tube(`${label}_glasses_frame`, frame, 0.016, metal, true, 80);
  const outline = new Shape();
  frame.forEach((p, i) => {
    if (i === 0) outline.moveTo(p[0], p[1]);
    else outline.lineTo(p[0], p[1]);
  });
  outline.closePath();
  add(`${label}_glasses_lens`, new ShapeGeometry(outline), lens, [0, 0, 0.85]);
  tube(
    `${label}_glasses_arm`,
    [
      [side * 0.79, 2.025, 0.84],
      [side * 0.97, 2.01, 0.44],
      [side * 1.015, 1.99, -0.08],
      [side * 0.98, 1.82, -0.19],
    ],
    0.016,
    metal,
  );
  ellipsoid(
    `${label}_nostril`,
    [side * 0.105, 1.265, 0.838],
    [0.047, 0.019, 0.027],
    earShade,
    16,
  );
  tube(
    `${label}_moustache`,
    [
      [side * 0.025, 1.1, 0.816],
      [side * 0.1, 1.095, 0.78],
      [side * 0.21, 1.055, 0.741],
      [side * 0.28, 1.025, 0.718],
    ],
    0.026,
    beard,
  );
}
tube(
  "Glasses_bridge",
  [
    [-0.081, 1.96, 0.898],
    [-0.045, 1.99, 0.915],
    [0.045, 1.99, 0.915],
    [0.081, 1.96, 0.898],
  ],
  0.014,
  metal,
);
tube(
  "Glasses_upper_bridge",
  [
    [-0.14, 2.125, 0.88],
    [0, 2.145, 0.93],
    [0.14, 2.125, 0.88],
  ],
  0.014,
  metal,
);
tube(
  "Upper_lip",
  [
    [-0.245, 0.946, 0.704],
    [-0.11, 0.977, 0.748],
    [0, 0.956, 0.763],
    [0.11, 0.977, 0.748],
    [0.245, 0.946, 0.704],
  ],
  0.025,
  lip,
);
tube(
  "Lower_lip",
  [
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: A sculpted vertex coordinate, not a mathematical constant.
    [-0.23, 0.925, 0.707],
    [0, 0.889, 0.758],
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: A sculpted vertex coordinate, not a mathematical constant.
    [0.23, 0.925, 0.707],
  ],
  0.032,
  lip,
);
tube(
  "Closed_mouth",
  [
    [-0.242, 0.941, 0.712],
    [0, 0.936, 0.776],
    [0.242, 0.941, 0.712],
  ],
  0.009,
  crease,
);
surface(
  "Short_jaw_beard",
  10,
  50,
  (r, c) => {
    const theta = -0.98 + c * 1.96;
    const edge = Math.abs(theta) / 0.98;
    const low = 0.27 + 0.35 * edge ** 1.5;
    const high = low + 0.07 + 0.08 * (1 - edge) ** 0.8;
    return headPoint(low + r * (high - low), theta, 0.008);
  },
  beard,
);
surface(
  "Chin_goatee",
  10,
  18,
  (r, c) => {
    const theta = -0.31 + c * 0.62;
    return headPoint(
      0.3 + r * (0.18 - (0.05 * Math.abs(theta)) / 0.31),
      theta,
      0.01,
    );
  },
  beard,
);
ellipsoid("Soul_patch", [0, 0.76, 0.674], [0.057, 0.045, 0.017], beard, 16);

surface(
  "Swept_hair_volume",
  22,
  56,
  (r, c) => {
    const theta = c * Math.PI * 2;
    const front = Math.max(0, Math.cos(theta));
    const hairline = 1.86 + 0.75 * front ** 3 - 0.065 * Math.sin(theta) * front;
    const y = hairline + r * (3.15 - hairline);
    const [x, hy, z] = headPoint(y, theta, 0.075 * (1 - r) + 0.025);
    return [x, hy + 0.07 * Math.sin((Math.PI * r) / 2), z - 0.008];
  },
  hair,
);
for (let i = 0; i < 15; i++) {
  const t = i / 14;
  tube(
    `Swept_hair_ridge_${i}`,
    [
      [-0.78 + t * 0.23, 2.57 + t * 0.25, 0.46 - t * 0.06],
      [-0.4 + t * 0.25, 2.95 + t * 0.13, 0.59 - t * 0.09],
      [0.02 + t * 0.33, 3.18 - t * 0.025, 0.41 - t * 0.11],
      [0.5 + t * 0.16, 2.98 - t * 0.03, 0.27 - t * 0.1],
    ],
    0.012 + 0.009 * Math.sin(Math.PI * t),
    strand,
    false,
    30,
  );
}
for (const side of [-1, 1]) {
  ellipsoid(
    `Sideburn_${side}`,
    [side * 0.915, 1.99, -0.015],
    [0.053, 0.24, 0.15],
    hair,
  );
}

// GLTFExporter uses FileReader for its binary Blob in browser environments.
// This small Bun adapter implements only the two methods the exporter invokes.
globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    this.onloadend?.();
  }
};
const exporter = new GLTFExporter();
const output = await exporter.parseAsync(bust, {
  binary: true,
  onlyVisible: true,
});
const destination = new URL("../public/portrait/", import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(
  new URL("saksham-bust.glb", destination),
  new Uint8Array(output),
);
let triangles = 0;
bust.traverse((object) => {
  if (object.isMesh)
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3;
});
console.log(
  `Saved public/portrait/saksham-bust.glb: ${(output.byteLength / 1024).toFixed(1)} KB, ${triangles} triangles.`,
);
