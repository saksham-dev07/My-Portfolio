# Desktop environment refresh

The driving world is plain Three.js 0.186 with Z-up coordinates and Cannon 0.6. The React portfolio hosts it in an iframe. Terrain rendering and physics share the same two-metre heightfield. Existing road definitions, signs, buildings, trophy, world map, input handlers and camera code are unchanged.

## Modules and ownership

All paths below are relative to `experiments/saksham-driving-world/src/javascript/World/`.

| New module | Responsibility |
| --- | --- |
| `EnvironmentConfig.js` | One desktop tuning object, including seed and reservations for the new parks/paths. |
| `FieldNoise.js` | Seeded random numbers and smooth value noise; no dependency. |
| `TerrainSurface.js` | Four meadow tones, pale yellow accents, soft dirt at verges/signs, a generated 128-square detail texture sampled at two scales. Existing road paint is applied afterward. |
| `ScatterSampling.js` | Bridson Poisson-disc sampling with a spatial hash. |
| `MeadowScatter.js` | Exact road-segment bucket checks, exclusion footprints, noise-clumped grass and three-to-five-member prop clusters. |
| `MeadowEnvironment.js` | Instanced grass, flowers, grove trees and props; shader wind, distance fade, chunk culling, warm directional/hemi lighting, deferred asset loading and disposal. |
| `MeadowParks.js` | Two pocket parks, paths, benches, low fence, flower border and small animated fountain. |

Existing integration files changed: `Landscape.js`, `LandscapeLayout.js`, `EnvironmentLayout.js`, `WorldBackdrop.js`, and `../Application.js` (new module teardown only). `TerrainPalette.js`, road modules, camera/input/physics handlers, signs, buildings, trophy and map code were not edited for this refresh. Earlier unrelated work already present in the working tree was retained.

The hill layer adds at most the configured height in lowlands. It fades to zero around road corridors and existing foundations. Existing ridge road elevations stay exactly as they were. The new park foundations are level. Both displayed heights and wheel collisions use the same resulting heightfield, rather than a separately displaced visual plane.

## Tuning

Edit `EnvironmentConfig.js`, rebuild, and reload the world. Layout values are sampled once when the world starts.

| Value | Default | Effect |
| --- | --- | --- |
| `seed` | 18276 | Reproducible scatter and noise. |
| `grassDensity` | 1.1 | Requested meadow density, subject to exclusions and the cap. |
| `grassLimit` | 14000 | Maximum tuft count. |
| `flowerCount` | 240 | Small flowers outside the park borders. |
| `hillHeight` | 0.7 | Maximum additional lowland relief, in metres. |
| `treeCount` | 85 | Maximum newly sampled grove trees; clearance/spacing can reduce it. Preserved destination and shoreline trees are separate. |
| `treeSpacing` | 4.8 | Desired spacing, with a hard crown-clearance floor. |
| `patchScale` | 31 | Broad color patch size. |
| `detailStrength` | 0.07 | Fine ground detail contrast. |
| `grassWind` | 0.035 | Tip sway amplitude, in metres; roots remain fixed. |
| `grassViewDistance` | 100 | Smooth grass fade distance. |
| `grassBorderBias` | 0.65 | Fraction of grass candidates biased to road verges; lane and footprint exclusions still apply. |
| `grassChunkSize` | 32 | Spatial batch size; smaller cells cull more tightly but add draws. |
| `fogDistance` | 480 | Inverse exponential fog density. Horizon color stays coordinated with the existing sky. |
| `sunIntensity` / `ambientIntensity` | 0.85 / 1.05 | Warm directional and soft hemisphere lighting. |
| `parks` / `parkPaths` | Two fixed safe sites | Additional park and approach reservations. Do not move them onto existing roads or landmarks. |

## Evening refinement from the supplied video

The 34-second reference was inspected at representative shoreline, playground and road frames. Its cohesive blue-violet illumination, warm local lights and dense planting informed the new evening direction. Existing layout, vehicle, camera, controls and map are preserved.

