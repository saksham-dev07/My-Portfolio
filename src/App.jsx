import { useEffect, useLayoutEffect, lazy, Suspense } from "react";
import Lenis from "lenis";

import Hero from "./components/Hero";
import Navbar from "./components/Navbar";

// Lazy load below-the-fold components for instant initial page rendering
const About = lazy(() => import("./components/About"));
const Tech = lazy(() => import("./components/Tech"));
const Works = lazy(() => import("./components/Projects"));
const Education = lazy(() => import("./components/Education"));
const Leadership = lazy(() => import("./components/Leadership"));
const Certifications = lazy(() => import("./components/Certifications"));
const Contact = lazy(() => import("./components/Contact"));
const Footer = lazy(() => import("./components/Footer"));
const StarsCanvas = lazy(() => import("./components/canvas/Stars"));

const App = () => {
  // Initialize Lenis with optimal interpolation (no touch hijacking)
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08, // Smooth exponential linear interpolation
      smoothWheel: true,
      syncTouch: false, // Let native OS handle touch/trackpad kinetics
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
    <div className="relative z-0 bg-primary">
      {/* === Hero Section === */}
      <div className="bg-primary">
        <Navbar />
        <Hero />
      </div>

      {/* === Main Content Sections (Code-split) === */}
      <Suspense fallback={<div className="w-full min-h-screen bg-primary" />}>
        <About />
        <Tech />
        <Works />
        <Education />
        <Leadership />
        <Certifications />

        {/* === Contact & Background Canvas === */}
        <div className="relative z-0">
          <Contact />
          <StarsCanvas />
        </div>

        {/* === Footer Section === */}
        <Footer />
      </Suspense>
    </div>
  );
};

export default App;
