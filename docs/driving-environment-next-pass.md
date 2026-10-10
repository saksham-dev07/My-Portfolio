# Desktop environment: next implementation pass

Scope: desktop driving, original camera, overhead map and first-person view.
Mobile optimization is deferred. The implementation record below distinguishes
the completed pass from the original design specification that follows.

## Arrival courtyard and Maker Yard — 10 October 2026

- Replaced the scattered starting composition with a warm limestone forecourt,
  emerald control bays on the left and right, upright two-sided instruction
  boards, and brass lane edges. The centre remains open from the car spawn to
  the first stone trail; surface paint has no raised curb or physics barrier.
  The arrow-key demonstration and horn remain usable in the side bays.
- Added a custom Blender garage pergola with an open front, sheltered teak
  bench, tool counter, driving helmet and spare wheel. Its posts, furnishings
  and overhead structure use authored compound proxies; the departure corridor
  stays clear. The kit has no floor slab to overlap the courtyard paving.
- Turned the eastern clearing into a Maker Yard with a rounded warm-stone
  court, brass corner inlays, a clear push approach, and a crafted workbench
  beside the existing brick stack. The workbench has a pegboard tool rack,
  three drawers, blueprint, vice, toolbox and three decorative spare bricks.
  The visible REBUILD pad remains at (30,-115), clear of the workshop furniture.
- The ten original Cannon bricks remain real dynamic bodies. A two-sided
  MAKER YARD board samples their current displacement at 10 Hz and redraws only
  when the count changes. This is a local physics toy, not a cumulative score.
  REBUILD restores the same bodies, clears velocity, angular velocity, force
  and torque, and synchronizes interpolation to avoid a stale moving pose.
- `scripts/assets/create-courtyard-kit.py` reproduces the two named Blender
  meshes: arrival 1,560 triangles and maker 984 triangles. The shared export
  is 152,320 bytes / 2,544 triangles with one vertex palette material, twelve
  arrival proxies and five maker proxies. The single optional request waits
  for a relevant camera frustum after entry. Failed art creates no invisible
  walls; disposal releases the compound bodies and shared drawing resources.
- Retired the legacy intro static base, collision and atlas shadow from the
  loader and shipping files. One original atlas remains only as
  `tests/fixtures/legacy-intro-shadow.png` for the shadow regression.
  No shipped image textures, dependencies or paid generation were added.

Validation: `bun test` passes 139 tests (54,534 assertions), `bun run check`
passes, and `bun run build` completes. The production audit reports 397 files /
52.22 MiB without source maps, environment files or local agent instructions.
Existing large JavaScript chunk warnings remain. Desktop browser checks at
1280×720 cover front and reverse views of both courts; explicit surface paint
ordering keeps the instruction bays and brass inlays visible at oblique angles.
The arrow props now compensate for their authored GLB collision centre.
In the browser, a two-second Arrow Up drive displaced all ten bricks and changed
the board to 10 / 10; Enter on REBUILD restored 0 / 10, with zero horizontal
origin error, speed and force across the same ten bodies. No warning or error
messages appeared in the inspected browser log. Saved proofs:
[arrival court](C:/Users/agarw/.codex/visualizations/2026/10/08/01a11b9f-5064-7930-aa57-1dcb0a1f368e/arrival-courtyard-world.png),
[Maker Yard](C:/Users/agarw/.codex/visualizations/2026/10/08/01a11b9f-5064-7930-aa57-1dcb0a1f368e/maker-yard-world.png),
[real brick push](C:/Users/agarw/.codex/visualizations/2026/10/08/01a11b9f-5064-7930-aa57-1dcb0a1f368e/maker-yard-push-proof.png).

## Education chapters and About courtyard — 10 October 2026

