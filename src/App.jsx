import { ArrowUpRight } from "lucide-react";
import Certifications from "./components/Certifications";
import ChapterBridge from "./components/ChapterBridge";
import Contact from "./components/Contact";
import Education from "./components/Education";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import DeferredPlayground from "./components/interactive/DeferredPlayground";
import DiscoveryTools from "./components/interactive/DiscoveryTools";
import MotionStudio from "./components/interactive/MotionStudio";
import Leadership from "./components/Leadership";
import Navbar from "./components/Navbar";
import Projects from "./components/Projects";
import SmallerBuilds from "./components/SmallerBuilds";
import SystemsLab from "./components/SystemsLab";
import Tech from "./components/Tech";
import { RoleProvider } from "./context/RoleContext";
import { ThemeMoodProvider } from "./context/ThemeMoodContext";

export default function App({ onEnterExe }) {
  return (
    <ThemeMoodProvider>
      <RoleProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <MotionStudio />
        <DiscoveryTools />
        <main id="main-content" tabIndex={-1}>
          <Hero onEnterWorld={onEnterExe} />
          <Projects onEnterWorld={onEnterExe} />
          <ChapterBridge />
          <SmallerBuilds />
          <DeferredPlayground />
          <SystemsLab />
          <Tech />
          <Education />
          <Leadership />
          <Certifications />
          <div className="journey-invitation shell">
            <span className="mono">THE NEXT CHAPTER</span>
            <p>
              I've shown you how I think.
              <br />
              <em>What could we build?</em>
            </p>
            <a className="text-link" href="#contact">
              Start with a hello <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <Contact />
        </main>
        <Footer onEnterExe={onEnterExe} />
      </RoleProvider>
    </ThemeMoodProvider>
  );
}
