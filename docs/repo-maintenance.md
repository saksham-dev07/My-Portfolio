# Repository maintenance

Current cleanup baseline: 14 October 2026, starting from `cc14061`. This pass changes file ownership, dependency declarations and documentation; driving behavior, world layout and shipping models are preserved.

## Ownership and layout

```text
api/send.js                           Resend contact function
src/                                  React portfolio and lazy world/lab wrappers
  assets/                             Imported artwork, GLBs, fonts, responsive candidates
  components/interactive/             Interactive portfolio components
  constants/, context/, data/         Content and shared state
  experience/, lab/, styles/, utils/  Routes, presentation and helpers
public/                               Root static files and artwork/decoder licenses
experiments/saksham-driving-world/
  src/javascript/                     Three.js/Cannon world runtime
  src/shaders/, style/, fonts/, images/ World rendering inputs
  static/                             World models, sounds, screenshots and favicons
  tests/, README.md                   World regression suite and guide
  package.json, bun.lock, vite.config.js
scripts/assets/                       Blender authoring and Bun encoding scripts
scripts/build-world.mjs               Generate embedded world deployment
scripts/audit-production.mjs          Check published output
tests/                                Portfolio regression suite
docs/                                 Selected design and maintenance notes
.github/workflows/ci.yml              Frozen installs, check, tests, build and audit
```

Root stack: React 19, Vite 8, Tailwind 3, R3F/Drei and Three.js 0.176. The independent world uses plain Three.js 0.186 with Z-up coordinates, Cannon, GSAP and Howler. Keep both lockfiles and runtime versions; combining them is a separate compatibility change.

Edit the world under `experiments/saksham-driving-world/`. `public/driving-world/` and both `dist/` directories are ignored build output. The integration script publishes the world and copies its engine license and the root resume into the embedded deployment. The committed standalone resume and project screenshots support independent world builds; their matching root copies are intentional.

World favicon generation belongs to `static/favicon/`. The world HTML currently uses an inline SVG icon. There is no second source favicon folder to synchronize.

## Development and checks

Use Bun 1.4.0 and Node 22, matching CI. From the repository root:

```sh
bun install --frozen-lockfile
bun run install:world
bun dev
```

Use `bun run dev:world` for the standalone world with live source updates. Rebuild with `bun run build:world` when refreshing the embedded version. `bun run preview` serves the combined static production output after a build; it does not run the contact API.

```sh
bun run lint
bun run check
bun test
bun run build
bun run audit:production
```

`bun test` discovers both suites; `bun run test:world` selects the world tests. Install root and world dependencies even when testing only the world: its asset checks import the root glTF/Draco/Sharp tooling.

Biome checks root source, API, root tests and MJS scripts. It does not currently cover world runtime source, GLSL or Python. Expanding coverage requires a separate scoped review rather than a blanket formatting pass.

## Optional asset preparation

Committed optimized GLBs and responsive images are build inputs. A normal install/build does not regenerate them and needs neither Blender nor Python. Keep embedded model metadata, `public/desktop_pc/license.txt`, Draco licenses and the world `license.md`.

| Tool | Inputs and outputs |
| --- | --- |
| `bun run assets:optimize` | Source images in `src/assets/` -> responsive AVIF/WebP candidates and their manifest. Review visual fidelity and commit intended derivatives. |
| `bun run assets:world <original-model-folder>` | Original landmark GLBs -> world `static/saksham/models/optimized/` and asset manifest. Defaults to ignored `.local-history/landmark-sources/`. |
| `bun scripts/assets/prepare-portrait-model.mjs <source.glb> <output.glb>` | Supplied portrait -> optimized web GLB. Meshoptimizer 1.1.1 is an explicit dev dependency; Sharp is also required. Preserve the original. |
| Blender Python scripts in `scripts/assets/` | Run inside Blender with `bpy`, using their declared inputs and separate scene/export targets. Some depend on local editable scenes or baseline models. |
| Bun `optimize-*.mjs` scripts in `scripts/assets/` | Raw authoring GLBs -> shipping kits. Inspect each script's input/output paths before invoking. |
| `bun scripts/assets/update-world-favicons.mjs` | `public/logo.svg` -> the world `static/favicon/` set only. |

The ignored `.local-history/` directory contains editable Blender work, original landmark sources and intermediate exports used by authoring scripts. It is not a disposable dependency cache. A fresh checkout builds from committed shipping assets but cannot reproduce every authoring pass without those originals. Back up authoring files separately; do not remove them during repository cleanup.

The [environment notes](environment-refresh.md) describe terrain configuration, the combined meadow kit and earlier validation. Their measurements are host-specific historical observations.

## Hygiene and documentation

The root ignore file allows only these maintained documents: portrait assets, creative upgrade, design plan/references, discovery plan, historical production audit, bandwidth optimization, environment refresh, and this guide. Other local drafts remain ignored. Instructions and skills, environment files, credentials, dependencies, build output and CCE caches remain excluded. Never use a broad staging command to bypass those protections.

The cleanup removes 18 retired or redundant source files totaling 49,645 bytes, standardizes the world README name with `git mv`, and publishes selected documentation. It retains uncertain assets, type packages, original models, licensed decoders and authoring scripts. The asset dependency declaration reuses installed Meshoptimizer 1.1.1 without upgrading other resolved packages.

## Verification baseline and follow-ups

Before cleanup: 229 tests pass across 54 files; build, lint/check and the production audit pass. Deployment contains 366 files, 35.70 MiB, with the workstation GLB largest at 7.27 MiB. Source removals mostly do not enter deployment; documentation is excluded from production by the existing configuration. No meaningful runtime download reduction is expected from this hygiene pass.

Existing Vite advisories report large optional 3D chunks and occasional plugin timing. Preserve those warnings; bundle optimization is separate work. The targeted secret scan identified no committed credential needing rotation. This is not a guarantee about arbitrary credentials or every historical blob. Live Vercel headers, contact delivery and cross-device performance still require deployment validation.

Post-cleanup verification on 14 October 2026: both frozen installs, the Meshoptimizer authoring import, build, lint/check, all 229 tests and the production audit pass. Deployment remains 366 files / 35.70 MiB. Maintained Markdown links resolve, and runtime source, shipping models, static assets, physics, camera and tests match the baseline byte-for-byte. No instruction files or credentials are tracked.

A fresh production preview at a 1600 x 900 desktop viewport passed portfolio rendering, world loading/entry, forward driving, braking, world-map opening/closing, Top view switching and return to the portfolio. Browser warning/error logs were empty during that pass. The temporary preview tab was closed and its viewport override restored. This smoke test does not certify live contact delivery or universal frame-rate performance.