- Replaced the empty timeline composition with three custom Blender dioramas:
  classroom desk/book/chalkboard, brass atom/flask/lab notebook, and a campus
  gateway/laptop. The VIT scene marks college entry rather than graduation.
  One 200,912-byte GLB contains 3,448 triangles, three named meshes, one vertex
  palette material and no textures or extra decoder. Authored source remains
  reproducible in `scripts/assets/create-education-chapters.py`.
- Artwork sits at (-15,-103/-109/-115), beside compact 3x3m interaction pads
  at X -20. Their actual geometry and collision bounds clear roads, walls,
  pads and planting. The single optional download waits for camera visibility;
  offline or malformed art leaves the education interactions available.
- Each year pad selects its real education entry in the map, marked THIS
  CHAPTER; other entries remain accessible. Desktop browser activation of the
  Science pad verified that the CBSE Science entry appears first.
- The About portrait now rests on a 0.35m stone/emerald/brass plinth, with
  a shaped lawn and split inlays. Upright framed signs replace the flat black
  slabs; both faces read upright and keep the forecourt and adjacent roads open.
  The original photographic portrait remains, with its baseline aligned to
  the plinth. Ground decals use explicit stable depth layers.
- Final 1280x720 browser checks cover front/rear model placement, the portrait
  support, sign orientation and legibility. Console errors/warnings are empty.
  Temporary viewport, camera and car poses were reset to normal auto-follow.
- Validation: 127 tests / 53,067 assertions across 36 files pass. Build and
  production audit pass: 399 files / 52.13 MiB. Existing large JS chunk
  warnings remain. This pass uses no generation credits or new dependencies.

## Blender prop refinement and bowling placement — 10 October 2026

- Replaced the generated chai cart with a custom Blender design: bowed striped
  canopy, scalloped fabric edges, green cabinet, teak grilles, brass vessels,
  spoked wheels and clay cups. The 3,764-triangle, 224,540-byte export uses one
  vertex palette mesh and no image maps. Placed at (-52,-119), scale .85; real
  shipping bounds clear the pond, garden loop, shelter and tree crowns.
- Replaced Highlights artwork with a hollow brass cup, curved handles, laurel
  and stepped sandstone podium. Geometric plaques read from both sides. The
  3,600-triangle, 218,160-byte export has four authored proxies; entry (30,-94)
  and artwork (30,-83) positions remain. Blender source scripts are in
  `scripts/assets/`; editable .blend files are in the chat visualization folder.
- Corrected the bowling start pad from (-28.5,-23.5), where it intersected a
  dynamic break wall, to (-24.5,-30) at the open lane entrance behind the ball.
  The 3x4m pad and label move together. Actual static/dynamic GLB footprints,
  road shoulders and botanical crowns verify clearance. Active game interaction
  cannot restart a round.
- Desktop browser checks at 1280x720 verified the cart/pond/shelter composition,
  trophy opening/plaque/shading and pad position. Enter on the relocated pad
  started bowling; repeated Enter preserved a rolling attempt with ten pins
  knocked down. Temporary camera, car pose and viewport changes were reset.
- Validation: 120 tests / 51,774 assertions across 34 files pass. Check, build
  and production audit pass: 398 files / 51.93 MiB. Existing large JS chunk
  warnings remain. No Thrixel credits or new dependencies used for this pass.

## Initial activities and verification — 10 October 2026

- Added scored Maidan Bowling, timed Campus Rally, a shared Play menu and an
  edge HUD. Games pause under dialogs/hidden tabs and stop when map travel
  changes destinations. Retry resets motion and refocuses the camera.
- Added four refined Thrixel props: live scoreboard, campus start arch, garden
  chai cart and a functional ramp/deck. The kit totals 2,772 triangles and
  226.5 KiB; optional serialized region loading leaves the core boot unchanged.
  See `world-activity-assets.md` for source IDs and measured budgets.
- Moved the bowling entry pad to the lawn at (-28.5,-23.5), with its interaction
  and PLAY BOWLING lettering together. Rangoli replay lettering now sits farther
  to the left of the raised ENTER prompt and clear of tree crowns.
