# Contributing Guidelines

Thank you for your interest in contributing to this portfolio and creative laboratory!

## Prerequisites & Runtime Standards

- **Package Manager & Runtime**: Always use `bun` (>= 1.4.0) and `bunx`. Never use `npm` or `npx`.
- **Node Environment**: Node 22.x LTS.

## Local Development Workflow

1. **Install Dependencies**:
   ```bash
   bun install
   bun run install:world
   ```

   Run both installs from the repository root. World tests use asset-validation tools from the root dependencies as well as the world's own runtime packages. CI installs both frozen lockfiles.

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Add RESEND_API_KEY if testing contact email delivery
   ```

3. **Start Development Server**:
   ```bash
   bun run dev
   ```

4. **Run Unit Tests**:
   ```bash
   bun test
   ```

   This discovers portfolio and world tests. `bun run test:world` runs only the world suite; install both dependency sets first.

5. **Linting and Formatting**:
   ```bash
   bun run check
   bun run format
   ```

6. **Production Build Validation**:
   ```bash
   bun run build
   bun run audit:production
   ```

## Optional Asset Authoring

Normal development, tests, and production builds use the committed shipping assets; they do not require Blender or Python. The Blender scripts in `scripts/assets/` run inside Blender, while the `.mjs` optimizers run with Bun. Some authoring steps require original models or editable scenes kept locally in the ignored `.local-history/` directory. Preserve those originals and artwork licenses; do not treat them as disposable cache files.

See [the maintenance guide](docs/repo-maintenance.md) for input/output ownership and the [environment notes](docs/environment-refresh.md) for terrain settings and named Blender assets.

## Design and Code Standards

- **Icons**: Never use raw Unicode emojis anywhere in UI components, badges, buttons, headers, or text copy. Always use curated vector icons from libraries like `lucide-react` or custom SVG components.
- **Git Push Hygiene**: Never commit or push local secrets (`.env`), credentials, agent instruction files (`AGENTS.md`, `GEMINI.md`, `SKILL.md`), or `.agents/` directories.
- **Commits**: Follow conventional commits (e.g. `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
