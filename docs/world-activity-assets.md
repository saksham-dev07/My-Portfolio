# Curiosity Circuit activity assets

Initially generated and integrated on 10 October 2026 with the user-approved
Thrixel free balance. The chai cart was subsequently replaced by a custom
Blender design at the user's request. Project:
`03b2998c-2837-4d6d-8879-1283033f581f` (Saksham's Curiosity Circuit).
Text prompts only; the portrait reference was not uploaded. Shared
`world-style.md` guide: low-poly flat colours, forest green, teak, sandstone and
terracotta, metre scale, no ground planes or baked text.

Each Thrixel draft was inspected in the world and received a scoped refinement.
Free grouping merged static parts. The original cart was replaced in Blender:
the current model has a bowed cream/terracotta canopy, scalloped valance, spoked
wheels, teak grilles, brass urn/kettle, and six clay kulhad cups. The
ramp retains its two named top surfaces for collision checks and becomes one
render mesh on import. Every GLB is Y-up; runtime explicitly converts to Z-up.
No texture maps, Draco decoder, new dependency or core boot request was added.

| Shipping file under `experiments/saksham-driving-world/static/saksham/models/` | Source | Triangles | Bytes | Placement X/Y |
|---|---|---:|---:|---|
| `maidan-scoreboard.glb` | `9be7d836-22a0-401b-8c8f-c023a4442f16` | 308 | 31,844 | -43 / -24 |
| `campus-checkpoint.glb` | `4d70f0a0-7eac-4df3-9bc4-dc040fb4cd11` | 504 | 45,080 | 2 / -98.5 |
| `chai-cart.glb` | Blender: `scripts/assets/create-chai-cart.py` | 3,764 | 224,540 | -52 / -119, scale .85 |
| `ramp-deck.glb` | `22ba0766-2ee6-4b5a-ae8e-7eedc80b770d` | 160 | 11,052 | -54 / -44 |
| Total | | 4,736 | 312,516 | |

The four files total 305.2 KiB uncompressed and remain below the runtime's
5,000-triangle ceiling. Thrixel previously used 229 of the existing 250 free
cubes; 21 remained. The Blender redesign used no generation credits, upgrades
or paid purchases.

Runtime ownership: `World/ActivityProps.js`, four render geometries with a shared
world matcap, four static compound bodies, shared contact-shadow resources and
runtime canvas signs. Downloads are serialized after entry and requested only
when their regions come into view. Failed art downloads create no invisible
collisions and do not prevent the two activities from working. Dispose removes
owned bodies, GPU resources and event listeners.

The chai cart's explicit cabinet, counter, wheel, post and canopy proxies follow
the Blender source metres. Its counter opening stays clear; lettering uses a
single small runtime canvas. Real model bounds verify clearance from the garden
loop, pond, shelter and planted tree crowns. Ramp
collision heights are read from the two shipping surface nodes, with Cannon
raycasts checked across 30 positions. The arch opening is independently tested
with a vehicle-sized chassis.

The Highlights artwork was also replaced with a Blender-authored stepped
sandstone/emerald podium, hollow brass cup, symmetrical handles, laurel and
geometric plaques. `highlights-podium.glb` contains 3,600 triangles, 218,160
bytes, one mesh/material, no textures and four authored collision boxes. Its
position (30,-83), 5m runtime height and Highlights interaction (30,-94) remain.
`scripts/assets/create-highlights-podium.py` reproduces the editable design.

Raw generations and draft exports remain local and Git-ignored. Editable
`crafted-chai-cart.blend` and `highlights-podium.blend` files are saved in the
chat's visualization directory; the two source scripts are kept in the repo.
Only shipping GLBs enter the build. The original Thrixel cart submission
`ad72f1a4-5a82-4975-9ebc-544a15f30c3d` is historical provenance, not current art.

## Education chapter dioramas

`scripts/assets/create-education-chapters.py` creates three editable Blender
scenes in one shipping `education-chapters.glb`. Named meshes share one palette
material with normalized byte vertex colours; no image maps or decoder.

| Chapter | Geometry | Triangles | Placement X/Y |
|---|---|---:|---|
| 2020 / School | Classroom desk, chair, open book, pencil and chalkboard | 616 | -15 / -103 |
| 2022 / Science | Atom sculpture with three orbits, flask and lab notebook | 2,348 | -15 / -109 |
| 2023 / VIT | Campus gateway, laptop and notebook, marking college entry | 484 | -15 / -115 |
| Total | One GLB, 200,912 bytes (196.2 KiB) | 3,448 | |

Each grounded model occupies 2.2x2.8m, height 2.06–2.385m. Metadata contains
authored collision boxes and design facts. `World/Sections/EducationChapters.js`
defers the single download until the timeline enters the camera frustum,
validates all three models before installing geometry, then adds matching
colliders and contact shadows. Failure creates no invisible walls. Disposal
removes the listener, bodies, geometry, shared material and shadow texture.
The editable `education-chapters.blend` is in the chat visualization folder.

## Arrival courtyard and Maker Yard kit

`scripts/assets/create-courtyard-kit.py` authors the garage pergola and workshop
in Blender, then exports `courtyard-kit.glb` under the shipping model directory.
The scene uses metre scale, grounded geometry and structural collision boxes.
Static parts become two named meshes sharing one palette material with normalized
byte vertex colours. The export is 152,320 bytes (148.75 KiB), 2,544 triangles,
with no floor slabs, image textures, animation tracks or extra decoder.

| Named mesh | Design | Triangles | Compound proxies | Placement X/Y |
|---|---|---:|---:|---|
| `arrival` | Open garage pergola, sheltered bench, tool counter, helmet and wheel | 1,560 | 12 | 0 / 7 |
| `maker` | Teak workbench, three drawers, tools, blueprint, vice and spare bricks | 984 | 5 | 34.5 / -110 |
| Total | One shared GLB and material | 2,544 | 17 | |

The arrival and maker reservations are 10x4m and 2.8x2.6m respectively. The
pergola's front opens toward the car; its posts and rear furniture leave the
central departure corridor clear. The workbench occupies the eastern side of
the physics court, away from the wall approach and REBUILD interaction pad.
The root Blender scene remains editable in `courtyard-kit.blend`, kept with
the chat's visualization artifacts rather than deployment files.

`World/CourtyardProps.js` defers one download until the arrival or workshop
region enters the camera frustum after entry. It validates both designs and
proxy bounds before installing them, converts the Y-up shipping geometry to
the world's Z-up coordinates, and adds two static compound Cannon bodies.
Both models share the world matcap and runtime contact-shadow resources.
Failure installs no invisible collisions or stray shadows; disposal removes
the listener, bodies, geometry, material and generated shadow texture.

The Maker Yard's ten movable bricks are separate from this decorative kit.
`World/Sections/BrickWorkshop.js` reads their actual body positions at 10 Hz
for the current `MOVED` count, updating its two-sided runtime canvas only when
that count changes. Rebuilding reuses the original bodies and clears residual
motion and interpolation. The original intro static models and baked shadow
have been retired from shipping; one atlas is retained solely in the shadow
test fixture. This Blender pass used no generation credits or new dependencies.