- Camera follow resolves the current chassis after R resets. Dialog braking
  persists until the dialog closes. The original five regression tests remain
  intact; the two new vehicle/dialog cases are in a separate test file.
- Validation: `bun test` passes 118 tests / 51,580 assertions across 33 files.
  `bun run check`, `bun run build`, `bun run audit:production`, and
  `git diff --check` pass. Production: 398 files / 51.73 MiB. Large existing
  world/Three.js chunk warnings remain; no unsupported frame-rate claim is made.
- Desktop browser checks covered all three bowling attempts (21/30 scored),
  adjustable aim, menu pause/resume, rally countdown, drive-through arch,
  map pause, reset rejection and retry from Top view. Art checks include the
  grouped chai cart, ramp, low-angle pond coping, road terminal and discovery.
  The 23-angle sampled survey and next phases are in `world-experience-plan.md`.

## Indian identity and interaction repairs — 9 October 2026

- A custom Blender sandstone arch inspired by India Gate replaces the Eiffel
  tower, baguettes and red location pin. The existing Indian flag remains.
  The new arch has an actual open passage, stepped base, cornices, geometric
  INDIA lettering and five structural collision boxes. Its 3.5 × 2.5 × 4 m
  footprint is separate from the flag stand and the personal avenue.
  Export: 99,576 bytes, 1,740 triangles, one vertex-color mesh/material and no
  image textures. Eighty-four source parts remain editable in the .blend.
- `InformationLayout.js` owns the replacement footprint and retired nodes.
  `prune-information.mjs` removes the old display payload and obsolete physics
  proxies; the static base shrinks from 57,352 to 39,176 bytes and collision GLB
  from 6,244 to 5,396 bytes. The two unused baguette GLBs and loader entries
  are removed. Former display shadows are included in the retired-atlas masks,
  and the new arch receives a neutral contact shadow.
- The playground's short final road segment had forced a corner radius below
  its paved half-width, folding the inner shoulder. Two exact tangent 4 m
  quarter-circles replace the tight bends, followed by a 3 m straight approach
  ending at (-28,-42). Its 2.05 m inner shoulder radius stays positive; the
  end clears the retained bench collider by 1.07 m. Other routes retain their
  existing geometry and the single union-mask terrain surface.
- The existing secret area at (-58,-60) previously changed a wig at the distant
  crossroads. It now reveals a twelve-petal rangoli and a faceted curiosity
  seed beside the visitor, with a finite petal burst and visible accessible
  confirmation. Driving in, clicking, or pressing Enter activates it. DISCOVER
  becomes BLOOM AGAIN, and the notice offers replay/dismissal with canvas focus
  restoration. A cooldown bounds repeated activation; reduced motion reveals
  the full scene instantly. Existing Konami behavior remains available.
- The pond coping's extrusion faces were wound inward: the top faced down and
  its bottom faced up at the same depth as the lawn. The Blender generator now
  exports outward faces, and the runtime buries the sole 4 cm below the terrain.
  Collision tops move with the visible coping to 20 cm above ground; water
  remains at 14 cm. An actual decoded-triangle regression checks both top and
  bottom winding, avoiding a render-order workaround for solid stone.

## Personal scenes and coherent landscape — 9 October 2026

This pass supersedes the legacy tree placement and fallback details recorded
below. The earlier sections remain as implementation history.

- `create-personal-vignettes.py` builds five editable Blender scenes: basketball,
  coding, watching TV, gym and arcade. The portrait guides the swept hair,
  glasses, skin tone and facial silhouette; the full body uses approximate slim
  adult proportions because the reference does not show the whole body. No
  photograph or image texture is included in the export.
