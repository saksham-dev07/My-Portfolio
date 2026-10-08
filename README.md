# Saksham Agarwal — interactive portfolio

A React portfolio combining selected engineering projects with small, working creative experiments. Built with Vite, Bun, Tailwind CSS, Lucide icons, and a serverless Resend contact endpoint.

## Explore

- Studio index: an illustrated, full-screen chapter menu with pointer and keyboard previews, an interruptible curtain transition, focus containment, and direct résumé access. One adaptive menu serves desktop and mobile.
- Chapter compass: a quiet section rail in wide-screen gutters, with a current-section marker and numbered labels on hover or keyboard focus.
- The builder's desk: the original textured 3D workstation, with three camera views, pointer/touch orbit, keyboard controls, pause, reset, and a graceful fallback. Its model and renderer load in a separate bundle.
- Hero views: switch from the desk to a particle sculpture or the portrait. The sculpture has orbit, wave, and helix modes; pointer movement bends the field, with arrow keys and Space for keyboard controls.
- The human: the supplied textured 3D portrait model, with orbit, keyboard controls, optional rotation, wireframe mode, and download; a custom studio photograph is also available. The model is optimized from 52.7 MB to 5.1 MB and loads only when requested. Asset notes and the portrait generation prompt are in [docs/portrait-assets.md](docs/portrait-assets.md).
- Build playground: draw with multiple inks, erase, undo, and export a PNG; walk through an illustrative compiler pipeline; drag and toss skill badges with gravity.
- Selected work: a visual contact sheet links to editorial project chapters, with scroll-linked depth, pointer-responsive imagery, animated discipline filters, and native-dialog build stories that expand from their project and restore focus when closed. Chapter links select a matching initial filter when opened directly.
- Project archive: search by project name, description, or technology; reveal actual project images with the pointer or keyboard focus, and dismiss previews with Escape.
- Toolkit: expandable tool descriptions.
- Credentials: certificate previews in a native dialog and issuer verification links.

The palette pairs periwinkle blue with violet and copper accents, on cool ink and warm paper themes. The pipeline walkthrough and architecture diagrams are illustrative examples. They do not run AI inference or represent live infrastructure.

## Run locally

```sh
bun install
bun dev
```

Copy `.env.example` to `.env` and configure `RESEND_API_KEY` to enable the contact endpoint. The production endpoint is `api/send.js`; Vite uses that same handler in development. Production hosting must support the Vercel-style serverless handler. `bun run preview` serves static output and does not deliver contact messages.

```sh
bun run check
bun test
bun run build
bun run preview
```

## Content and styling

The main portfolio's creative studio layer adds explorable project blueprints, an interactive About notebook, skill-to-repository links, and contact subject starters that preserve custom drafts. Its styles are isolated in `src/styles/creative-studio.css`. Design notes and checks are in [docs/portfolio-creative-upgrade.md](docs/portfolio-creative-upgrade.md).

Project, education, leadership, technology, and credential data live in `src/constants/index.js`. The active design uses `src/styles/portfolio.css`, `src/styles/experience.css`, `src/styles/studio.css`, `src/styles/studio-index.css`, and the deferred `src/styles/workstation.css`. The résumé is served from `public/resume.pdf`.

The latest research, composition, interaction specification, implementation order, and verification criteria were written before the changes in [docs/portfolio-design-plan.md](docs/portfolio-design-plan.md). The hero's annotation and caption follow the selected desk, signal, or human scene.

`MotionStudio` coordinates word reveals, scroll-linked project depth, reading progress, bounded magnetic buttons, and brief chapter cues. The theme toggle reveals the new palette from its origin, while discipline filters bridge their layouts through native View Transitions. Browsers without that API update normally. Decorative motion can be disabled with the persistent motion control; the operating system's reduced-motion preference is also respected. Pausing motion settles active transitions. Research references and design decisions are in [docs/design-references.md](docs/design-references.md).

The original workstation is `src/assets/models/workstation.glb`; its CC BY model credit is available in the scene and `public/desktop_pc/license.txt`. Keep those credits when changing or redistributing the scene.

The animation loops stop when their experiment is offscreen, hidden, or paused. Reduced-motion visitors see paused simulations by default. Drawing coordinates are normalized so a sketch survives resizing, and switching experiment tabs preserves the sketch.

