# Saksham's Driving World

A personal driving world built on an inherited MIT-licensed runtime, revision `540f13573a6da282eae942a4c67335b97cd18970`. Driving, physics and rendering still contain inherited code; the original copyright and permission notice are retained in `license.md` and copied into deployment. The visible identity, environment, projects and activities are personalized.

## Run

Use Bun: `bun install`, `bun run dev --port 4180`, `bun run build`, or `bun run preview --port 4180`.

This is the source application embedded by the portfolio at `/world`. From the repository root, `bun run build:world` publishes it into the generated, Git-ignored `public/driving-world/` directory. The root build and dev scripts run that step automatically. Exit links return through the parent wrapper when embedded and to `/` when standalone. Preserve the source assets and MIT licence.

## Personalized content

- All 12 project exhibits use Saksham's existing project data, screenshots and source/demo links.
- Accessible HTML project index includes descriptions, source/demo links, and quick travel. Driving is optional.
- World Map also includes Skills Garage, Education Trail, Highlights, and About Saksham. Four lightweight landmarks connect to the existing roads; click their OPEN DETAILS areas or use the map to read verified personal details and quick-travel.
- Skills are grouped by purpose with source links to real projects. Education includes VIT Bhopal and school results; highlights cover FinTech Club leadership, CodeVita, and Gridlock. Personal content lives in `src/javascript/sakshamProfile.js`.
- World areas resolve click/tap positions immediately and ignore drags, preventing missed interactions from stale hover positions.
- Skills uses the supplied PC desk; Highlights uses the custom Blender brass trophy podium. Education uses Saksham's supplied VIT Bhopal campus (Meshy AI GLB). About uses the original portrait from the main portfolio. All four artworks load near their stops, when visible from a panned camera, or when selected in World Map. They are deferred at entry. Roads detour around the solid landmarks to reach the entry pads.
- Imported models retain their textures and triangle counts, normalize from Y-up to Z-up, and use coarse occupied-footprint compound colliders. Neutral hemisphere/key/fill lights, nonmetallic skin and controlled specular make portrait and campus details readable. No extra shadow maps or HDRI downloads are added. Entry pads remain clear.
- Parking inside a section outline enables Enter/E/F and a touch-friendly Enter button. Keyboard entry checks the car's actual position independently of hover. Enter cancels native button activation so the newly focused dialog Close button does not immediately dismiss it.
- The starting ground label shows Saksham Agarwal, Software / Applied AI, and VIT Bhopal / Class of 2027.
- About activities, GitHub, LinkedIn, email, résumé, page metadata and identity are personalized.
- No original project awards are attached to Saksham's projects. The unused promotional popup and analytics are removed.
- Green campus landscape with sandstone/brass/forest HUD, bounded DPR (1.25 touch, 1.5 desktop), sound on by default at entry and reduced-motion camera-angle transitions. Drive controls collapse at entry; the sound toggle remains visible, with M as its shortcut. H sounds the horn when the world canvas is focused.
- Keyboard world controls ignore dialog/form/button interactions. Quick travel clears vehicle velocity and restores focus to the canvas. Original touch controls remain available on touch devices.

Project content lives in `src/javascript/sakshamProjects.js`; screenshots and résumé are in `static/saksham/`. World labels use CanvasTexture, avoiding a font-model download.

## Supplied model credits

The GLBs in `static/saksham/models/` preserve their embedded creator/license metadata. World Map includes visible source links and credits. Their licenses are separate from the engine's MIT license:

- Stylized Hacked PC by ottobite: CC BY 4.0; 29,962 triangles / 921,872 shipping bytes.
- Highlights podium: custom Blender design, 3,600 triangles / 218,160 bytes. The historical imported podium is no longer used.
- VIT Bhopal campus supplied by Saksham: Meshy AI asset, 137,180 triangles / 2,845,944 shipping bytes. Face portrait supplied by Saksham: 87,472 triangles / 1,995,564 shipping bytes.
- Flag of India by alakeshkakati125: CC BY 4.0; 4,296 triangles / 350,708 shipping bytes. Embedded source/creator metadata is preserved.

Adaptations are scale, orientation, material response, ground-contact shading, and simplified physics proxies. No original author claims are replaced with Saksham's name.

## Asset preparation and loading

`bun run assets:world` regenerates the four compressed landmarks from the ignored `.local-history/landmark-sources/` authoring copies. A new checkout can supply its own original-model folder: `bun run assets:world C:/path/to/original-models`. The compressed GLBs and `landmark-assets.json` are shipping inputs; Vercel builds do not rerun asset encoding. Geometry uses Draco with 16-bit positions/UVs and 12-bit normals. Textures retain their dimensions and decoded pixels; lossless WebP is used only where smaller than the original. No simplification is performed.

One shared fetch queue prioritizes core assets and explicit destinations, then visible optional art and screenshot boards. It allows four transfers (two on 2G/save-data connections) and one shared Draco loader with two workers. Core failures get one automatic retry, then a Retry loading button; successful files are kept. Failed optional landmark URLs can be retried from World Map. Hashed optimized GLBs and Vite decoder/font assets have immutable Vercel caching; other unversioned art revalidates.

Audio waits for the Enter gesture, then starts on by default. Enabling sound explicitly loads the engine, resumes its audio context during the input gesture, and queues one playback. Effects load on first use. No MP3 is requested during boot.

## Validation

Visibility regression: leave the car at the start and pan the camera toward About/Education. Landmark loading now checks the camera frustum as well as car proximity, so visible pads do not remain empty. Selecting the corresponding World Map section also loads its model (or retries a failed request). Concurrent downloads report their progress independently; finishing one does not hide the other's status. Normal world entry still defers both models when they are outside the view.

Production build and tests pass. Required Resources.js paths exist. Current browser validation covers entry, retry recovery, map navigation, deferred artwork, camera controls, engine and horn playback. The inherited rendering bundle remains substantial (~380 KB gzip), so this is still a separate opt-in world. No low-end-device frame-rate claim is made.

Large Blender authoring files and original project artwork were excluded from the sparse download. Essential runtime assets and source were retained. The old authoring files remain available in the upstream repository if further asset redesign is needed.

## Camera views

After entering the world, use Camera to switch between Original view, Top view, and First-person car. Top view opens on the complete map; drag to inspect another area, scroll or pinch to zoom, Fit map to reset the overview, and Focus car for a closer overhead view. World Map travel centers the destination in Top view. First-person uses a forward-mounted camera aligned to the car heading with a stable horizon. Original view restores its previous zoom. Map and first-person views disable tilt-shift blur; no additional assets or dependencies are required.


## Lower district

The profile district reuses original trees, shader materials and merged brick garden edges to frame the supplied landmarks. Benches, giant frames, plaza slabs and decorative posts have been removed. The eastern clearing contains a ten-brick physics experiment with a REBUILD interaction; education milestones remain clickable. Static scenery shares one collision body. Regression checks protect interaction pads, road corridors and the original wall/reset integration. No new model downloads or dependencies are required.