- `DuskLighting.js` composes world-space evening shading with the existing road, matcap, wind and paving shaders. Lamp pools use a fixed uniform array instead of dynamic point lights. Mapped text remains brighter; transparent shadow decals retain their original behavior.
- `EveningEnvironment.js` reuses the existing Blender `lamp` prototype from `refined-props.glb`. Fifteen lanterns have frosted glowing windows and one instanced billboard halo batch; three lanterns were already in the world. New lamps sit in clear park corners, beside About, and in verified empty planting gaps. Eight thin district inlays follow the existing paving edges. No extra GLBs, textures or dependencies were required.
- `MeadowScatter.js` now biases 65% of candidates to actual, length-weighted road verges. Grass is larger and capped at 14000 tufts, with full destination, sign, road and lantern-foot exclusions.
- `EnvironmentDressing.js` deepens existing tree/outcrop contact shadows. `WorldBackdrop.js` coordinates dusk sky, fog, moon and water shimmer. `World/index.js` and `Application.js` own setup and teardown.

The controls now use a brighter cinematic afternoon default: `dusk.strength` (0.55; zero disables styling), `dusk.exposure` (1.08), `dusk.shadowFill` ([0.72, 0.80, 0.98]), `dusk.sunKey` ([1.15, 1.06, 0.90]), `dusk.lampStrength` (0.8), `dusk.accentStrength` (0.5), `dusk.horizon`, `dusk.zenith` and `dusk.water`. Existing grass and fog controls remain in the same config object. Rebuild/reload after edits.

`tests/evening-environment.test.js` verifies safe placements, grass clearance around lamps, deferred shader composition, geometry preservation, teardown and late asset responses.

The default accepted layout has 7000 six-triangle tufts, 240 scattered flowers, 34 grove trees in four variants, 37 clustered props, and two parks. Source assets/geometry are shared. Grass and flowers use spatial batches; distant grass fades, and hidden tabs stop new wind-clock work. No per-frame scatter or per-object model loads occur. Existing soft, terrain-conforming contact shadows are reused for groves.

## Blender assets

New combined runtime asset: `experiments/saksham-driving-world/static/saksham/models/environment-refresh.glb` (64920 bytes, one vertex palette, no images). Named assets: `tree-round`, `tree-pine`, `tree-bushy`, `tree-small`, `rock-0`, `rock-1`, `rock-2`, `bush`, `grass`, `flower`, `log`, `stump`, `bench`, `fountain`, `fence`.

The most detailed new asset has 224 triangles. Grass has six. Pivots are at ground/base centre; glTF Y-up is baked to the world's Z-up convention at load. No existing model was overwritten. First-tree preview: `static/saksham/models/meadow-tree-preview.glb` (10648 bytes); its grounded 4.8 m height was checked against the existing broadleaf asset before producing the full kit.

Editable new Blender sources are saved locally in `.local-history/blender-models/meadow-preview.blend` and `meadow-environment.blend`. Existing Blender scenes were preserved; each authoring pass created a separate scene. Reproduction scripts: `scripts/assets/create-meadow-assets.py` (run through the connected Blender MCP) and `scripts/assets/optimize-meadow-assets.mjs` (Bun/glTF Transform). No new dependencies were added.

## Verification

New tests: `experiments/saksham-driving-world/tests/environment-refresh.test.js`. They cover asset budgets/pivots, unchanged protected road cells, level foundations, deterministic scatter, road/label exclusions, Poisson spacing, prop cluster counts, actual paving-versus-grass raycasts, instanced ownership and disposal. Existing Cannon triangle raycasts and camera/input tests also pass.

Commands: `bun run test:world`, `bun run build:world`, `bun run check`, `git diff --check`. Runtime localhost checks found zero console errors/warnings and zero failed shader programs. The pre-existing Vite large-chunk advisory remains; it was not hidden or turned off.

One warm rendering benchmark at 1600 x 831 pixels measured 7.65 ms/frame with the new vegetation hidden and 8.99 ms/frame with it shown (34 additional visible draws). This is a local measurement, not a universal laptop guarantee. The added layer fits a 60 fps budget on this host. A keyboard-handler smoke test drove about 9.7 m and braked to 0.106 m/s, with the chase camera correctly behind the car and its ground height stable. QA camera changes stayed in a temporary browser tab; saved progression/settings were restored before cleanup.

