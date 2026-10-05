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
- Signal Run: an optional canvas arcade experience, loaded from the footer when requested.

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

Project, education, leadership, technology, and credential data live in `src/constants/index.js`. The active design uses `src/portfolio.css`, `src/experience.css`, `src/studio.css`, `src/studio-index.css`, and the deferred `src/workstation.css`. The résumé is served from `public/resume.pdf`.

The latest research, composition, interaction specification, implementation order, and verification criteria were written before the changes in [docs/portfolio-design-plan.md](docs/portfolio-design-plan.md). The hero's annotation and caption follow the selected desk, signal, or human scene.

`MotionStudio` coordinates word reveals, scroll-linked project depth, reading progress, bounded magnetic buttons, and brief chapter cues. The theme toggle reveals the new palette from its origin, while discipline filters bridge their layouts through native View Transitions. Browsers without that API update normally. Decorative motion can be disabled with the persistent motion control; the operating system's reduced-motion preference is also respected. Pausing motion settles active transitions. Research references and design decisions are in [docs/design-references.md](docs/design-references.md).

The original workstation is `public/desktop_pc/scene-opt.glb`; its CC BY model credit is available in the scene and `public/desktop_pc/license.txt`. Keep those credits when changing or redistributing the scene.

The animation loops stop when their experiment is offscreen, hidden, or paused. Reduced-motion visitors see paused simulations by default. Drawing coordinates are normalized so a sketch survives resizing, and switching experiment tabs preserves the sketch.

The contact endpoint validates field types and lengths, sends plain-text email, rejects honeypot submissions, and applies a best-effort in-memory rate limit. For distributed or high-traffic hosting, add a durable host-level limiter. Provider errors are kept private, and the form retains drafts on delivery failure.

## Deployment

Run `bun run build` and deploy `dist/` with the serverless `api/` handler. Configure `RESEND_API_KEY` in the hosting environment. The current sender is Resend's onboarding address; a verified sender domain is recommended for deployment.

Local instruction and skill files must remain ignored and must never be committed or pushed.
