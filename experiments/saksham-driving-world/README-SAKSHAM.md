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
- Skills and Highlights use the supplied PC desk and trophy podium. Education uses Saksham's supplied VIT Bhopal campus (Meshy AI GLB), replacing the open book and fictional Blackwell scene. About uses the exact original portrait from the main portfolio, replacing the temporary arch. Campus and portrait load only near their respective stops; neither is downloaded at world entry. Roads detour around these solid landmarks to reach the entry pads.
- Imported models retain their textures, normalize from Y-up to Z-up, receive two shared lights, and use coarse occupied-footprint compound colliders. These are simplified collision proxies rather than exact triangle colliders. Entry pads remain clear. Profile camera framing widens on arrival and uses a centered portrait angle on mobile.
- Parking inside a section outline enables Enter/E/F and a touch-friendly Enter button. Keyboard entry checks the car's actual position independently of hover. Enter cancels native button activation so the newly focused dialog Close button does not immediately dismiss it.
- The starting ground label shows Saksham Agarwal, Software / Applied AI, and VIT Bhopal / Class of 2027.
- About activities, GitHub, LinkedIn, email, résumé, page metadata and identity are personalized.
- No original project awards are attached to Saksham's projects. The unused promotional popup and analytics are removed.
- Violet / periwinkle environment, bounded DPR (1.25 touch, 1.5 desktop), muted default audio and reduced-motion camera-angle transitions.
- Keyboard world controls ignore dialog/form/button interactions. Quick travel clears vehicle velocity and restores focus to the canvas. Original touch controls remain available on touch devices.

Project content lives in `src/javascript/sakshamProjects.js`; screenshots and résumé are in `static/saksham/`. World labels use CanvasTexture, avoiding a font-model download.

## Supplied model credits

The GLBs in `static/saksham/models/` preserve their embedded creator/license metadata. World Map includes visible source links and credits. Their licenses are separate from the engine's MIT license:

- Stylized Hacked PC by ottobite: CC BY 4.0; approximately 30k triangles / 2.1 MB.
- Trophy podium by Anilz: Sketchfab Standard; approximately 1.1k triangles / 89 KB.
- VIT Bhopal campus supplied by Saksham: Meshy AI asset; approximately 137k triangles / 11.1 MB. Original face portrait supplied by Saksham: approximately 87k triangles / 5.1 MB. Originals remain untouched; served copies preserve embedded metadata.

Adaptations are scale, orientation, material response, ground-contact shading, and simplified physics proxies. No original author claims are replaced with Saksham's name.

## Validation

Visibility regression: leave the car at the start and pan the camera toward About/Education. Landmark loading now checks the camera frustum as well as car proximity, so visible pads do not remain empty. Selecting the corresponding World Map section also loads its model (or retries a failed request). Concurrent downloads report their progress independently; finishing one does not hide the other's status. Normal world entry still defers both models when they are outside the view.

Production build passes. All required Resources.js paths exist. Browser validation covers loading, entry, 12 project entries, quick travel, screenshot boards, source/demo targets, start-line return, dialog keyboard closure, default mute and mobile layout. The inherited rendering bundle is substantial (~306 KB gzip), so this remains a separate opt-in world. No low-end-device frame-rate claim is made.

Large Blender authoring files and original project artwork were excluded from the sparse download. Essential runtime assets and source were retained. The old authoring files remain available in the upstream repository if further asset redesign is needed.

## Camera views

After entering the world, use Camera to switch between Original view, Top view, and First-person car. Top view opens on the complete map; drag to inspect another area, scroll or pinch to zoom, Fit map to reset the overview, and Focus car for a closer overhead view. World Map travel centers the destination in Top view. First-person uses a forward-mounted camera aligned to the car heading with a stable horizon. Original view restores its previous zoom. Map and first-person views disable tilt-shift blur; no additional assets or dependencies are required.


## Lower district

The profile district reuses original trees, shader materials and merged brick garden edges to frame the supplied landmarks. Benches, giant frames, plaza slabs and decorative posts have been removed. The eastern clearing contains a ten-brick physics experiment with a REBUILD interaction; education milestones remain clickable. Static scenery shares one collision body. Regression checks protect interaction pads, road corridors and the original wall/reset integration. No new model downloads or dependencies are required.
