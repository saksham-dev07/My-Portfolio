import React, { Suspense, lazy, useCallback, useState, useEffect, memo } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { Github, Linkedin, GraduationCap, Sparkles, ArrowRight, Download } from "lucide-react";
import { resume } from "../assets";

// Lazy load with fallback
const ComputersCanvas = lazy(() =>
  import("./canvas/Computers").catch(() => ({
    default: () => (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
        <div className="w-16 h-16 mb-4 bg-zinc-800 rounded-2xl flex items-center justify-center text-accent">
          <Sparkles size={32} />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Interactive 3D Workstation</p>
        <p className="text-xs text-zinc-500 text-center max-w-xs">
          Interactive WebGL preview
        </p>
      </div>
    ),
  }))
);

// Minimalist animated scroll indicator
const ScrollIndicator = memo(() => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 80;
      setIsVisible(!scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollClick = useCallback((e) => {
    e.preventDefault();
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      if (window.lenis) {
        window.lenis.scrollTo(aboutSection, { offset: -80, duration: 1.2 });
      } else {
        const yOffset = -80;
        const y = aboutSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-6 sm:bottom-8 w-full flex justify-center items-center z-20 pointer-events-auto">
      <button
        onClick={handleScrollClick}
        aria-label="Scroll to content"
        className="group flex flex-col items-center gap-2 focus:outline-none opacity-75 hover:opacity-100 transition-opacity duration-300"
      >
        <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5 group-hover:border-accent transition-colors bg-zinc-950/40 backdrop-blur-sm">
          <Motion.div
            className="w-1 h-1.5 rounded-full bg-accent"
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">
          Scroll
        </span>
      </button>
    </div>
  );
});
ScrollIndicator.displayName = "ScrollIndicator";

// Full-screen Immersive Hero
const Hero = memo(() => {
  const shouldReduceMotion = useReducedMotion();

  const handleProjectsClick = useCallback((e) => {
    e.preventDefault();
    const el = document.getElementById('projects');
    if (el) {
      if (window.lenis) {
        window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
      } else {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <section
      className="relative w-full h-screen mx-auto overflow-hidden bg-primary"
      aria-labelledby="hero-heading"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Floating Hero Content Overlay */}
      <div className="absolute inset-0 top-[95px] sm:top-[115px] max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-start gap-4 sm:gap-5 z-10 pointer-events-none">
        
        {/* Status Badges */}
        <Motion.div 
          className="flex flex-wrap items-center gap-2 pointer-events-auto"
          initial={shouldReduceMotion ? false : { opacity: 0, y: -15 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">Available for Hire</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 shadow-sm backdrop-blur-md">
            <GraduationCap size={13} className="text-accent" />
            <span className="text-xs font-semibold">VIT Bhopal • CGPA 8.46</span>
          </div>
        </Motion.div>

        {/* Main Headline */}
        <Motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <h1
            id="hero-heading"
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Hi, I'm <br className="sm:hidden" />
            <span className="accent-gradient-text italic font-serif">Saksham Agarwal</span>
          </h1>
        </Motion.div>

        {/* Subtitle / Bio */}
        <Motion.p
          className="text-zinc-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal drop-shadow-md"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Full-Stack Developer & Applied ML/AI Engineer building deepfake forensics platforms, LLM app compilers, and real-time distributed web systems.
        </Motion.p>

        {/* Interactive CTA Group */}
        <Motion.div
          className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <button
            onClick={handleProjectsClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_28px_rgba(59,130,246,0.55)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 group"
          >
            <span>Explore Projects</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a href={resume} download className="inline-block">
            <button
              className="px-5 py-3 liquid-glass-island text-zinc-200 text-sm font-semibold rounded-full hover:text-white hover:border-accent/40 hover:shadow-glassGlow transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              <span>Resume</span>
            </button>
          </a>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            <a 
              href="https://github.com/saksham-dev07" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="p-3 liquid-glass-island rounded-full text-zinc-400 hover:text-white hover:border-accent hover:shadow-glassGlow transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <Github size={16} />
            </a>
            <a
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 liquid-glass-island rounded-full text-zinc-400 hover:text-white hover:border-accent hover:shadow-glassGlow transition-all duration-300 active:scale-95 cursor-pointer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </Motion.div>

      </div>

      {/* Full-Screen 3D Interactive Canvas */}
      <div className="w-full h-full absolute inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3 bg-zinc-950/20">
            <div className="w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Loading 3D Experience...</p>
          </div>
        }>
          <ComputersCanvas />
        </Suspense>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-primary via-primary/50 to-transparent pointer-events-none z-10" />

      {/* Animated Scroll Indicator */}
      <ScrollIndicator />
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;