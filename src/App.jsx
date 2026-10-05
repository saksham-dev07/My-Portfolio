
import Certifications from "./components/Certifications";
import ChapterBridge from "./components/ChapterBridge";
import Contact from "./components/Contact";
import Education from "./components/Education";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import BuildPlayground from "./components/interactive/BuildPlayground";
import MotionStudio from "./components/interactive/MotionStudio";
import Leadership from "./components/Leadership";
import Navbar from "./components/Navbar";
import Projects from "./components/Projects";
import SmallerBuilds from "./components/SmallerBuilds";
import SystemsLab from "./components/SystemsLab";
import Tech from "./components/Tech";
import { ArcadeProvider } from "./context/ArcadeContext";
import { RoleProvider } from "./context/RoleContext";
import { SoundProvider } from "./context/SoundContext";
import { ThemeMoodProvider } from "./context/ThemeMoodContext";

export default function App() {
  return (
    <ThemeMoodProvider>
      <RoleProvider>
        <SoundProvider>
          <ArcadeProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Navbar />
            <MotionStudio />
            <main id="main-content" tabIndex={-1}>
              <Hero />
              <ChapterBridge />
              <Projects />
              <SmallerBuilds />
              <BuildPlayground />
              <SystemsLab />
              <Tech />
              <Education />
              <Leadership />
              <Certifications />
              <Contact />
            </main>
            <Footer />

          </ArcadeProvider>
        </SoundProvider>
      </RoleProvider>
    </ThemeMoodProvider>
  );
}
