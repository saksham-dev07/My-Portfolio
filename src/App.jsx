import { useLayoutEffect } from "react";
import { BrowserRouter } from "react-router-dom";

import {
  About,
  Certifications,
  Contact,
  Experience,
  Hero,
  Navbar,
  StarsCanvas,
  Tech,
  Works,
} from "./components";

const App = () => {
  // Scroll to top immediately on mount
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <BrowserRouter>
      <div className="relative z-0 bg-primary">
        
        {/* === Hero Section === */}
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar />
          <Hero />
        </div>

        {/* === Main Content Sections === */}
        <About />
        {/*<Experience />*/}
        <Tech />
        <Works />
        <Certifications />

        {/* === Contact & Background Canvas === */}
        <div className="relative z-0">
          <Contact />
          <StarsCanvas />
        </div>
        
      </div>
    </BrowserRouter>
  );
};

export default App;
