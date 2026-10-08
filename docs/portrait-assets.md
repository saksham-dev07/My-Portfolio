# Portrait and 3D likeness

Created 6 October 2026 for the portfolio's existing studio design.

## Assets

- `public/portrait/saksham-studio.png`: full-resolution 1024 × 1536 generated studio portrait, retained as a downloadable source image.
- `src/assets/profile-studio.webp`: web-optimized version of the portrait, used in the hero and About section. The original `profile.webp` remains available.
- `src/assets/models/saksham-model.glb`: the supplied textured 3D portrait, optimized for the active viewer. The source is `b18fea1e-997d-4691-aba2-e8a4296b4b2e_2.glb`; the Downloads file remains untouched. Model provenance beyond the supplied file is unspecified.

The supplied Google Photos gallery was inspected for visible appearance and available views, including frontal portraits, selfies, and the profile views visible in the gallery. The existing high-resolution profile asset provides the main reference for the generated portrait. This does not represent an exhaustive inspection of every photo or every possible angle.

## Supplied model preparation

`scripts/assets/prepare-portrait-model.mjs` simplifies the static mesh while weighting normals and texture coordinates, compacts its vertex buffers, and resizes the three embedded textures to 2048 pixels. JPEG textures use 4:4:4 sampling and high quality; the original material is opaque. The geometry, material assignments, UVs, and embedded normal/base-color/metallic-roughness maps remain in a standard GLB, with no extra decoder required.

The source contains 500,000 triangles and 290,074 vertices in 52,654,796 bytes. The prepared file contains 87,472 triangles and 62,218 vertices in 5,093,308 bytes (90.3% smaller). Geometry simplification's normalized error is 0.0009765. These are lossy optimizations; the source is available for future higher-detail exports. The supplied textures retain their original color treatment, including edge highlights on the clothing.

Run `bun scripts/assets/prepare-portrait-model.mjs <source.glb> <output.glb> [sharp-module-path]` with Meshoptimizer and Sharp available. The viewer fits the model's world bounds to its camera and preserves the source's front-facing orientation. Neutral key light and blue/violet rim lights match the updated portfolio palette.

## Generation

The built-in image generation tool was used with `src/assets/profile.webp` as its primary identity reference. The generation prompt follows below. The portrait retains alpha transparency and softly colored edge lighting. WebP encoding reduces it from 2.3 MB to 235 KB without changing its composition.

```text
Use case: identity-preserve. Asset type: high-resolution photographic portrait cutout for Saksham Agarwal's personal software-engineering portfolio. Input image 1 is the primary identity reference; preserve this person's actual recognizable facial proportions, warm medium skin tone, dark eyes, short black side-swept hair, thin silver metal glasses with a double bridge, natural narrow moustache and short chin/jaw facial hair. Create a refined, authentic editorial studio head-and-upper-torso portrait of the SAME person, upright at eye level, a very slight three-quarter turn, relaxed confident expression and a subtle closed-mouth smile. Dress him in a simple premium dark charcoal crewneck shirt. Keep the entire hair and both shoulders comfortably within the frame, portrait 2:3 composition, subject centered, space above hair and below chest. Soft flattering neutral key light with a very restrained lime edge light and violet rim light, believable skin texture, crisp glasses without reflections hiding the eyes, natural anatomy. Transparent background, no room or props, no text, no logos, no watermark. Do not change his identity, face shape, age, nose, eyes, or facial hair into an idealized generic model. Keep the image photographic rather than illustrated.
```

## Portfolio interaction

Choose **The human** to open the supplied model in **In 3D**; **Portrait** switches to the studio photograph. The 3D view is lazy-loaded and has pointer/touch orbit controls, arrow-key rotation, Home/reset, an optional slow rotation, wireframe mode, and a GLB download. Automatic rotation stops offscreen or in a hidden tab and respects the site's motion switch and operating-system reduced-motion preference. Manual exploration remains available. A portrait fallback and retry are provided when WebGL is unavailable.

The original 3D workstation remains the default hero experience. No external avatar service or paid reconstruction service is used.

The mesh exporter uses [Three.js GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html), with geometry-based [curves](https://threejs.org/docs/pages/TubeGeometry.html) for frames and hair ridges. The GLB can be opened in a compatible 3D editor for further sculpting.
