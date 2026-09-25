# Saksham Agarwal — Portfolio & Interactive Systems Lab

Production-grade, highly interactive portfolio and distributed systems showcase engineered with **React 19**, **Vite 6**, **Three.js / React Three Fiber**, **Tailwind CSS**, and **Framer Motion**. Features high-performance WebGL 3D scenes, retro HTML5 canvas mini-games, procedural Web Audio synthesizers, real-time interactive terminal environments, and a serverless email dispatch gateway powered by **Resend**.

[![React 19](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.3.5-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.4.0-fbf0df?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)
[![Three.js](https://img.shields.io/badge/Three.js-0.176.0-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Resend](https://img.shields.io/badge/Resend-6.28.1-000000?style=flat-square&logo=resend)](https://resend.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)

> **Live Deployment:** [saksham-dev07.me](https://saksham-dev07.me)  
> **Source Repository:** [github.com/saksham-dev07/My-Portfolio](https://github.com/saksham-dev07/My-Portfolio)

---

## Table of Contents

- [Architectural Overview & Core Sections](#architectural-overview--core-sections)
- [The Interactive Experience Suite](#the-interactive-experience-suite)
  - [1. SIGNAL RUN (Canvas Career Side-Scroller)](#1-signal-run-canvas-career-side-scroller)
  - [2. SakshamOS Secret Terminal](#2-sakshamos-secret-terminal)
  - [3. Sentinel Watchdog Observer HUD](#3-sentinel-watchdog-observer-hud)
  - [4. Role Perspective Filter](#4-role-perspective-filter)
  - [5. "Catch Me If You Can" DodgeButton](#5-catch-me-if-you-can-dodgebutton)
  - [6. Konami Code Celebration & Cursor Trail](#6-konami-code-celebration--cursor-trail)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Performance Engineering & Optimizations](#performance-engineering--optimizations)
- [Local Development Setup](#local-development-setup)
- [Available Scripts](#available-scripts)
- [Author & Contact](#author--contact)
- [License](#license)

---

## Architectural Overview & Core Sections

The application is structured into numbered editorial sections, each engineered with individual `Suspense` boundaries to ensure zero blocking and instantaneous initial paint:

```
[00: Hero & 3D Canvas] ──> [01: Works] ──> [02: Smaller Builds] ──> [03: Systems Lab]
                             │
                             ├──> [04: Tech Matrix] ──> [05: Credentials] ──> [06: Education]
                             │
                             └──> [07: Leadership] ──> [08: Contact Gateway] ──> [Footer]
```

### 00: Hero & 3D Workstation (`Hero.jsx`)
* **3D Canvas Workstation**: High-fidelity retro computer workstation rendered using Three.js and React Three Fiber (`ComputersCanvas`).
* **Demand-Driven Rendering**: Configured with `frameloop="demand"` and viewport intersection listeners to pause WebGL rendering when scrolled out of view, reducing CPU/GPU overhead to 0%.
* **Typewriter Roles Carousel**: Highlights core engineering disciplines (*Software & Applied AI Engineer*, *Distributed Systems Builder*, *Full-Stack Developer*).
* **Action Routing**: Instant jump buttons to flagship case studies, the interactive Systems Lab, and direct resume PDF download.

### 01: Selected Works (`Projects.jsx`)
Deep-dive case studies presented with architecture diagrams, live metric badges, code tabs, and production links:
* **Deepfake Forensics & Explainable AI**: Production-grade, multi-modal forensics engine fusing **15 detection signals** (EfficientNet-B4 visual classifier, Grad-CAM/SHAP spatial attribution heatmaps, SyncNet audio-visual lip-synchronization analysis, and automated forensic PDF reporting) with **94.2% validation accuracy**.
* **NL App Compiler (Generative AI)**: 4-stage compiler-style LLM pipeline featuring intent parsing, UI/UX tree synthesis, automated database schema generation, and multi-pass AST syntax verification.
* **DocPilot – Clinical Management Platform**: Full-stack, role-based healthcare platform with Gemini AI serving as an intelligent consultation scribe auto-generating structured clinical notes, Firebase multi-role authentication, and Appwrite real-time synchronization.
* **NexusBoard – Collaborative Canvas**: Real-time collaborative infinite canvas and whiteboard engine featuring live multi-user synchronization over WebSockets (<20ms latency) and a 60 FPS HTML5 Canvas drawing loop.

### 02: Smaller Builds (`SmallerBuilds.jsx`)
Minimalist interactive row showcase for production utilities and focused experiments:
* **Last-Mile Delivery Tracker**: Logistics platform with Leaflet GPS vehicle routing, live ETA calculations, and dispatch cards *(Live on Vercel)*.
* **Into-the-Scrape-Verse**: TypeScript-based web scraping and automated extraction engine with live crawling status and structured streaming *(Live on Render)*.
* **Malware Detector & Security Forensics**: Hybrid PE malware inspection engine combining custom YARA signature rules with heuristic behavioral and entropy analysis.
* **ExpenseLens Tracker**: Real-time personal finance analytics dashboard with categorized budget tracking *(Live on Vercel)*.
* **Gesture Ping Pong**: Computer vision ping pong game controlled via real-time hand gesture tracking using OpenCV & MediaPipe *(Live on Vercel)*.
* **Blockforge Ad Blocker**: Manifest V3 high-performance ad-blocking browser extension.
* **Code Comment Remover**: Regex AST utility for stripping comments across multi-language codebases.
* **AI Story Generator**: Generative AI creative writing tool powered by LLM narrative pipelines.

### 03: Systems & Inference Architecture Lab (`SystemsLab.jsx`)
An interactive distributed system and inference architecture lab modeled after modern high-throughput homelab deployments:
* **5 Infrastructure Nodes**:
  1. *Edge Client Tier*: Vercel Edge Global CDN, Next.js 14 & React 19, HTTP/3, Brotli pre-compression, sub-15ms edge routing.
  2. *FastAPI Gateway*: Linux Cloud VM / Docker, async event loop, RBAC token validation, Redis sliding-window rate limiter.
  3. *AI Inference Core*: PyTorch & Gemini API runtime, EfficientNet-B4 spatial classifier, SyncNet lip-audio alignment, Grad-CAM/SHAP heatmaps.
  4. *Data & Storage Hub*: PostgreSQL ACID transactional cluster, encrypted AWS S3 object store, Appwrite real-time CDC engine.
  5. *Sentinel Watchdog*: Automated POSIX background daemon, YARA heuristic matcher, PE header entropy analyzer, 60s synthetic health checks.
* **Interactive Controls**: Real-time node inspector drawer, request flow animations, pipeline latency simulations, and live cluster uptime gauges (99.98% operational).

### 04: What I Work With — Tech Matrix (`Tech.jsx`)
Bento grid organizing 35+ technologies across 6 key pillars with zero-latency official vector SVGs:
* **Languages**: Python, Java, C++, TypeScript, JavaScript, C.
* **Frontend**: React.js, Next.js, Tailwind CSS, Redux Toolkit, Three.js, HTML5, CSS3.
* **Backend**: FastAPI, Flask, Node.js, Express.js.
* **AI & Machine Learning**: PyTorch, TensorFlow, OpenCV, scikit-learn.
* **Cloud & Databases**: PostgreSQL, MongoDB, MySQL, Firebase, Appwrite, Google Cloud, AWS.
* **DevOps & Tools**: Docker, Git, Linux (POSIX), Postman, Vercel, Jupyter, Figma.

### 05: Credentials & Background (`Certifications.jsx`)
* **12 Industry Credentials**: Spans AWS, IBM Watsonx, L&T EduTech, Google Cloud, NPTEL (IIT Kharagpur & IIT Madras), FutureAI, and VIT Bhopal.
* **3D Flippable Card Deck**: Interactive 3D flip effect with batch "Flip All" trigger.
* **Dual Verification Mechanism**:
  * Direct one-click verification for online credentials (AWS CertMetrics, IBM Skills Network, Google Coursera).
  * Extracted scannable QR verification modal for offline/portal credentials (NPTEL Marketing Analytics, NPTEL Intro to ML, FutureAI Global Hackathon, Vityarthi AI/Java/Python).
* **Modal Certificate Viewer**: High-resolution image preview, skills taxonomy, and official validation IDs.

### 06: Academic Foundation & Hackathons (`Education.jsx`)
* **Education**:
  * **B.Tech in Computer Science Engineering** — VIT Bhopal University (2023 - 2027) • **CGPA: 8.46 / 10.0**. Specializing in AI, ML, and Full-Stack Systems.
  * **Class XII (CBSE - Science)** — St. Anthony's Sr. Sec. School (2021 - 2022) • **71.6%**.
  * **Class X (CBSE)** — St. Anthony's Sr. Sec. School (2019 - 2020) • **88.8%**.
* **Hackathons & Honors**:
  * **TCS CodeVita 2025**: Global Rank **6,735** out of 20,540 participants in Round 1.
  * **Gridlock Hackathon 2.0 (Flipkart)**: Qualified solo in Flipkart's national ML competition, building a traffic-demand prediction model achieving **93.94% accuracy** on HackerEarth.

### 07: Leadership & Community Direction (`Leadership.jsx`)
* **Design Team Lead** — FinTech Club, VIT Bhopal (2025 - Present): Spearheading visual identity, branding, social media collateral, and digital campaigns across major fintech workshops and symposiums.
* **Core Member - Design Team** — FinTech Club, VIT Bhopal (2024 - 2025): Collaborated cross-functionally across content, events, and technical sub-teams for high-visibility visual deliverables.

### 08: Editorial Contact & Gateway (`Contact.jsx`)
* **Resend API Integration**: Dispatches formatted, structured emails directly to Saksham's inbox via a secure serverless backend.
* **DodgeButton Easter Egg**: Playful evasive physics button cycling witty responses before unlocking direct contact channels.
* **Deferred 3D Starfield**: Three.js particle starfield rendered exclusively when scrolled into view.

---

## The Interactive Experience Suite

### 1. SIGNAL RUN (Canvas Career Side-Scroller)
An authentic 2D platformer embedded directly into the portfolio (`src/components/interactive/signalRun/`):
* **Custom Euler Physics Engine**: Built with pure HTML5 Canvas 2D context using delta-time normalization (`dt = deltaMs / 1000`) for seamless rendering across 60Hz, 120Hz, and 144Hz displays with **zero external game libraries**.
* **6 Chronological Career Zones**:
  * `Zone 01 — Education`: VIT Bhopal academic history, 8.46 CGPA, and foundation milestones.
  * `Zone 02 — Projects`: Deepfake Forensics (94.2%), NL App Compiler, and DocPilot facts.
  * `Zone 03 — Certifications`: AWS Cloud & AI credentials, IBM Watsonx, and NPTEL IIT Honors.
  * `Zone 04 — Hackathons`: TCS CodeVita (Global Rank 6,735) and Flipkart Gridlock (93.94%).
  * `Zone 05 — Leadership`: FinTech Club Design Team Lead and visual direction record.
  * `Zone 06 — Finish Gateway`: Quantum Portal finish line generating a verified career run report with direct links to the hiring portal.
* **Real Fact Telemetry**: Collects real verified milestone facts along the run.
* **Non-Punitive Stumble**: Striking an obstacle triggers a gentle recovery restart at the current zone without losing collected fact nodes.
* **Procedural Web Audio Engine**: Pure mathematical sound synthesis using Web Audio API oscillators (sine, square, triangle) and acoustic gain envelopes for jumps, chimes, stumbles, and victory fanfares.
* **Mobile Touch Support**: Tap-anywhere screen controls and responsive DPI scaling.

### 2. SakshamOS Secret Terminal
* **Interactive Unix Shell**: Accessible via backtick (`` ` `` / `~`) or floating HUD trigger.
* **Commands**: `help`, `about`, `projects`, `skills`, `certs`, `contact`, `clear`, `sudo`, `matrix`, `joke`, `whoami`, `exit`.
* **State Persistence**: Preserves session terminal command history across toggles.

### 3. Sentinel Watchdog Observer HUD
* **Reactive AI Agent**: Floating observer HUD (`SentinelObserver.jsx`) monitoring navigation.
* **Contextual Commentary**: Dispatches contextual comments when reviewing projects, analyzing architecture, idle browsing, or speed-scrolling through sections.
* **Procedural SFX**: Subtle audio blips on commentary dispatch.

### 4. Role Perspective Filter
* **Perspective Context**: Allows visitors to toggle their view between `All`, `Full-Stack`, `Applied AI`, and `Backend & Systems`.
* **Session Storage**: Automatically syncs selected filters with `sessionStorage` and adjusts project rows and architectural cards dynamically.

### 5. "Catch Me If You Can" DodgeButton
* **Physics Avoidance**: Playful call-to-action button in the contact section that calculates cursor velocity and vectors to evade clicks with smooth spring physics before unlocking direct communication channels.

### 6. Konami Code Celebration & Cursor Trail
* **Konami Code Easter Egg**: Entering `↑ ↑ ↓ ↓ ← → ← → B A` triggers celebratory screen-wide particle bursts and retro arcade fanfare.
* **Cursor Reaction Trail**: Lightweight canvas-based particle trail that tracks cursor movement across the interface.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Core Framework** | React 19.1.0, Vite 6.3.5, JavaScript (ESNext/ES2020) | Reactive component architecture & ultra-fast HMR build toolchain |
| **3D & WebGL Graphics** | Three.js 0.176.0, @react-three/fiber 9.1.2, @react-three/drei 10.0.8 | Interactive 3D retro computer workstation & stars particle canvas |
| **Styling & Design Tokens** | Tailwind CSS 3.4.17, Vanilla CSS, Custom Glassmorphism | Custom design system, dark mode, and responsive layout utilities |
| **Animation & Gestures** | Framer Motion 12.12.1, Lenis 1.3.26 | Fluid spring animations, 3D card flips, and momentum scroll |
| **Email & Backend Gateway** | Resend 6.28.1, Vercel Serverless Function (`/api/send.js`) | Enterprise serverless transactional email delivery |
| **Local Dev Server API** | Custom Vite Plugin (`resendLocalPlugin` in `vite.config.js`) | Local middleware emulating serverless `/api/send` endpoint |
| **Audio Engine** | Native Web Audio API | Procedural subtractive sound synthesis & retro SFX |
| **Mini-Game Engine** | HTML5 Canvas 2D API | Delta-time Euler physics engine with zero external dependencies |
| **Pre-Compression** | vite-plugin-compression2 2.5.3 (Brotli + Gzip) | Static pre-compression for edge serving on Vercel |
| **Icons & Typography** | Lucide React 0.511.0, react-icons 5.7.0, Inter, Fira Code | Pixel-perfect vector icons & crisp monospace typography |

---

## Project Structure

```
My-Portfolio/
├── api/
│   └── send.js                # Vercel Serverless Function for Resend email dispatch
├── public/
│   ├── favicon.svg
│   ├── llms.txt               # AI & LLM context guide / documentation
│   └── robots.txt             # Search crawler directives
├── src/
│   ├── assets/                # Compressed WebP media, icons, and official resume PDF
│   │   ├── techIcons/         # Official vector SVGs for all technical skills
│   │   └── ...                # WebP previews, certificate scans, and extracted QR codes
│   ├── components/            # Main portfolio sections
│   │   ├── canvas/            # Three.js 3D canvas components (Computers, Stars)
│   │   ├── interactive/       # Interactive modules & tools
│   │   │   ├── signalRun/            # SIGNAL RUN canvas side-scroller mini-game
│   │   │   │   ├── SignalRunModal.jsx    # Game loop, canvas render, audio & physics
│   │   │   │   └── signalRunData.js      # Zone configurations & resume facts
│   │   │   ├── SecretTerminal.jsx    # SakshamOS retro Unix shell emulator
│   │   │   ├── SentinelObserver.jsx  # Floating AI observer HUD
│   │   │   ├── DodgeButton.jsx       # Evasive physics CTA button
│   │   │   ├── CursorTrail.jsx       # Canvas cursor particle trail
│   │   │   ├── KonamiCelebration.jsx # Konami code easter egg celebration
│   │   │   ├── MoodSwitcher.jsx      # Theme color tone toggle
│   │   │   └── SoundToggle.jsx       # Audio mute / unmute toggle
│   │   ├── Hero.jsx           # 3D Hero section with typewriter roles
│   │   ├── Navbar.jsx         # Glassmorphic header with active section tracking
│   │   ├── Projects.jsx       # Section 01: Flagship systems & case studies
│   │   ├── SmallerBuilds.jsx  # Section 02: Minimalist interactive row showcase
│   │   ├── SystemsLab.jsx     # Section 03: Distributed systems & inference lab
│   │   ├── Tech.jsx           # Section 04: Bento grid skills matrix
│   │   ├── Certifications.jsx # Section 05: 3D flippable credential deck & QR modal
│   │   ├── Education.jsx      # Section 06: Academics & Hackathons
│   │   ├── Leadership.jsx     # Section 07: Leadership & community direction
│   │   ├── Contact.jsx        # Section 08: Direct inquiry gateway
│   │   └── Footer.jsx         # Section 09: Editorial footer & system status
│   ├── context/
│   │   ├── ArcadeContext.jsx  # Mini-game & easter egg state management
│   │   ├── RoleContext.jsx    # Role perspective filter state (sessionStorage synced)
│   │   ├── SoundContext.jsx   # Web Audio synthesizer & sound manager
│   │   └── ThemeMoodContext.jsx # Theme tone state management
│   ├── constants/             # Verified resume data models & copy
│   ├── hoc/                   # SectionWrapper scroll-trigger HOC
│   ├── utils/                 # Motion variants and easing utilities
│   ├── App.jsx                # Application root with Lenis smooth scroll & Suspense
│   ├── index.css              # Design tokens, scanlines, and typography rules
│   └── main.jsx               # React 19 entry point
├── .env.example               # Environment variables template
├── index.html                 # Semantic HTML5 entry with metadata
├── package.json               # Dependencies and build scripts
├── tailwind.config.js         # Tailwind CSS design system configuration
└── vite.config.js             # Vite configuration with chunk splitting & Brotli/Gzip
```

---

## Performance Engineering & Optimizations

* **Pre-Compressed Static Bundles**: Configured `vite-plugin-compression2` to pre-generate both **Brotli (`.br`)** and **Gzip (`.gz`)** archives for all JavaScript and CSS files exceeding 1KB. Vercel automatically serves these pre-compressed assets with zero on-the-fly server overhead.
* **Strategic Rollup Chunk Splitting**: Isolated heavyweight libraries into separate cacheable chunks:
  * `react-vendor` (`react`, `react-dom`)
  * `three-core` (`three`)
  * `three-drei` (`@react-three/drei`, `@react-three/fiber`)
  * `framer-motion` (`framer-motion`)
  * `icons-vendor` (`lucide-react`)
* **Console & Debugger Stripping**: Production builds compile with `drop: ['console', 'debugger']` and `legalComments: 'none'` via esbuild.
* **Canvas Power Management**: 3D WebGL scenes run on `frameloop="demand"` and disconnect render loops when outside the viewport. Device pixel ratio is clamped via `Math.min(window.devicePixelRatio, 1.5)` to protect mobile battery life and sustain 60+ FPS on 4K monitors.
* **Lenis Smooth Scroll Synchronization**: Controlled via MutationObserver to prevent body overflow lock conflicts when opening modals or the secret terminal.
* **Zero Cumulative Layout Shift (CLS)**: Each major section is wrapped in dedicated `Suspense` fallback boundaries to eliminate flashing and layout shifts during incremental chunk delivery.

---

## Local Development Setup

### Prerequisites
* **Bun**: `v1.1.0` or higher (Recommended — ~1s installs & instant script execution)
* *or* **Node.js**: `v20.0.0` or higher & **npm**: `v9.0.0`+

### Installation & Launch

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saksham-dev07/My-Portfolio.git
   cd My-Portfolio
   ```

2. **Install dependencies**:
   ```bash
   # Using Bun (Recommended ~1s install)
   bun install

   # Or using npm
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Add your [Resend API Key](https://resend.com/api-keys) (required for the contact form gateway):
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
   *(Note: The local Vite dev server includes a custom middleware plugin `resendLocalPlugin` in `vite.config.js` that intercepts `/api/send` requests and processes them with this key, exactly mirroring the Vercel production serverless function).*

4. **Start Development Server**:
   ```bash
   # Using Bun
   bun dev

   # Or using npm
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Available Scripts

| Bun Command | npm Equivalent | Description |
|---|---|---|
| `bun dev` | `npm run dev` | Launches local Vite development server with Hot Module Replacement (HMR) and local Resend API middleware |
| `bun run build` | `npm run build` | Compiles production bundle, splits chunks, strips debuggers, and emits pre-compressed Brotli & Gzip files |
| `bun run lint` | `npm run lint` | Runs ESLint 9 to verify code quality, hooks integrity, and syntax standards |
| `bun run preview` | `npm run preview` | Locally serves and tests the compiled production build from `/dist` |

---

## Author & Contact

**Saksham Agarwal**  
Software & Applied AI Engineer  
B.Tech in Computer Science Engineering, VIT Bhopal University (Class of 2027)

* **Portfolio:** [saksham-dev07.me](https://saksham-dev07.me)
* **GitHub:** [github.com/saksham-dev07](https://github.com/saksham-dev07)
* **LinkedIn:** [linkedin.com/in/saksham-agarwal07](https://www.linkedin.com/in/saksham-agarwal07/)
* **Email:** [sakmmm07@gmail.com](mailto:sakmmm07@gmail.com)

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).
