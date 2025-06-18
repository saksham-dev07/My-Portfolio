// Enhanced Works and ProjectCard with performance optimization, improved accessibility, and better UX
import React, { useCallback, memo, useMemo, useState } from "react";
import Tilt from "react-parallax-tilt";
import {motion as Motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import PropTypes from "prop-types";
import clsx from "clsx";

import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";


// Enhanced theme constants
const THEME = {
  colors: {
    cardBg: "bg-gradient-to-br from-[#002B45] to-[#001920]",
    sectionBg: "bg-[#001920]",
    accent: "text-teal-300",
    primary: "text-white",
    secondary: "text-[#A0E7E5]",
    hover: "hover:text-teal-200",
  },
  animation: {
    duration: 0.3,
    springConfig: { type: "spring", damping: 25, stiffness: 300 },
  },
  spacing: {
    card: "p-5",
    gap: "gap-8",
  },
};

/**
 * Enhanced ProjectCard with improved accessibility, performance, and interactions
 */
const ProjectCard = memo(({ index, name, description, tags, image, source_code_link, live_demo }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isDesktop = useMediaQuery({ minWidth: 768 });
  const shouldReduceMotion = useReducedMotion();
  const tiltEnabled = isDesktop && !shouldReduceMotion;

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

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  // Enhanced Motion variants
  const cardVariants = useMemo(() => ({
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95,
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        ...THEME.animation.springConfig,
        delay: index * 0.1,
        duration: 0.6,
      },
    },
  }), [index]);

  return (
    <Motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={shouldReduceMotion ? {} : { y: -8 }}
      className="w-full max-w-sm mx-auto"
    >
      <Tilt
        tiltEnable={tiltEnabled}
        glareEnable={tiltEnabled}
        tiltMaxAngleX={tiltEnabled ? 8 : 0}
        tiltMaxAngleY={tiltEnabled ? 8 : 0}
        glareMaxOpacity={0.1}
        scale={tiltEnabled ? 1.02 : 1}
        transitionSpeed={600}
        className={clsx(
          "group relative rounded-2xl overflow-hidden outline-none",
          "shadow-xl hover:shadow-2xl transition-all duration-500",
          "backdrop-blur-sm border border-white/5",
          THEME.colors.cardBg,
          "focus-within:ring-2 focus-within:ring-teal-400/50 focus-within:ring-offset-2 focus-within:ring-offset-transparent",
          "transform-gpu" // GPU acceleration
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardInteraction}
          onKeyDown={handleCardKeyDown}
          aria-label={cardConfig.cardLabel}
          className="cursor-pointer"
        >
          {/* Enhanced image section with loading states */}
          <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
            <AnimatePresence mode="wait">
              {!imageError ? (
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={image}
                    alt={`${name} project screenshot`}
                    className={clsx(
                      "w-full h-full object-cover transition-all duration-500",
                      "group-hover:scale-105 group-hover:brightness-110"
                    )}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                  {/* Subtle overlay for better text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
                </Motion.div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-t-2xl">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">📷</span>
                    </div>
                    <span className="text-gray-400 text-sm">Preview unavailable</span>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Enhanced loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent animate-shimmer" />
              </div>
            )}

            {/* Always-visible GitHub button with enhanced styling */}
            <Motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.9)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGitHubClick}
              className={clsx(
                "absolute top-3 right-3 bg-black/80 backdrop-blur-md p-2.5 rounded-full",
                "focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-transparent",
                "transition-all duration-300 border border-white/20 shadow-lg",
                "hover:border-teal-400/50 z-10"
              )}
              aria-label={`View ${name} source code on GitHub`}
              tabIndex={0}
            >
              <img 
                src={github} 
                alt="" 
                className="w-4 h-4 brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" 
              />
            </Motion.button>

            {/* Project type indicator - repositioned to avoid overlap */}
            {cardConfig.hasLiveDemo && (
              <div className="absolute top-3 left-3 bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/40 shadow-sm">
                <span className="text-emerald-300 text-xs font-semibold tracking-wide">LIVE</span>
              </div>
            )}
          </div>

          {/* Enhanced content section with better spacing */}
          <div className="p-5 space-y-4 bg-gradient-to-b from-[#002B45] to-[#001920]">
            <div>
              <h3
                className={clsx(
                  THEME.colors.primary,
                  "font-bold text-xl sm:text-2xl leading-tight mb-2",
                  "group-hover:text-teal-100 transition-colors duration-300"
                )}
                title={name}
              >
                {name}
              </h3>
              <p className={clsx(
                THEME.colors.secondary,
                "text-sm leading-relaxed line-clamp-3"
              )}>
                {description}
              </p>
            </div>

            {/* Enhanced tags with better styling and spacing */}
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map(({ name: tagName, color }, tagIndex) => (
                <Motion.span
                  key={`${name}-${tagName}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: (index * 0.1) + (tagIndex * 0.05),
                    duration: 0.3 
                  }}
                  className={clsx(
                    "text-xs font-medium px-2.5 py-1 rounded-md",
                    "bg-white/10 border border-white/20 backdrop-blur-sm",
                    "hover:bg-white/15 hover:border-teal-400/30 transition-all duration-200",
                    "shadow-sm",
                    color || "text-gray-300"
                  )}
                >
                  #{tagName}
                </Motion.span>
              ))}
            </div>

            {/* Action indicators */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span>👆</span>
                {cardConfig.hasLiveDemo ? "Click to view demo" : "Click to view code"}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <img src={github} alt="" className="w-3 h-3 brightness-0 invert opacity-60" />
                Source
              </span>
            </div>
          </div>
        </div>

        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Tilt>
    </Motion.div>
  );
});

ProjectCard.displayName = "ProjectCard";

ProjectCard.propTypes = {
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(
    PropTypes.shape({ 
      name: PropTypes.string.isRequired, 
      color: PropTypes.string 
    })
  ).isRequired,
  image: PropTypes.string.isRequired,
  source_code_link: PropTypes.string.isRequired,
  live_demo: PropTypes.string,
};

/**
 * Enhanced Works section with improved layout and animations
 */
const Works = () => {
  
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }), []);

  const headerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: THEME.animation.springConfig,
    },
  }), []);

  return (
    <section className={clsx(
      "relative pt-20 pb-32 overflow-hidden",
      THEME.colors.sectionBg
    )}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-900/5 to-transparent" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <Motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Enhanced header */}
          <Motion.div variants={headerVariants} className="text-center lg:text-left">
            <Motion.p 
              className={clsx(
                THEME.colors.accent,
                "text-lg uppercase tracking-wider font-medium"
              )}
            >
              My Work
            </Motion.p>
            <Motion.h2 
              className={clsx(
                THEME.colors.primary,
                "text-4xl sm:text-5xl lg:text-6xl font-bold mt-2 bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent"
              )}
            >
              Projects
            </Motion.h2>
          </Motion.div>

          <Motion.p
            variants={headerVariants}
            className={clsx(
              THEME.colors.secondary,
              "mt-8 max-w-3xl leading-relaxed text-lg text-center lg:text-left"
            )}
          >
            These projects showcase my problem-solving abilities, proficiency with diverse technologies, 
            and effective project management skills. Each project represents a unique challenge and learning experience.
          </Motion.p>

          {/* Enhanced grid with better responsive behavior */}
          <Motion.div
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.3,
                },
              },
            }}
            className={clsx(
              "mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10",
              "auto-rows-max place-items-center"
            )}
          >
            {projects.map((project, idx) => (
              <ProjectCard key={`${project.name}-${idx}`} index={idx} {...project} />
            ))}
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
};

const WrappedWorks = SectionWrapper(Works, "projects");
WrappedWorks.displayName = "WrappedWorks";
export default WrappedWorks;