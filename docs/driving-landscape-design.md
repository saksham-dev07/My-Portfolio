# Driving world: Field Notes valley

## Audit and direction

The previous floor was a 2 × 2 screen-space gradient with 10 × 10 subdivisions,
not physical terrain. Cannon provided an infinite flat plane. Roads were tile
markers; twelve project boards extended from x=30 to x=294 with random Y offsets.
The southern profile district was disconnected from that long eastward gallery.
Scenery added duplicate tile lanes, non-colliding trees and decorative pools.
There were no natural boundaries or terrain LOD/chunk systems. Static-object
merging existed but was disabled and used an obsolete geometry API.

Preserved: the vanilla Three.js/Cannon architecture, raycast vehicle and its
suspension tuning, original playable props, supplied GLBs, profile/circuit
interactions, accessible World Map, sound opt-in, boot sequence, and the separate
lazy-loaded portfolio route. Existing lighting uses matcaps for original artwork,
three lights for supplied models, blob shadows, blur and glow passes. No HDRI or
real-time shadow maps were added. DPR remains capped at 1.5 desktop / 1.25 coarse
pointer devices.

The direction is a stylized lavender-and-warm-stone valley with a research
promenade, wooded approaches and one signal aperture on the western ridge.
Calm foundations separate geographic forms; foliage frames destinations rather
than filling every empty patch.

## Authored map (Z-up metres)

| Location | Coordinates / extent |
| --- | --- |
| Starting line | (0, 0), preserved |
| Hub roundabout | (0, -30), 6 m centreline radius, four cardinal approaches |
| Playground | (-38, -34), approached through its eastern entrance |
| Information garden | (1.2, -55), preserved |
| Research terraces | x=60/90/120/150; y=-24/-64/-104, serpentine order |
| About / skills / highlights / campus | Original southern coordinates preserved |
| Signal aperture | (-49, -80), on the western scenic road |
| Quiet discovery clearing | (-58, -60); relocated original hidden interaction |
| Terrain bounds | x=-76…180; y=-148…32 |

The research road returns to the campus circuit instead of ending at the last
project. The garden approach splits around the Information copy. Year signposts
follow the western detour, which reconnects to the education loop. Original
Konami artwork retains a flat foundation. No working hidden interaction is left
outside the new bounds.

## Geometry, physics and loading

- `LandscapeLayout.js` owns straight avenues, controlled rounded corners, a circular
  roundabout, protected foundations, macro ridges,
  restrained surface detail and a cached 2 m height grid.
- `Landscape.js` builds the 23,040-triangle indexed terrain, vertex lighting and
  height/slope colours, a single union of paved corridors, instanced tree groves,
  the signal aperture and reused dimensional signboards.
- `Physics.js` consumes that same grid through `CANNON.Heightfield`. Its triangle
  diagonal matches the render mesh. Asphalt and shoulders are painted onto that
  mesh using one locally generated 2048 × 1440 channel mask. A junction is a union
  in the mask, not overlapping ribbons: no road z-fighting, floating edges or holes.
  The mask adds no network request and removes the separate road triangles.
- Main roads have broad flattening masks; existing landmark foundations stay at
  zero. Tested longitudinal road grades remain below 20%. Camera height and blob
  shadows follow the surface. Simulation uses a fixed step with bounded catch-up.
- Perimeter ridges visibly communicate the boundary. A car that jumps beyond the
  finite field returns to its last safe position, with an on-screen status.
- Groves reuse the original model with scale/rotation variation and reject road
  corridors, steep ground and landmark foundations. All existing profile trees
  also check their full canopy radius plus 0.6 m against the road and shoulder.
  Original static trees are relocated before batching; matching compound-body
  trunk offsets move with them, preventing invisible leftover collisions.
  Portrait garden and eastern clearing groves use deliberate roadside positions.
  Trunks and arch supports have
  coarse solid collisions. No random benches or new model downloads were added.
- Project board images load when visible or nearby. Top view intentionally loads
  the map's visible artwork. Campus/portrait retain their existing deferred loads.
- `?debugWorld=true` enables terrain wireframe, physics helpers and bounds. It is
  off by default. One small field needs no streaming infrastructure.

Original static props now use the existing merging system with cloned geometry
and the current Three.js transform API. Sign text retains its front/side colours
while consolidating per-glyph groups. The normal portfolio source and initial
asset transfers are unchanged by this landscape upgrade.

## Ground depth and junction stability

Ground text, interaction borders, accents and baked shadows now have separate
height/render layers, depth writes disabled and a small polygon offset. Depth
testing remains enabled so solid objects still occlude decals. Reveal and hover
uniforms retain their original ownership, including initially invisible intro
instructions. Component-owned materials also retain their identity: the intro
reveal changes the same opacity that the rendered mesh uses. Each baked shadow
retains its own texture instead of joining a
shared static batch. Ground textures use mipmaps and modest anisotropic filtering.

Moving shadow meshes conform to the actual heightfield using 8 × 8 subdivisions;
only changed poses update their vertices. This costs 126 additional triangles per
blob (154 existing blobs), with no additional draw calls or downloaded assets.

Courtyard lanes are 3.2 m wide with 0.35 m shoulders. Research and ridge returns
join straight lane segments instead of rounded-corner control points. The secret
approach joins the ridge centreline and ends before its pad. A one-time CPU mask
fillets concave junctions and derives a continuous curb from the asphalt union.
It adds no per-frame road computation. Subpixel filtering smooths raster edges.

