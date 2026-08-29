import { useEffect, useLayoutEffect } from "react";
import Lenis from "lenis";

import {
  About,
  Certifications,
  Education,
  Leadership,
  Contact,
  Footer,
  Hero,
  Navbar,
  StarsCanvas,
  Tech,
  Works,
} from "./components";

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

      {/* === Main Content Sections === */}
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
    </div>
  );
};

export default App;
