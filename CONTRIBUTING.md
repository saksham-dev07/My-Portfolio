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

## Design and Code Standards

- **Icons**: Never use raw Unicode emojis anywhere in UI components, badges, buttons, headers, or text copy. Always use curated vector icons from libraries like `lucide-react` or custom SVG components.
- **Git Push Hygiene**: Never commit or push local secrets (`.env`), credentials, agent instruction files (`AGENTS.md`, `GEMINI.md`, `SKILL.md`), or `.agents/` directories.
- **Commits**: Follow conventional commits (e.g. `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
