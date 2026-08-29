import React, { useCallback, memo, useMemo, useState } from "react";
import {motion as Motion, useReducedMotion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";

import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";


// Minimalist theme configuration
const THEME = {
  animation: {
    duration: 0.3,
    springConfig: { type: "spring", damping: 25, stiffness: 300 },
  },
};

/**
 * Enhanced ProjectCard with improved accessibility, performance, and interactions
 */
const ProjectCard = memo(({ index, name, description, tags, image, source_code_link, live_demo }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const shouldReduceMotion = useReducedMotion();

  // Memoize computed values
  const cardConfig = useMemo(() => ({
    primaryLink: live_demo || source_code_link,
    hasLiveDemo: !!live_demo,
    cardLabel: live_demo ? `View ${name} live demo` : `View ${name} source code`,
  }), [live_demo, source_code_link, name]);

  // Enhanced interaction handlers with error handling
  const handleCardInteraction = useCallback(() => {
    if (cardConfig.primaryLink) {
      try {
        window.open(cardConfig.primaryLink, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.warn("Failed to open link:", error);
      }
    }
  }, [cardConfig.primaryLink]);

  const handleGitHubClick = useCallback((e) => {
    e.stopPropagation();
    if (source_code_link) {
      try {
        window.open(source_code_link, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.warn("Failed to open GitHub link:", error);
      }
    }
  }, [source_code_link]);

  const handleCardKeyDown = useCallback((e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.defaultPrevented) {
      e.preventDefault();
      handleCardInteraction();
    }
  }, [handleCardInteraction]);

  const handleLiveClick = useCallback((e) => {
    e.stopPropagation();
    if (live_demo) {
      try {
        window.open(live_demo, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.warn("Failed to open Live link:", error);
      }
    }
  }, [live_demo]);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  // Enhanced Motion variants optimized for fast mobile rendering
  const cardVariants = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      return {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0, transition: { duration: 0 } },
      };
    }
    return {
      hidden: { 
        opacity: 0, 
        y: 40,
      },
      show: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: "tween",
          ease: "easeOut",
          delay: index * 0.08,
          duration: 0.5,
        },
      },
    };
  }, [index]);

  return (
    <Motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      className={clsx(
        "group relative rounded-2xl overflow-hidden outline-none",
        "glass-card glass-card-hover",
        "w-full max-w-sm mx-auto flex flex-col h-full"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardInteraction}
        onKeyDown={handleCardKeyDown}
        aria-label={cardConfig.cardLabel}
        className="cursor-pointer flex flex-col h-full"
      >
          {/* Enhanced image section with loading states */}
          <div className="relative w-full h-56 overflow-hidden rounded-t-2xl bg-zinc-900/80">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-zinc-800/80 animate-pulse flex items-center justify-center">
                  <span className="text-zinc-600 text-xs">Loading image...</span>
                </div>
              )}
              {!imageError ? (
                <img
                  src={image}
                  alt={`${name} project screenshot`}
                  className={clsx(
                    "w-full h-full object-cover object-top transition-all duration-500",
                    imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                    "group-hover:scale-105"
                  )}
                  loading="lazy"
                  decoding="async"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">📷</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Link buttons container */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                {live_demo && (
                  <button
                    onClick={handleLiveClick}
                    className="bg-zinc-950/80 backdrop-blur-md p-2.5 rounded-full hover:bg-zinc-800 transition-colors shadow-glass"
                    aria-label={`View ${name} live demo`}
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </button>
                )}
                {source_code_link && (
                  <button
                    onClick={handleGitHubClick}
                    className="bg-zinc-950/80 backdrop-blur-md p-2.5 rounded-full hover:bg-zinc-800 transition-colors shadow-glass"
                    aria-label={`View ${name} source code on GitHub`}
                  >
                    <img 
                      src={github} 
                      alt="GitHub" 
                      className="w-5 h-5 invert" 
                    />
                  </button>
                )}
              </div>
          </div>

          <div className="p-6 flex flex-col flex-grow justify-between">
            <div>
              <h3 className="text-zinc-100 font-bold text-[20px] mb-2 group-hover:text-accent transition-colors flex items-center justify-between">
                <span>{name}</span>
              </h3>
              <p className="mt-1 text-zinc-400 text-[13px] sm:text-[14px] leading-relaxed line-clamp-3">
                {description}
              </p>
            </div>

            {/* Enhanced tags */}
            <div className="flex flex-wrap gap-1.5 pt-5 border-t border-white/5 mt-4">
              {tags.map(({ name: tagName, color }) => (
                <span
                  key={`${name}-${tagName}`}
                  className={clsx(
                    "px-2.5 py-1 rounded-md bg-zinc-950/70 border border-white/5 text-[11px] font-medium font-mono transition-colors",
                    color || "text-zinc-300"
                  )}
                >
                  #{tagName}
                </span>
              ))}
            </div>
          </div>
        </div>
    </Motion.div>
  );
});