- The basketball figure is airborne with trailing bent legs, a raised hand
  meeting the ball above the rim and its head facing the hoop. The arcade
  player is centered directly in front of the cabinet, with both hands aligned
  to the controls. Three floor dumbbells, a bench, towel and flask complete the
  gym. Connected bent limbs improve the silhouettes without detailed anatomy.
- `personal-vignettes.glb` is 293,680 bytes and 4,280 triangles: basketball 908,
  coding 800, TV 744, gym 1,048 and arcade 780. Five meshes share one vertex-color
  material with normalized byte colors; there are no textures or decoders.
  `PersonalVignettes.js` loads the scenes when visible, places them above the
  five retained plinths at scale 1.6, and builds aligned prop collisions from
  GLB extras. Pose landmarks provide a regression check for actual activity
  positions. The editable `personal-vignettes.blend` is kept outside deployment.
- `prune-crossroads.mjs` removes the superseded figures and their geometry
  payload, retaining all five plinths, boards and footing rocks. The hub base
  falls from 631,364 to 54,304 bytes. Its obsolete baked shadow PNG is removed;
  the new scenes receive neutral contact shadows. West/east sign groups move
  4.4 m north, and the southern group 4.5 m west, with their matching colliders.
- All 16 embedded block trees and their narrow Cannon shapes are retired,
  preserving rails, rocks and shared source materials. The 21 cloned profile
  block trees and proxies are removed. The Blender botanical kit now supplies
  every tree: 48 broadleaf and 20 copper trees in two instanced groups. Of the
  68 trees, 25 belong to newly composed arrival, playground, information,
  portrait, skills, highlights, campus and journey groups; 43 valley/garden
  grove placements remain. Trees use the actual surface heights and reserve
  their complete moving crowns from roads, signs, art, paths and labels.
- Trunk collisions and tree contact shadows appear only after the botanical
  GLB loads. The field kit has 182 supporting props; 42 coral/lilac flower
  clumps use two further instanced groups. The former tree silhouettes are
  suppressed in their three original shadow atlases, including the wide baked
  penumbra and long tails. A source-pixel regression verifies removal of a
  surviving soft tail while preserving a separate rock shadow.
- `TerrainPalette.js` blends green valley ground into olive foothills and
  warm brown exposed slopes/crests. Terrain masks modulate meadow variation,
  soil and sandstone paths within the existing heightfield shader. The hub
  island, fog and restrained sunlight glow use the same landscape palette.
  Road geometry, heights and vehicle physics remain covered by regressions.
- Live desktop checks confirmed the dunk/arcade/gym alignment, the new
  branching tree silhouettes and cleared original shadow footprints. The car
  drove 12.6 m through the hub's east approach without meeting the relocated
  signs or planting; moving automatically restored camera follow. No browser
  console or shader errors appeared. A settled 90-frame 1280 × 720 overhead
  sample recorded 741 aggregate draws, 636,309 triangles, a 7.0 ms median frame
  interval and 13.9 ms p95. These local observations are not GPU guarantees.
- 80 tests pass across 24 files, including activity pose, exported bounds,
  tree retirement, readiness, clearance and existing driving/camera checks.
  `bun run check`, production build and deployment audit pass. Deployment is
  395 files / 51.39 MiB, without local instructions or source maps. The existing
  large-chunk warning remains. No dependency was added. Camera/viewport QA
  overrides are cleared after capturing the proof views.

## Botanical pass — 9 October 2026

- `create-botanical-kit.py` authors layered broadleaf/copper crowns on branching
  trunks, coral/lilac petal clumps and a segmented, chamfered stone pond rim in
  an isolated Blender scene. The editable assembly is saved as
  `botanical-kit.blend`; the GLB is 201,444 bytes, five meshes, one vertex-color
  material, normalized byte colors and no textures or decoder requirement.
- `BotanicalDressing.js` lazily replaces the temporary grove copies after a
  successful load, retaining them if loading fails. Forty-three trees and
  48 flower clumps render in four instanced groups. The existing kit supplies
  155 supporting rocks, shrubs and grass clumps. Large-crown envelopes are
  reserved before placement, including their small breeze displacement.
