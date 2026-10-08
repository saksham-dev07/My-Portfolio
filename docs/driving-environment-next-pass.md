# Desktop environment: next implementation pass

Scope: desktop driving, original camera, overhead map and first-person view.
Mobile optimization is deferred. The implementation record below distinguishes
the completed pass from the original design specification that follows.

## Implemented — 8 October 2026

- Variable-width perimeter foothills and asymmetric, overlapping research banks
  use the existing 2 m render/physics grid. Roads and protected foundations retain
  their elevations; road connectivity and grade tests still pass.
- `World/EnvironmentLayout.js` supplies deterministic elliptical grove clusters,
  scaled canopy spacing, slope rejection and explicit road/sign/landmark masks.
  The scene now has 54 grove trees, with sizes varied around the existing model.
- `scripts/assets/create-environment-kit.py` authored three carved rock variants,
  two low shrub variants and solid grass blades in an isolated Blender scene.
  Editable sources retain the rock Bevel modifiers. Analytic cuts and seeded
  vertex variation replaced the proposed Displace/Decimate stack; no Geometry
  Nodes scatter was baked into the export. Runtime instancing handles placement.
- The GLB is 236,544 bytes, six meshes, one vertex-color material and no textures.
  Individual variants contain 98–502 triangles. Export selection excludes the
  authoring contact sheet and all unrelated Blender scenes.
- `World/EnvironmentDressing.js` loads the kit when its regions become visible.
  It renders 31 rocks, 37 shrubs and 75 grass clumps using six instanced groups.
  Rocks embed into the sampled slopes and have coarse colliders. A seventh,
  merged group adds terrain-conforming soft contact shadows for rocks and trees.
- 57 tests pass, including exported-mesh footprint checks, asset budgets, seeded
  spacing, full road/landmark clearance and independent terrain/physics raycasts.
  Production build and code checks pass. No new dependency was installed.

At the same 1280 × 720 overhead view, a 90-frame browser sample changed from
771 to 778 aggregate draw calls and 541,181 to 589,443 triangles. Median frame
interval was 13.8 ms before and 13.9 ms after; p95 was 14.0 ms and 14.5 ms.
These are local observations, not guarantees for other desktop GPUs. Browser
checks found no shader errors; the optional world's JavaScript is ~363 KB gzip.

## Direction and audit

Keep the warm stone, lavender ground and restrained green foliage. Build a
small research campus within a valley: a wooded arrival, open research terraces,
a rocky western drive and a calm education courtyard. Empty space is useful
where it keeps project boards, intersections and the portrait readable.

The current desktop overview exposes three weaknesses:

- The rectangular perimeter rises with a uniform falloff, resembling a tray.
- Banks between project rows are parallel mounds with little exposed geology.
- Small isolated grove groups lack an understory and a clear density hierarchy.

The new research gateway is already exported, integrated and drive-tested. It
establishes the scale and material palette for subsequent authored assets.

## 1. Shape the land before placing props

Edit `World/LandscapeLayout.js`, keeping `surfaceHeight()` as the source used by
rendering, planting, shadows and Cannon physics. Do not export a second terrain
surface from Blender over the heightfield.

- Replace the uniform visible rim with overlapping broad ridge lobes inside
  the existing bounds; keep a continuous containment rise at the outer boundary.
- Shape the two research banks around (107, -48) and (106, -88) into asymmetric
  ridge profiles: shallow approach on one side, rocky exposed face on the other.
- Preserve the existing 2 m grid for this pass. Improve silhouettes through
  macro form, not a blanket subdivision increase.
- Preserve straight road runs, authored corners and the single asphalt-union
  mask. Flatten the actual paved footprint, shoulder and interpolation margin.
- Keep all existing landmark foundations and interaction pads at their current
  height. Preserve the tested maximum longitudinal road grade of 20%.

Review the same positions from top view, original driving view and first-person
before adding dressing. The banks should reveal the next destination gradually
without hiding its arrival sign.

## 2. Compose vegetation with explicit placement rules

Refine `Landscape.setGroves()` around three authored density zones:

| Zone | Composition | Keep open |
| --- | --- | --- |
| Northern research edge, y around -8 | 3–5 tree groups with one taller anchor | Project boards and gateway approach |
| Western ridge, x around -60 | Uneven grove edges, exposed rock between groups | Scenic road, arch opening and clearing |
| Southern circuit, y around -132 | Low planting with occasional paired trees | Education frontage and circuit turns |

Use deterministic seeded placement with minimum spacing derived from each
scaled canopy radius. Mix approximately 60% medium, 25% small and 15% tall trees;
target scale variation of 0.8–1.2 within each size class. These are art-direction
starting values to adjust from the desktop view, not performance measurements.

