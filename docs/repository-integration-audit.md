# Portfolio / driving-world integration

## Canonical structure

- React portfolio: `src/`, `public/`, `api/`.
- World source and original asset licences: `experiments/saksham-driving-world/`.
- Integration: `scripts/build-world.mjs`; root dev/build always publish the world first.
- Generated world: `public/driving-world/`, excluded from Git.
- Deployment output: `dist/`, excluded from Git.

`/world`, `/drive` and `/exe` select the lazy React wrapper. Its iframe uses `/driving-world/index.html`, a distinct static path that cannot shadow `/world` through directory-index resolution. Vite's normal SPA fallback and the explicit Vercel rewrites select the same wrapper.

Exit messages require both matching origin and the iframe's contentWindow. The child targets its own origin. Escape exits the embedded world when the World Map is closed; the map retains its native Escape dismissal. Exit restores the saved portfolio position. The deployment uses SAMEORIGIN framing so the embedded world is allowed while external framing stays blocked. This header configuration still needs verification on the actual deployed host.

## Cleanup

Removed 49 confirmed unused files, totaling 8.78 MiB: unused WAV audio copies (runtime uses MP3), Draco encoders (runtime uses decoders), the superseded npm lockfile, and the duplicate imported résumé. The asset barrel now resolves the canonical `/resume.pdf` URL. The world build copies that canonical résumé into its generated output.

Removed unused neural-world progress helpers; preserved return-position helpers and existing session storage compatibility. Updated obsolete README instructions. Production world sourcemaps are no longer generated or copied into deployment output.

The world's embedded `.git` directory was moved intact to `.local-history/driving-world.git`, excluded from Git. This preserves the upstream history while allowing the parent repository to track source files instead of accidentally adding an embedded-repository gitlink. Inspect history with `git --git-dir=.local-history/driving-world.git log`. Models, authored references, licences, portrait preparation scripts, and both Bun lockfiles remain.

## Validation

- Combined production build succeeds; root Biome check succeeds.
- 17 portfolio/world tests pass.
- Production-preview footer entry and embedded Exit link return work.
- Normal portfolio requests no `/driving-world/` resources before entry.
- No deployment or Git push performed.
