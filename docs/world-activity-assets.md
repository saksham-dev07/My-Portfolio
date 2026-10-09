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