The contact endpoint validates field types and lengths, sends plain-text email, rejects honeypot submissions, and applies a best-effort in-memory rate limit. For distributed or high-traffic hosting, add a durable host-level limiter. Provider errors are kept private, and the form retains drafts on delivery failure.

## Optional driving world

The footer opens `/world`, a lazy React wrapper around a separate Three.js driving application. `/drive` and `/exe` remain compatible aliases. The embedded world is served at `/driving-world/index.html`; it loads only after entry. Exit controls and Escape return to the saved portfolio scroll position. Escape first dismisses the World Map when it is open. The standalone world also offers a normal portfolio link.

Source lives in `experiments/saksham-driving-world/` with its own Bun lockfile and tests. `public/driving-world/` is generated and Git-ignored: never edit or copy assets into it manually. Both `bun dev` and `bun run build` build and publish the current world automatically. Use `bun run dev:world` for live editing of the standalone scene; run `bun run build:world` to refresh the embedded version after scene edits. `bun run test:world` runs its tests.

The deployment permits same-origin framing and blocks external framing. The wrapper accepts exit messages only from its own iframe on the same origin. Main portfolio assets, world source assets, and generated deployment output remain separate. Preserve the original MIT licence and model attribution files.

Repository layout:

- `src/`, `public/`, `api/`: professional portfolio, shared assets, contact endpoint.
- `experiments/saksham-driving-world/`: world source, models, audio, independent tests.
- `scripts/build-world.mjs`: reproducible integration build.
- `tests/`: portfolio tests; `docs/`: design research and maintenance notes.
- `dist/` and `public/driving-world/`: disposable generated output.

## Optional discoveries

Poke the full stop after Saksham's name three times to discover a bouncing punctuation Easter egg. In the playground's Chaos tab or `/lab#gravity`, drag and flick skill stickers, tap empty space for a shockwave, or try the deliberately tempting “Do not press” control. The terminal's `gravity` command opens this existing experiment directly. Motion preferences suppress the punctuation flight and pulse decoration; physics remains explicitly controllable, keyboard-tossable and resettable.

`/lab` hosts five small experiments: drawing, a compiler walkthrough, gravity, a neural signal visualization and generative art. Experiments mount only after launch and unmount when closed. The developer terminal opens from its button or Ctrl + backtick; it uses a predefined command dictionary and never executes shell commands. Four margin fragments and the portrait's Professional Button Presser achievement are saved locally without login.

The supplied portrait is a static mesh with no rig. It responds through subtle bust poses and dialogue, with pointer attention, project/contact context, an idle response and a returning greeting. The project blueprints link to repository documentation and reflect distinct actual architectures. See [docs/portfolio-discovery-plan.md](docs/portfolio-discovery-plan.md).

## Deployment

Import the GitHub repository into Vercel with the repository root as the project root. `vercel.json` selects Vite, installs both frozen Bun lockfiles, runs the combined build, and publishes `dist/` plus the single `api/send.js` function. Use Bun 1.4.0 and Node 22 locally, matching CI. Configure `RESEND_API_KEY` in Vercel's environment settings; never prefix it with `VITE_`. The current sender is Resend's onboarding address; a verified sender domain is recommended for deployment.

Run `bun run audit:production` after building to check required entries, oversized files, and unintended debug/environment files. GitHub CI runs locked installs, checks, all tests, the combined build, and this audit. Hashed bundles receive immutable caching; unversioned models revalidate so updates do not remain stale. Vercel supplies CDN compression, so the build does not emit redundant `.gz`/`.br` copies.

The production structure, complete removal list, measured output, and Hobby constraints are documented in [docs/production-repository-audit.md](docs/production-repository-audit.md). This configuration is prepared locally; deployment and live function delivery still require verification on Vercel.

Local instruction and skill files must remain ignored and must never be committed or pushed.

## Low-bandwidth delivery

Images now use generated responsive AVIF/WebP candidates, Inter uses a self-hosted Latin WOFF2 subset, and the interactive playground loads near the viewport. Detected slow/data-saving connections receive a poster of the existing workstation with an explicit full-3D action. Main models use hashed asset URLs for immutable caching. Run `bun run assets:optimize` after replacing source images. See [docs/low-bandwidth-optimization.md](docs/low-bandwidth-optimization.md) for code/config examples, transfer measurements and validation limits.
