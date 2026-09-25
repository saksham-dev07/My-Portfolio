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

// Lazy load below-the-fold components and easter egg mini-game for optimal initial bundle size
const SignalRun = lazy(() => import("./components/interactive/signalRun/SignalRunModal"));
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
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
      autoResize: true,
    });

    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Watch for external overflow:hidden on body (Navbar, modals, etc.)
    // and stop/start Lenis to avoid scroll conflicts that make the page stuck
    const bodyObserver = new MutationObserver(() => {
      const bodyOverflow = document.body.style.overflow;
      if (bodyOverflow === "hidden") {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      cancelAnimationFrame(rafId);
      bodyObserver.disconnect();
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
              {/* Individual Suspense boundaries so each section loads independently,
                  preventing the entire page from going blank while one chunk loads */}
              <Suspense fallback={null}>
                {/* 01: Selected Work (Flagship Stacked Panels) */}
                <Works />
              </Suspense>

              <Suspense fallback={null}>
                {/* 02: Smaller Builds (Minimalist Interactive Row Showcase) */}
                <SmallerBuilds />
              </Suspense>

              <Suspense fallback={null}>
                {/* 03: Systems & Inference Architecture Lab (abhyudaytomar.com homelab inspiration) */}
                <SystemsLab />
              </Suspense>

              <Suspense fallback={null}>
                {/* 04: What I Work With (Bento Grid Skills) */}
                <Tech />
              </Suspense>

              <Suspense fallback={null}>
                {/* 05: Credentials & Background (Flippable Card Deck) */}
                <Certifications />
              </Suspense>

              <Suspense fallback={null}>
                {/* 06: Academic Foundation */}
                <Education />
              </Suspense>

              <Suspense fallback={null}>
                {/* 07: Leadership & Community Direction */}
                <Leadership />
              </Suspense>

              <Suspense fallback={null}>
                {/* 08: Editorial Contact & Direct Outreach */}
                <div className="relative z-0">
                  <Contact />
                  <DeferredStarsCanvas />
                </div>
              </Suspense>

              <Suspense fallback={null}>
                {/* 08: Deep Editorial Footer */}
                <Footer />
              </Suspense>

              {/* === Interactive Experience Suite: Sentinel Bot, Secret Terminal, Konami & Signal Run === */}
              <SentinelObserver />
              <SecretTerminal />
              <KonamiCelebration />
              <Suspense fallback={null}>
                <SignalRun />
              </Suspense>
            </div>
          </RoleProvider>
        </ArcadeProvider>
      </SoundProvider>
    </ThemeMoodProvider>
  );
};

export default App;