Final evening verification: `bun run test:world` passed 204 tests across 47 files; `bun run build:world`, `bun run check`, and `git diff --check` passed. The existing Vite >500 KB bundle advisory remains. The actual browser scene had no console warnings/errors and no failed shader programs. Keyboard-handler smoke test drove 9.66 m and stopped to 0.106 m/s. A warmed GPU-completed overview at 1600×900 measured 13.78 ms/frame, 360 draws and 716750 triangles on this host; this is not a universal laptop performance guarantee. Temporary inspection camera/storage state was restored and test tabs closed.

## Brighter portfolio lighting and optimization check

Replaced the strong purple night tint with warm directional highlights, cooler blue shadow fill, modest exposure lift and a gentle highlight shoulder. Sky, horizon, water and the existing glow pass now agree with that brighter palette. Geometry, landmark positions, driving, camera, controls and map remain unchanged.

Optimizations in `DuskLighting.js`: normalize the surface normal once per pixel, cache each lamp's inverse squared radius, and skip facing/lighting calculations outside that lamp's pool. `EveningEnvironment.js` no longer allocates a one-element array for every single-material mesh on each discovery scan. Existing instancing, grass distance fades, shared GLB cache, priority asset queue and disabled zero-strength blur passes were inspected and retained. No dependencies, textures or heavier render passes were added.

At an identical overview angle and 1600×831 drawing buffer, five warmed samples of 12 GPU-completed render frames had a median of 10.375 ms before and 9.642 ms after. Both scenes rendered 360 draws and 716750 triangles, with 88 GPU textures. This is a render-only comparison on this host, not a universal frame-rate guarantee. The loaded scene issued 54 GLB requests for 54 unique URLs, with no duplicate GLB transfers. Browser shader failures and console warnings/errors: zero. Driving smoke test: 9.66 m driven, stopped speed 0.106 m/s, chassis height 0.286 m. Final world tests: 204 passed, 0 failed; build and check passed, with the pre-existing bundle-size advisory retained.

## Enter latency and ground-level spawn repair

The original Enter click built the entire world synchronously: measured 5021 ms on this host. The reveal and vehicle factory both placed the chassis at Z=12, causing the visible drop. An isolated terrain probe measured 2307 ms inside `Landscape.setRoads()`.

- `WorldPreparation.js` owns one staged preparation promise, yields between setup stages and waits for shader compilation/first render before readiness. `World/index.js` prepares during loading; Enter now only starts the prepared world and reveals its controls. Sections are constructed between yields, while the world remains behind the loading screen.
- `DrivingInterface.js` enables Enter on `worldReady`, rather than raw download completion. Preparation progress stays in the existing loading panel; failures offer reload. Audio still starts on the entry gesture.
- `RoadClearance.js` indexes nearby segments for bounded verge queries, preserving the original exact signed distance and analytic roundabout within the paint's fade radius. `TerrainSurface.js` uses it and caches its sign list. Road rendering, definitions, layout and physics are unchanged. The same terrain probe fell to 302 ms.
- `MeadowScatter.js` provides a yielding generator with the same seeded results. `MeadowEnvironment.js` prepares it in batches of 400 attempts before loading the instances, deduplicates concurrent preparation and stops on disposal. All 14000 grass instances remain. `Landscape.js` opts into this preparation path; `Application.js` marks teardown so pending stages stop.
- `Physics.js` creates the chassis at road surface + wheel radius + suspension rest length (Z=0.35 at the start). Reveal wakes it without moving it, and models no longer sink/rise for three seconds on entry. It settles to about Z=0.284 on the suspension. Reset uses the same grounded factory.

Regression checks cover real World readiness/Enter behavior, reveal without relocation, initial/reset vehicle height and interpolation history, cancellation/failure, exact verge distances, seeded asynchronous grass and teardown. Final suite: 211 passed, 0 failed, 48 files. Build, check and diff checks passed; existing bundle advisory remains.

The original click probe now passes at 23.9 ms and Z=0.35; a native Enter-key interaction measured 10.7 ms, also Z=0.35. There were no iframe long tasks in the first two seconds after that entry, no failed shader programs and no console warnings/errors. Driving/braking smoke: 9.66 m, stopped speed 0.106 m/s. These are host-specific startup checks, distinct from the earlier steady-state rendering benchmark.