For each candidate, reject the complete canopy/prop footprint inside
`roadEdgeDistance < radius + 0.8`, landmark foundations and label/pad clearances.
Use the local height gradient to reject steep planting sites. Add a separate
sightline exclusion around junctions and project-board approaches. Reuse the
original tree and rock art wherever its silhouette fits. Keep trunk colliders
and visual transforms synchronized; do not make foliage itself a solid wall.

## 3. Author one cohesive Blender asset kit

Create three rock silhouettes, two low shrubs and one grass-clump mesh. No
additional landmark is needed until the terrain and gateway composition works.

Rock workflow:

1. Start with a low-resolution icosphere or bevelled cube; apply scale.
2. Edit the major planes into a wedge, slab and rounded boulder. Flatten the
   underside so placement slightly embedded in terrain looks grounded.
3. Use low-strength Displace for secondary breakup, followed by Decimate Planar
   or a restrained Collapse pass. Check the silhouette after each change.
4. Bevel only major exposed edges, one segment, approximately 0.02–0.06 m;
   use weighted normals where appropriate. Avoid uniformly rounded pebbles.
5. Assign the existing stone/copper-grey palette through a small material set
   or vertex colors; bake any procedural shading needed at runtime.

Shrub/grass workflow: build broad readable leaf masses and a few tapered curved
blades, using solid geometry instead of layered transparent cards. Preserve a
ground-level pivot, vary silhouette between variants, and avoid tiny detail that
disappears at the default driving-camera distance.

Suggested per-asset budgets: 250–700 triangles per rock, 300–600 per shrub and
80–160 per grass clump. Treat these as targets; compare appearance and render
cost before accepting them.

For a Blender placement preview, use this Geometry Nodes chain:

`Terrain reference -> exclusion/slope selection -> Distribute Points on Faces
(Poisson Disk) -> Instance on Points (pick variant) -> seeded rotation/scale`.

Use separate masks for trees, rock outcrops and understory. Keep preview
instances editable. Export each reusable source asset once and use Three.js
`InstancedMesh` per geometry/material for runtime placement; do not flatten the
entire scattered landscape into a huge GLB.

## 4. Export and integrate deliberately

- Follow the existing research-gateway script pattern: owned collection,
  applied transforms on export copies, consolidated material groups, selected
  active-scene GLB export, no camera/light/animation export.
- Keep meters as the shared scale and pivots on the ground. Blender's glTF
  export is Y-up; apply the same explicit runtime conversion used by the gateway
  for this Z-up world, and verify dimensions with a car beside the asset.
- Preserve editable source objects/modifiers in the authoring scene. Keep the
  reproducible script in `scripts/assets/` and GLBs in the existing
  `experiments/saksham-driving-world/static/saksham/models/` directory.
- Place rocks in short geological groups at ridge feet, partly embedded using
  `surfaceHeight()`. Add low understory only around tree bases and bank edges.
- Use coarse colliders for substantial rocks near drivable ground; decorative
  small foliage needs no collision. Load the kit with the optional world and
  reuse instances. Initial target: under 500 KB additional GLB data and at most
  8 additional geometry/material draw groups before post-processing passes.

## 5. Acceptance checks

1. All paved lanes, shoulders, intersections, pads and sign sightlines remain
   clear; include asset scale and crown movement in the clearance envelope.
2. Independent Cannon raycasts match rendered terrain. Ground decals and
   shadows retain their layer offsets and terrain conformity.
3. Drive the research gateway, both serpentine turns, western arch and campus
   junction; check parked mouse panning and automatic follow while driving.
4. Capture matching overhead and driving screenshots before/after. Test at
   1280×720 and 1920×1080 on desktop, including reduced-motion preference.
5. Compare aggregate draw calls, geometry, transferred bytes and frame-time
   distribution at the same camera positions. Target no more than 10% frame-time
   regression on the same machine; this is an acceptance target, not a claim
   of performance on all desktop GPUs.
6. Run `bun test`, `bun run check`, `bun run build` and
   `bun run audit:production`. Do not alter the existing camera/control contract.

## Pipeline references

- [Blender point distribution and Poisson Disk spacing](https://docs.blender.org/manual/en/4.3/modeling/geometry_nodes/point/distribute_points_on_faces.html)
- [Blender glTF exporter: modifiers, materials and export vertex counts](https://docs.blender.org/manual/en/3.0/addons/import_export/scene_gltf2.html)

The current gateway script also checks the installed Blender exporter enum
before export. Verify any new modifier/node APIs against the connected Blender
version before executing the next authoring script.