ProjectCard.displayName = "ProjectCard";

const CATEGORIES = [
  { id: "all", label: "All Projects" },
  { id: "ai", label: "AI & ML" },
  { id: "fullstack", label: "Full-Stack Web" },
  { id: "systems", label: "Security & Tools" },
];

/**
 * Enhanced Works section with interactive domain filtering
 */
const Works = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return projects;
    if (activeCategory === "ai") {
      return projects.filter(p => 
        p.tags.some(t => ["PyTorch", "OpenCV", "Gemini AI", "Generative AI", "LLM Pipeline", "MediaPipe"].includes(t.name))
      );
    }
    if (activeCategory === "fullstack") {
      return projects.filter(p => 
        p.tags.some(t => ["React", "React 18", "TypeScript", "Node.js", "JavaScript", "HTML/CSS", "Puppeteer", "Leaflet / Maps"].includes(t.name))
      );
    }
    if (activeCategory === "systems") {
      return projects.filter(p => 
        ["Malware Detector & Security Forensics", "Blockforge Ad Blocker", "Code Comment Remover"].includes(p.name) ||
        p.tags.some(t => ["PE Forensics", "Cybersecurity", "YARA", "Browser Extension"].includes(t.name))
      );
    }
    return projects;
  }, [activeCategory]);
  
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }), []);

  const headerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: THEME.animation.springConfig,
    },
  }), []);

  return (
    <div className="relative pt-2 pb-12">
      <div className="w-full relative z-10">
        <Motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
        >
          {/* Unified header matching global design language */}
          <Motion.div variants={headerVariants} className="text-center mb-8">
            <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
              Portfolio & Engineering Builds
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100">
              Featured <span className="accent-gradient-text italic font-serif">Projects</span>
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-sm sm:text-base text-zinc-400 mx-auto">
              Production-grade distributed platforms, deepfake forensics pipelines, LLM compilers, and full-stack systems with live deployments.
            </p>
          </Motion.div>

          {/* Interactive Domain Filter Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-12">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-95 border",
                    isActive
                      ? "bg-accent text-white border-accent shadow-[0_0_16px_rgba(59,130,246,0.35)]"
                      : "bg-zinc-900/80 text-zinc-400 border-white/10 hover:text-white hover:border-white/20 hover:bg-zinc-800"
                  )}
                >
                  {cat.label}
                  <span className={clsx(
                    "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {cat.id === "all" ? projects.length : 
                     cat.id === "ai" ? projects.filter(p => p.tags.some(t => ["PyTorch", "OpenCV", "Gemini AI", "Generative AI", "LLM Pipeline", "MediaPipe"].includes(t.name))).length :
                     cat.id === "fullstack" ? projects.filter(p => p.tags.some(t => ["React", "React 18", "TypeScript", "Node.js", "JavaScript", "HTML/CSS", "Puppeteer", "Leaflet / Maps"].includes(t.name))).length :
                     projects.filter(p => ["Malware Detector & Security Forensics", "Blockforge Ad Blocker", "Code Comment Remover"].includes(p.name) || p.tags.some(t => ["PE Forensics", "Cybersecurity", "YARA", "Browser Extension"].includes(t.name))).length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Enhanced grid with dynamic filtering */}
          <Motion.div
            layout
            className={clsx(
              "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10",
              "auto-rows-max place-items-center"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <ProjectCard key={`${project.name}-${idx}`} index={idx} {...project} />
              ))}
            </AnimatePresence>
          </Motion.div>
        </Motion.div>
      </div>
    </div>
  );
};

const WrappedWorks = SectionWrapper(Works, "projects");
WrappedWorks.displayName = "WrappedWorks";
export default WrappedWorks;