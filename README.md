# Saksham Agarwal — Portfolio & Interactive Engineering Lab

Production-grade, highly interactive portfolio and systems showcase built with **React 19**, **Three.js / React Three Fiber**, **Tailwind CSS**, and **Framer Motion**. Features high-performance WebGL 3D scenes, retro HTML5 canvas mini-games, procedural Web Audio synthesizers, and real-time interactive terminal environments.

> **Live Production:** [saksham-dev07.me](https://saksham-dev07.me) (or your deployment domain)  
> **Source Code:** [github.com/saksham-dev07/My-Portfolio](https://github.com/saksham-dev07/My-Portfolio)

---

## Highlights & Interactive Features

### 1. Interactive Resume Platformer
* **Retro Arcade Engine**: Custom HTML5 Canvas physics engine running with delta-time normalization (`dt = deltaMs / 16.67`) across 60Hz, 120Hz, and 144Hz displays. Zero heavy game engine dependencies.
* **Four Career Rooms**:
  * *Room 1 (Core Foundations)*: Python, React 19, FastAPI, Docker, and Linux engineering milestones.
  * *Room 2 (Flagship Systems)*: Deepfake Forensics, LLM Compilers, Scraping Engines, and Real-Time Systems.
  * *Room 3 (Academic & Honors)*: B.Tech CSE at VIT Bhopal, honors, hackathons, and systems lab research.
  * *Room 4 (Cloud Validation)*: Dual AWS Certifications (Solutions Architect & Cloud Practitioner).
* **Synthesized Chiptune & SFX**: Procedural audio engine built purely with Web Audio API oscillators, biquad filters, and acoustic envelopes (warm major chime victory sequence, double-jump bursts, and chiptune BGM).
* **Cosmetic Outfits**: Real-time character skin selection (*Cyber*, *Space Cadet*, *Graduation Cap*, *The Matrix*).
* **Mobile Touch Engine**: Virtual D-pad, tap-to-jump canvas viewport, multi-touch event isolation, safe-area insets (`env(safe-area-inset-bottom)`), and scroll locking.

### 2. Interactive Secret Terminal (SakshamOS)
* Authentic retro Unix command shell emulator with custom commands (`help`, `about`, `projects`, `skills`, `certs`, `contact`, `clear`, `sudo`, `exit`).
* Direct keyboard shortcut toggle and system status monitor.

### 3. "Catch Me If You Can" Instant Hire Button
* Playful CTA button that detects cursor velocity and dodges cursor movement within safe boundary offsets, cycling witty responses before unlocking direct contact channels.

### 4. Dynamic Theme System
* Consolidated single-button floating theme controller.
* Supports rich color palettes tailored for high contrast and modern aesthetics, including Obsidian Dark and calibrated light mode rendering.

### 5. 3D WebGL Canvas
* Interactive retro workstation model rendered via Three.js and React Three Fiber with custom lighting and demand-driven rendering (`frameloop="demand"`).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 19, Vite 6, JavaScript (ESNext) |
| **Styling & Design System** | Tailwind CSS 3, Vanilla CSS Design Tokens, Custom Glassmorphism |
| **3D & WebGL Graphics** | Three.js, React Three Fiber (@react-three/fiber), Drei (@react-three/drei) |
| **Animation & Gestures** | Framer Motion, Lenis Smooth Scroll |
| **Audio Engine** | Native Web Audio API (Subtractive Synthesizer & Procedural SFX) |
| **Gameport Engine** | HTML5 Canvas 2D Context, Delta-Time Euler Physics |
| **Icons & Visuals** | Lucide React, Optimized WebP Assets |
| **Deployment** | Vercel Edge Network, HTTP/2 Server Push, Immutable Asset Caching |

---

## Project Structure

```
My-Portfolio/
├── public/
│   ├── favicon.svg
│   ├── llms.txt               # LLM system prompt / scraper guide
│   └── robots.txt             # Search indexing configuration
├── src/
│   ├── assets/                # Compressed WebP media, certificates, and official resume PDF
│   ├── components/            # Main portfolio sections
│   │   ├── canvas/            # Three.js 3D Computers model & Stars particle canvas
│   │   ├── interactive/       # Interactive modules
│   │   │   ├── PixelPlatformer.jsx   # 4-room retro resume platformer
│   │   │   ├── SecretTerminal.jsx    # Unix shell console emulator
│   │   │   ├── DodgeButton.jsx       # Evasive physics CTA button
│   │   │   └── SentinelObserver.jsx  # Floating status monitor
│   │   ├── Hero.jsx           # 3D Hero section with typewriter roles
│   │   ├── About.jsx          # Professional overview & philosophy
│   │   ├── Projects.jsx       # Production systems & architecture cards
│   │   ├── Tech.jsx           # Technical skill matrix
│   │   ├── Education.jsx      # VIT Bhopal academic history
│   │   ├── Certifications.jsx # AWS & industry credentials showcase
│   │   ├── Leadership.jsx     # Team leadership & mentorship records
│   │   ├── Contact.jsx        # Direct communication form & links
│   │   └── Footer.jsx         # Footer with quick links and copyright
│   ├── context/
│   │   ├── ArcadeContext.jsx  # State management for mini-games & terminal
│   │   └── SoundContext.jsx   # Web Audio synthesizer & sound manager
│   ├── constants/             # Portfolio content data models
│   ├── hoc/                   # SectionWrapper scroll-trigger HOC
│   ├── utils/                 # Motion variants and easing utilities
│   ├── App.jsx                # Application root with Lenis smooth scroll
│   ├── index.css              # Custom styling, scanlines, and no-scrollbar utilities
│   └── main.jsx               # React 19 entry point
├── index.html                 # Semantic HTML5 entry with metadata
├── package.json               # Dependencies and build scripts
└── vite.config.js             # Vite configuration with chunk splitting
```

---

## Performance Engineering

* **Asset Optimization**: All project previews, certificates, and logos converted to compressed **WebP** formats, reducing payload sizes by over 70%.
* **Smart Chunk Splitting**: Configured manual roll-up chunks in `vite.config.js` separating Three.js core, Drei utilities, Framer Motion, and vendor icons for aggressive browser caching.
* **Canvas Power Management**: 3D scene pauses rendering while outside the viewport via `frameloop="demand"` and intersection observers.
* **Retina DPI Throttling**: Canvas device pixel ratio is clamped (`Math.min(window.devicePixelRatio, 1.5)`) to preserve high framerates on 4K and mobile Retina displays.
* **Scroll Performance**: Smooth scrolling powered by Lenis with hardware-accelerated transforms.

---

## Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/saksham-dev07/My-Portfolio.git
   cd My-Portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your EmailJS credentials (if using the direct contact form):
   ```env
   VITE_APP_EMAILJS_SERVICE_ID=your_service_id
   VITE_APP_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_APP_EMAILJS_PUBLIC_KEY=your_public_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Available Scripts

* `npm run dev`: Starts local Vite development server with Hot Module Replacement.
* `npm run build`: Compiles production bundle with code-splitting and asset optimization.
* `npm run lint`: Runs ESLint to verify code quality and syntax standards.
* `npm run preview`: Locally previews the production build output.

---

## Author

**Saksham Agarwal**  
Software & Applied AI Engineer  
B.Tech CSE, VIT Bhopal University (Class of 2027)  

* **GitHub:** [github.com/saksham-dev07](https://github.com/saksham-dev07)
* **LinkedIn:** [linkedin.com/in/saksham-agarwal07](https://www.linkedin.com/in/saksham-agarwal07/)
* **Email:** [sakmmm07@gmail.com](mailto:sakmmm07@gmail.com)

---

## License

This project is open source and available under the [MIT License](LICENSE).
