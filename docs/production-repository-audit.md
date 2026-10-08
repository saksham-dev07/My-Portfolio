# Production repository audit

Audited 8 October 2026. Existing uncommitted narrative/style edits were preserved.

## Canonical file tree

```text
My-Portfolio/
├── .github/workflows/ci.yml          # Linux production validation
├── api/send.js                      # Single contact function
├── src/
│   ├── main.jsx                     # React entry
│   ├── App.jsx                      # Professional portfolio
│   ├── PortfolioRouter.jsx          # Lazy world/lab/404 routes
│   ├── assets/                      # Imported images, badges, vector icons
│   ├── components/                  # Sections and shared UI
│   │   └── interactive/             # Active interactive experiences
│   ├── constants/                   # Profile/project/credential content
│   ├── context/                     # Theme and role contexts
│   ├── data/                        # Project blueprints
│   ├── experience/DrivingWorld.jsx  # Same-origin world wrapper
│   ├── lab/                         # Deferred lab route and experiments
│   ├── styles/                      # All 12 active stylesheets
│   └── utils/                       # Motion, discovery, terminal, return state
├── public/
│   ├── desktop_pc/                  # Active workstation and decoder licences
│   ├── portrait/                    # Active model and downloadable photograph
│   ├── resume.pdf
│   ├── 404.html                     # Static hosting 404
│   ├── robots.txt, sitemap.*, llms.txt, logo.svg, og-image.jpg
│   └── driving-world/               # Generated; ignored, never edit
├── experiments/saksham-driving-world/
│   ├── src/                         # Standalone Three.js world
│   ├── static/                      # Models, audio, project images, licences
│   ├── tests/                       # Layout, navigation and circuit checks
│   ├── references/                  # Authored design reference, kept out of CLI uploads
│   ├── package.json, bun.lock, vite.config.js
│   └── readme.md, README-SAKSHAM.md, license.md
├── scripts/
│   ├── build-world.mjs              # Reproducible world publishing
│   ├── audit-production.mjs         # Checks build output
│   └── assets/prepare-portrait-model.mjs
├── tests/                           # Contact, discovery and terminal tests
├── docs/                            # Design/provenance and maintenance records
├── index.html, package.json, bun.lock
├── vite.config.js, postcss.config.js, tailwind.config.cjs, biome.json
├── vercel.json, .vercelignore, .gitignore, .gitattributes, .env.example
└── README.md
```

Local-only directories (`node_modules/`, `dist/`, `.local-history/`, `.agents/`) remain ignored. Backups and upstream history were preserved; they are not production source. Both independent lockfiles and Three.js versions remain because the React/R3F viewer and adapted vanilla world use different APIs. This is one Vercel project, not two deployments.

## Moves

- All active root-level `src/*.css` files moved into `src/styles/`, with import paths updated. File names, cascade order, and lazy style boundaries are preserved.
- `scripts/prepare-portrait-model.mjs` moved into `scripts/assets/`. It is a manual asset-preparation tool, not a build dependency. It still expects Meshoptimizer and Sharp as described in the portrait asset notes.

## Removed in this audit

Import reachability was traced from `src/main.jsx`, including lazy imports and barrel exports, then checked against callers, tests, and documentation. Removed 24 files totaling 1,180,746 bytes (1.13 MiB):

- `src/components/canvas/{CanvasErrorBoundary,Computers,Stars}.jsx` and its `index.js`: superseded by the active deferred workstation/portrait viewers.
- `src/components/index.js`, `src/components/Loader.jsx`: unused legacy barrel and loader.
- `src/components/interactive/{CursorTrail,DodgeButton,KonamiCelebration,MoodSwitcher,PhysicsSandbox,SentinelObserver,SoundToggle}.jsx`: no active imports. The current BuildPlayground gravity demo, terminal, drawing, signal and portrait interactions remain.
- `src/constants/moods.js`, `src/hoc/{index.js,SectionWrapper.jsx}`, `src/index.css`, `src/styles.js`, `src/utils/{cn.js,motion.js}`: unused old styling and animation layer.
- `src/context/{ArcadeContext,SoundContext}.jsx`: mounted providers with no active consumers. Their wrappers were removed from App; world audio retains its own explicit sound control.
- `public/portrait/saksham-bust.glb` and `scripts/create-portrait-bust.mjs`: superseded procedural face and generator. The supplied active portrait GLB, original Downloads files, and full-resolution downloadable portrait remain.

Removed five unused direct dependencies: `clsx`, `framer-motion`, `lenis`, `tailwind-merge`, `vite-plugin-compression2`. Updated the root Bun lockfile. R3F, Drei, Three.js, React Icons, Tailwind and the contact dependencies remain in use.

Generated compression sidecars are no longer created. The clean build replaces previous generated output; no source maps are published. This audit is additional to the earlier 49-file cleanup documented in `repository-integration-audit.md`.

## Production configuration

- Explicit Vite preset, frozen root/world installs, combined build, `dist` output, Node 22, and a ten-second contact function budget. No paid add-ons, database, cron or server-side 3D processing introduced.
- The contact function excludes frontend/world assets and documentation from its bundle. The API key stays server-only. Existing validation, honeypot and best-effort throttling remain; throttling is per function instance, not a durable distributed guarantee.
- Immutable caching applies to hashed root/world bundles. Unversioned workstation, portrait and world assets revalidate to prevent year-long stale model updates.
- `.gitignore` protects all environment variants except `.env.example`, build output, Vercel metadata and local instructions. `.vercelignore` excludes redundant CLI build inputs, local history, secrets and reference material. Active source assets and required licences remain available to builds.
- GitHub CI pins Bun 1.4.0 and Node 22, installs both frozen locks, checks source, runs all tests, builds both applications and audits output. `.gitattributes` normalizes text to LF and marks binary assets correctly. No instructions, credentials, generated assets or dependencies are staged or pushed.

## Measurements and validation

- Before: 326 deployment files, 50.13 MiB.
- After: 271 files, 47.06 MiB; 55 fewer generated files, 3.07 MiB smaller output.
- Largest asset: `driving-world/saksham/models/vit-bhopal.glb`, 10.63 MiB.
- Frozen installs, source checks, combined production build and all 17 tests pass. `audit:production` checks required portfolio/world entries and rejects maps, compression duplicates, environment/instruction files and individual oversized assets. It checks file names, not secret contents.
- Active world remains optional and deferred. Preview entry/exit and UI smoke checks are verified separately from Vercel production headers and function packaging.

## Hobby considerations

Vercel Hobby supports personal, non-commercial projects and currently includes 100 GB/month Fast Data Transfer and 1,000,000 CDN requests. Those are account usage limits, not guarantees from a repository cleanup. Large optional 3D assets can still consume bandwidth; the campus model remains the largest asset. Review actual usage after deployment. [Hobby documentation](https://vercel.com/docs/plans/hobby)

Vercel automatically negotiates gzip/Brotli for supported MIME types, so precompressed duplicates are unnecessary here. This does not imply GLBs are automatically compressed by the CDN. [Compression documentation](https://vercel.com/docs/how-vercel-cdn-works/compression)

The documented 100 MB Hobby CLI limit applies to uploaded source files, not a universal 100 MB deployed-output cap. The audit's individual-asset guard is a conservative repository guard; it does not substitute for checking CLI source size or account quotas. Prefer Git integration with the repository root. [Limits documentation](https://vercel.com/docs/limits)

Deployment was not performed. Live rewrite/header behavior, function packaging, configured API key and Resend sender delivery must be verified on the actual Vercel deployment. Resend has its own usage and sender-domain requirements independent of Vercel.