- Irregular, feathered meadow silhouettes replace repeated hard oval patches.
  Fresh green grass, warm planting soil and sandstone paths use the existing
  terrain mask; no overlapping ground geometry or extra terrain draw is added.
  The pink screen glow is reduced from .55 to .27, preserving the atmospheric
  lighting while retaining the new foliage colors.
- One garden pond at (-54.3, -115) fits within the walking loop. Its complete
  shoreline is reserved from planting; 24 low colliders match the visible stone
  rim. Opaque teal water uses one inexpensive ripple shader with fog support,
  no reflection render target and no network texture. Reduced-motion preference
  stops both the new water and foliage movement, verified in the browser.
- Chapter title strips now have explicit planting exclusions. The flower beds
  also reject road shoulders, existing dressing, trunks, paths, the shelter and
  pond. Camera/driving behavior remains covered by the existing regressions.
- At 1280 × 720, a 90-frame overhead sample recorded 773 aggregate draws and
  667,236 triangles: four more draws than the garden pass, with a 13.9 ms median
  interval and 14.1 ms p95. These are local observations, not universal GPU
  guarantees. First-person driving covered 10.7 m through the approach without
  encountering the new planting. No browser shader/console errors appeared.
- 66 tests pass; production build, code checks and production audit pass. The
  deployment is 51.68 MiB and contains no local instructions or source maps.
  The existing large-chunk warning remains. No dependency was installed.

## Garden pass — 9 October 2026

- Replaced scattered yellow planting with 16 authored legacy trees in arrival,
  playground and Information groups, plus 21 trees framing the profile landmarks.
  Separate sage/moss/olive materials preserve the imported shared materials.
  Trunks and compound Cannon proxies move, turn and scale with their canopies;
  unrelated rocks and playground rails retain their transforms and collisions.
- The west ridge now contains one lawn garden: a level walking loop, a curved
  pedestrian entrance joined to the actual rounded road, five perimeter trees,
  border shrubs and grass. Its edges transition gradually into the ridge.
  Grass meadows also ground the northern and southern groves. Lawn and paths
  are painted into the shared heightfield shader, avoiding overlapping surfaces.
- `GardenLayout.js` owns the garden footprint and paths. The same geometry
  reserves vegetation clearance. Grove placement also rejects legacy canopies.
  The final scene has 46 instanced grove trees and 156 kit props: 29 rocks,
  45 shrubs and 82 grass clumps, using the existing six instanced groups.
- `create-garden-shelter.py` builds an isolated Blender scene with 55 editable
  parts: rounded stone terrace, splayed timber supports, bowed slat roof, copper
  trim and one integrated rear seat. Source bevel modifiers remain editable.
  Its selected export is one colored mesh/material, 2,476 triangles and
  157,300 bytes, with normalized byte vertex colors and no textures or decoder.
  `GardenShelter.js` loads only when visible and adds terrace/post/seat collisions.
- Rear direction-board lettering now rotates around the upright world axis,
  so both faces remain readable in the first-person camera.
- Browser checks verified all new assets loaded without console or shader errors,
  and the car drove 8.5 m through the garden approach without an obstacle.
  A 90-frame 1280 × 720 top-view sample recorded 769 aggregate draw calls,
  591,378 triangles, a 7.0 ms median frame interval and 7.1 ms p95. This current
  local sample is not a direct frame-rate comparison with the previous day's
  sample or a guarantee for other GPUs. No dependency was installed.
- 62 tests pass, covering path connections, scaled planting clearance, exported
  asset bounds, rotated compound tree ownership, upright sign faces and existing
  driving/camera regressions. Production build and code checks pass. The inherited
  large-chunk build warning remains; the optional world is separate from the
  portfolio's initial page load.

## Previous pass — 8 October 2026

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
