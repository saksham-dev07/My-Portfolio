import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { BallCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";
import {  textVariant } from "../utils/motion";
import { styles } from "../styles";
import { useSwipeable } from "react-swipeable";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from "lucide-react";

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVisibleCount = useCallback(() => {
    const { width } = windowSize;
    if (width >= 1280) return 6; // xl screens
    if (width >= 1024) return 4; // lg screens  
    if (width >= 768) return 3;  // md screens
    if (width >= 640) return 2;  // sm screens
    return 2; // mobile
  }, [windowSize]);

  return { windowSize, getVisibleCount };
};

const Tech = () => {
  const { getVisibleCount } = useResponsive();
  const visibleCount = getVisibleCount();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);

  // Ensure we have technologies data
  const techList = useMemo(() => {
    return Array.isArray(technologies) ? technologies : [];
  }, []);

  const total = techList.length;
  const slideCount = Math.max(1, Math.ceil(total / Math.max(1, visibleCount)));

  // Create slides with proper error handling
  const slides = useMemo(() => {
    if (total === 0) return [[]];
    
    return Array.from({ length: slideCount }, (_, i) => {
      const start = i * visibleCount;
      const end = Math.min(start + visibleCount, total);
      return techList.slice(start, end);
    });
  }, [slideCount, visibleCount, techList, total]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && slideCount > 1 && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        setDirection(1);
        setCurrentSlide(prev => (prev + 1) % slideCount);
      }, 4000);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, slideCount, isHovered]);

  // Navigation handlers
  const slideTo = useCallback((index) => {
    if (index === currentSlide || slideCount <= 1) return;
    
    const normalizedIndex = ((index % slideCount) + slideCount) % slideCount;
    const newDirection = normalizedIndex > currentSlide ? 1 : -1;
    
    setDirection(newDirection);
    setCurrentSlide(normalizedIndex);
  }, [currentSlide, slideCount]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentSlide === 0 ? slideCount - 1 : currentSlide - 1;
    slideTo(newIndex);
  }, [currentSlide, slideCount, slideTo]);

  const goToNext = useCallback(() => {
    const newIndex = (currentSlide + 1) % slideCount;
    slideTo(newIndex);
  }, [currentSlide, slideCount, slideTo]);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
  });

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!containerRef.current?.contains(document.activeElement)) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        toggleAutoPlay();
        break;
      case 'Home':
        e.preventDefault();
        slideTo(0);
        break;
      case 'End':
        e.preventDefault();
        slideTo(slideCount - 1);
        break;
      default:
        break;
    }
  }, [goToPrevious, goToNext, toggleAutoPlay, slideTo, slideCount]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Animation variants
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const techItemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9,
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const springTransition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  };

  // Early return if no technologies
  if (total === 0) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-secondary">No technologies to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Motion.div 
        variants={textVariant()} 
        className="w-full text-center mb-8"
      >
        <p className={styles.sectionSubText}>My Expertise</p>
        <h2 className={styles.sectionHeadText}>Tech Stack & Tools</h2>
      </Motion.div>

      {/* Desktop/Tablet Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 lg:gap-8 place-items-center">
        {techList.map((tech, idx) => (
          <Motion.div
            key={tech.name || `tech-${idx}`}
            custom={idx}
            variants={techItemVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true, margin: "-50px" }}
            className="group w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 cursor-pointer flex flex-col items-center"
            role="img"
            aria-label={`${tech.name || 'Technology'} icon`}
          >
            <div className="w-full h-full">
              <BallCanvas icon={tech.icon} />
            </div>
            <Motion.p 
              className="text-xs text-center mt-2 text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              {tech.name || 'Unknown'}
            </Motion.p>
          </Motion.div>
        ))}
      </div>

      {/* Mobile Carousel */}
      <div 
        className="sm:hidden relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Technology stack carousel"
        tabIndex={0}
      >
        {/* Progress bar */}
        {slideCount > 1 && (
          <div className="mb-4">
            <div className="w-full h-1 bg-tertiary/30 rounded-full overflow-hidden">
              <Motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentSlide + 1) / slideCount) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Slide Container */}
        <div 
          {...swipeHandlers} 
          className="overflow-hidden relative h-32 rounded-lg bg-tertiary/10 backdrop-blur-sm border border-white/10"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <Motion.div
              key={`slide-${currentSlide}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
              className="absolute inset-0 flex justify-center items-center gap-4 px-4"
            >
              {slides[currentSlide]?.map((tech, idx) => (
                <Motion.div
                  key={`${tech.name || idx}-${currentSlide}`}
                  custom={idx}
                  variants={techItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center group"
                >
                  <div className="w-16 h-16 mb-2">
                    <BallCanvas icon={tech.icon} />
                  </div>
                  <span className="text-xs text-secondary text-center truncate max-w-[60px]">
                    {tech.name || 'Unknown'}
                  </span>
                </Motion.div>
              )) || []}
            </Motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {slideCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            {/* Previous Button */}
            <Motion.button
              onClick={goToPrevious}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-tertiary/20 hover:bg-tertiary/40 backdrop-blur-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black-100"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </Motion.button>

            {/* Dots Indicators */}
            <div className="flex space-x-2" role="tablist" aria-label="Carousel pagination">
              {slides.map((_, idx) => (
                <Motion.button
                  key={idx}
                  onClick={() => slideTo(idx)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-black-100 ${
                    idx === currentSlide 
                      ? "bg-primary shadow-lg" 
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === currentSlide ? "true" : "false"}
                  role="tab"
                />
              ))}
            </div>

            {/* Next Button */}
            <Motion.button
              onClick={goToNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-tertiary/20 hover:bg-tertiary/40 backdrop-blur-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black-100"
              aria-label="Next slide"
            >
              <ChevronRightIcon size={20} className="text-white" />
            </Motion.button>
          </div>
        )}

        {/* Auto-play Toggle & Info */}
        {slideCount > 1 && (
          <div className="flex flex-col items-center mt-4 space-y-2">
            <Motion.button
              onClick={toggleAutoPlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-secondary/20 hover:bg-secondary/30 backdrop-blur-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1 focus:ring-offset-black-100"
              aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
            >
              {isAutoPlaying ? (
                <PauseIcon size={14} className="text-white" />
              ) : (
                <PlayIcon size={14} className="text-white" />
              )}
              <span className="text-xs text-white">
                {isAutoPlaying ? "Pause" : "Play"}
              </span>
            </Motion.button>

            {/* Slide Counter */}
            <div className="text-center">
              <span className="text-xs text-secondary/70">
                {currentSlide + 1} of {slideCount}
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center mt-3">
          <p className="text-xs text-secondary/50">
            Swipe or use arrow keys to navigate
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectionWrapper(Tech, "tech");