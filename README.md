# Saksham Agarwal — Portfolio

Interactive 3D portfolio built with **React 19**, **Three.js**, **Framer Motion**, and **Tailwind CSS**.  
Deployed on **Vercel** with optimized caching, WebP assets, and smooth Lenis scroll.

> **Live →** [saksham.dev](https://saksham.dev)

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 3 |
| **3D / WebGL** | Three.js, React Three Fiber, Drei |
| **Animation** | Framer Motion, Lenis smooth scroll |
| **Contact** | EmailJS |
| **Hosting** | Vercel (free tier, edge CDN) |

## Setup

```bash
npm install
cp .env.example .env   # Add EmailJS keys
npm run dev
```

## Project Structure

```
src/
├── assets/          # WebP images, resume PDF, SVG tech icons
├── components/      # 10 page sections + 3D canvas modules
│   └── canvas/      # Three.js Computers model + Stars particle field
├── constants/       # Portfolio content data (projects, education, certs)
├── hoc/             # SectionWrapper higher-order component
├── utils/           # GPU-optimized animation variants
├── App.jsx          # Root + Lenis smooth scroll engine
└── index.css        # Tailwind base + Liquid Glass design system
```

## Performance

- All images pre-converted to **WebP** (avg 70% smaller than PNG/JPEG)
- **Code-split** into 7 chunks (React, Three.js, Framer Motion, etc.)
- 3D canvas uses `frameloop="demand"` when off-screen
- DPR capped at 1.5 for GPU efficiency
- Vercel headers: `immutable` cache on hashed assets

---

© Saksham Agarwal. All rights reserved.
