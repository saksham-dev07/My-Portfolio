import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import Lenis from "lenis";
import { RoleProvider } from "./context/RoleContext";
import { ThemeMoodProvider } from "./context/ThemeMoodContext";
import { SoundProvider } from "./context/SoundContext";
import { ArcadeProvider } from "./context/ArcadeContext";

import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import SentinelObserver from "./components/interactive/SentinelObserver";
import SecretTerminal from "./components/interactive/SecretTerminal";
import CursorTrail from "./components/interactive/CursorTrail";
import KonamiCelebration from "./components/interactive/KonamiCelebration";
import PixelPlatformer from "./components/interactive/PixelPlatformer";

// Lazy load below-the-fold components for instant initial page rendering
const Works = lazy(() => import("./components/Projects"));
const SmallerBuilds = lazy(() => import("./components/SmallerBuilds"));
const SystemsLab = lazy(() => import("./components/SystemsLab"));
const Tech = lazy(() => import("./components/Tech"));
const Certifications = lazy(() => import("./components/Certifications"));
const Education = lazy(() => import("./components/Education"));
const Leadership = lazy(() => import("./components/Leadership"));
const Contact = lazy(() => import("./components/Contact"));
const Footer = lazy(() => import("./components/Footer"));
const StarsCanvas = lazy(() => import("./components/canvas/Stars"));

// Defers loading Three.js star field until scrolled into view on desktop only
const DeferredStarsCanvas = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Skip 3D canvas on mobile phones to save network and main-thread CPU
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[-1] pointer-events-none">
      {shouldRender ? <StarsCanvas /> : null}
    </div>
  );
};

const App = () => {
  // Initialize Lenis for smooth scroll — desktop only
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) return;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      infinite: false,
    });

    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  // Scroll to top immediately on mount
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <ThemeMoodProvider>
      <SoundProvider>
        <ArcadeProvider>
          <RoleProvider>
            <div className="relative z-0 bg-primary text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200">
              {/* Subtle mouse reaction particle trail */}
              <CursorTrail />

              {/* Skip to Content — WCAG 2.1 Accessibility */}
              <a
                href="#projects"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-zinc-950 focus:font-bold focus:text-sm focus:shadow-lg"
              >
                Skip to content
              </a>
              {/* === Header & Hero Section === */}
              <div className="bg-primary">
                <Navbar />
                <Hero />
              </div>

              {/* === Main Content Sections === */}
              <Suspense fallback={<div className="w-full min-h-screen bg-primary" />}>
                {/* 01: Selected Work (Flagship Stacked Panels) */}
                <Works />

                {/* 02: Smaller Builds (Minimalist Interactive Row Showcase) */}
                <SmallerBuilds />

                {/* 03: Systems & Inference Architecture Lab (abhyudaytomar.com homelab inspiration) */}
                <SystemsLab />

                {/* 04: What I Work With (Bento Grid Skills) */}
                <Tech />

                {/* 05: Credentials & Background (Flippable Card Deck) */}
                <Certifications />

                {/* 06: Academic Foundation */}
                <Education />

                {/* 07: Leadership & Community Direction */}
                <Leadership />

                {/* 08: Editorial Contact & Direct Outreach */}
                <div className="relative z-0">
                  <Contact />
                  <DeferredStarsCanvas />
                </div>

                {/* 08: Deep Editorial Footer */}
                <Footer />
              </Suspense>

              {/* === Interactive Experience Suite: Sentinel Bot, Secret Terminal, Konami & Pixel Platformer === */}
              <SentinelObserver />
              <SecretTerminal />
              <KonamiCelebration />
              <PixelPlatformer />
            </div>
          </RoleProvider>
        </ArcadeProvider>
      </SoundProvider>
    </ThemeMoodProvider>
  );
};

export default App;