The three year signs now share the education stops' coordinates and point from
the roadside toward their matching pads. Their poles remain outside the asphalt
and shoulder; the scenic-route sign sits beside the actual western branch.

Cannon 0.6 vehicle poses are captured before each simulation step and interpolated
for the chassis and wheels. Simulation/visual updates finish before camera follow
and shadow updates; camera placement and composition then render that same frame.
The first-person camera uses the presented chassis pose as well. Respawns reset
the saved orientation to prevent an old rotation blending into the new position.

In Original view, left-drag pans without changing the angle, right-drag rotates,
and scroll zooms. Touch uses one finger to pan and two fingers to pan/zoom. Mouse
exploration remains available at all times. Horizontal motion (including coasting
and reversing) automatically restores tracking with a 650 ms eased camera return.
An active mouse gesture temporarily takes priority; releasing it resumes follow
if the car is moving. Parked exploration retains its framing. Small speed
tolerances and a 300 ms stop delay ignore suspension drift and avoid rapid mode
switching. Top-view drags accumulate independently; Fit map/Focus car remain
explicit. First-person stays mounted to the car.

## Validation

### Desktop gateway and navigation pass — 8 October 2026

The optional world now includes a locally authored Blender research gateway at
(37, -38). `scripts/assets/create-research-gateway.py` rebuilds the asset in an
owned Blender scene, preserving unrelated scenes. Its GLB is 322,896 bytes,
8,556 triangles and four material groups, with no image textures. It loads when
visible or within 35 m. Two support colliders sit beyond the paved corridor;
the elevated lintel leaves the driving opening clear. A browser driving check
crossed the opening from x=34 to x=42 without collision.

Research rows now have restrained district tints, conforming forecourts and
three chapter labels. Fine road dashes reuse the existing mask's blue channel.
The 39 added grove trees reuse the original tree geometry with matcap shading
and gentle, reduced-motion-aware crown movement. The rendered grove shader was
checked in production after correcting negative-bound GLSL interpolation.

`WorldNavigator.js` adds a static SVG road map with a 10 Hz car marker, live
location and a session-only 16-stop exploration counter. Browser validation
confirmed entering a project pad changes 0 to 1. Nearby project stories link
back to the portfolio. Keyboard/touch cancellation safeguards release held
actions after focus loss. The production build and 55 tests pass.

The desktop terrain/vegetation follow-up is specified in
`driving-environment-next-pass.md`. Mobile work is deferred per the latest scope.

### Earlier landscape baseline

- Production build and production-output audit pass; no browser console errors.
- 39 tests pass, including 150 independent Cannon raycasts against the rendered
  surface, protected foundations, meaningful internal ridges, road grades, route
  connectivity, canopy clearance and original-tree visual/collider relocation.
  New regression coverage checks ground depth, reveal ownership, independent
  shadow textures, whole-footprint shadow conformity, junction fillets and pad
  clearance, live instruction opacity ownership, vehicle presentation between
  physics steps, journey-sign clearance and simulation-to-render ordering.
  Camera regression tests exercise real OrbitControls pointer gestures, retained
  parked framing, automatic tracking during motion/coasting/reversing, small
  suspension drift, repeated perspective/top panning, unchanged left-drag angle,
  mouse priority during motion and click-only follow.
  A production browser audit finds no visible near-ground flat mesh
  without depth bias; original, top and first-person camera views were checked.
- Suspension settles with all four wheels grounded at all twelve project stops,
  four profile stops and three ridge samples. An acceleration check maintained
  contact for 180 sampled frames. These are browser/physics checks, not a claim
  of a completed manual lap on every device.
- A 120-frame production driving check keeps the car visible, with no repeated
  positions and the camera target aligned to the presented chassis. A separate
  90-frame first-person check confirms consistent camera height during motion.
  Starting instructions and journey signs were visually checked in production.
- A browser collision sweep checks 4,105 positions across the complete pavement
  and shoulders, not just centre lines. No static obstruction remains. The sweep
  caught a social-icon pedestal at the Information shoulder; that approach now
  uses the narrower 3.2 m entrance road. Original playground ramps are preserved
  and approached through the clear eastern entrance.
- Mobile checks at 390 × 844 show no horizontal overflow, 44 px camera controls
  and working profile navigation. Physical touch-device testing remains separate.
- Full-map baseline: 1,397 aggregate draw calls, approximately 480k triangles,
  625 geometries and 289 physics bodies. Production top view now measures 760
  aggregate draw calls, 532,220 triangles, 452 geometries and 205 bodies, with all
  supplied models loaded. The preceding road revision had 512,318 triangles and
  299 geometries; conforming independent shadows add modest geometry while
  retaining the same draw-call count. Terrain adds geometry while static batching cuts draw
  calls. Removing the separate road ribbons eliminates approximately 30k triangles
  from the preceding landscape revision. FPS varies with GPU and viewport.
- The inherited optional-world bundle remains large (~356 KB gzip). This change
  adds no dependency or external asset requirement; normal portfolio visitors do
  not download it. Production output remains approximately 50.73 MiB.

## Changed source areas

New: `World/Landscape.js`, `World/LandscapeLayout.js`, `tests/landscape.test.js`.

Focused edits: `World/index.js`, `World/Physics.js`, `World/Objects.js`,
`World/Shadows.js`, `World/Scenery.js`, project placement/image loading,
Information/Profile paths, directional signs, hidden interaction location,
`Camera.js`, `Application.js` and the boundary status in `DrivingInterface.js`.
`public/driving-world/` remains generated output, not an editable source folder.
