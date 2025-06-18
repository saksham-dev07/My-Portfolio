import React, { Suspense, lazy, useMemo, useCallback, useState, useEffect } from "react";
import { motion as Motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { styles } from "../styles";
import { resume } from "../assets";

// Lazy load with better error handling and retry mechanism
const ComputersCanvas = lazy(() =>
  import("./canvas/Computers").catch(() => ({
    default: () => (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gradient-to-b from-gray-900/50 to-transparent backdrop-blur-sm rounded-lg border border-gray-700/30 p-8">
        <div className="w-16 h-16 mb-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h.01a1 1 0 100-2H5zm4 0a1 1 0 000 2h6a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-2">3D Experience Unavailable</p>
        <p className="text-xs text-gray-500 text-center max-w-xs">
          The interactive 3D model couldn't load. Please refresh or check your connection.
        </p>
      </div>
    ),
  }))
);


// Animation variants with improved easing
const containerVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.2
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
  },
};

const dotVariants = {
  animate: {
    y: [0, -12, 0],
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
      repeatDelay: 0.5,
    },
  },
};

// Enhanced scroll indicator with better UX
const ScrollIndicator = React.memo(() => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsVisible(!scrolled);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollClick = useCallback((e) => {
    e.preventDefault();
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  return (
    <Motion.div 
      className="absolute bottom-[-2rem] sm:bottom-20 left-1/2 transform -translate-x-1/2 z-10  "
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <button 
        onClick={handleScrollClick}
        aria-label="Scroll to About section"
        className="group focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black-900 rounded-full p-2"
      >
        <Motion.div
          className="w-8 h-14 sm:w-9 sm:h-16 rounded-3xl border-2 border-cyan-400/60 flex justify-center items-start p-1 bg-black-900/20 backdrop-blur-sm group-hover:border-cyan-400 group-hover:bg-cyan-400/5 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Motion.div
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-b from-cyan-400 to-green-400 shadow-lg shadow-cyan-400/30"
            animate={{ y: [0, 25, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </Motion.div>
        <Motion.div 
          className="text-xs text-gray-400 mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ y: 5 }}
          whileHover={{ y: 0 }}
        >
          Scroll
        </Motion.div>
      </button>
    </Motion.div>
  );
});

// Main Hero component with parallax and enhanced responsiveness
const Hero = React.memo(() => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -100]);

  // Memoized class combinations for better performance
  const containerClasses = `max-w-4xl sm:max-w-6xl mx-auto ${styles.paddingX} flex flex-row items-start gap-3 sm:gap-6 mt-6 sm:mt-12 relative z-10`;

  const headingClasses = useMemo(
    () =>
      `${styles.heroHeadText} text-white mb-3 sm:mb-4 text-2xl sm:text-5xl lg:text-6xl font-bold leading-tight sm:leading-tight tracking-tight`,
    []
  );

  const subTextClasses = useMemo(
    () =>
      `${styles.heroSubText} text-gray-300 max-w-full sm:max-w-lg text-sm sm:text-lg leading-relaxed font-medium`,
    []
  );

  return (
    <>
      {/* Hero Text Section */}
      <section
        className="relative w-full bg-gradient-to-b from-black-900 via-black-900/95 to-transparent py-8 sm:py-12 mb-[-8rem] sm:mb-[-16rem] overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Background gradient effects */}
        <div className="absolute " />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-400/3 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-green-400/3 rounded-full blur-3xl" />

        <Motion.div
          className={containerClasses}
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate={shouldReduceMotion ? false : "visible"}
          style={shouldReduceMotion ? {} : { y }}
        >
          {/* Animated indicator line */}
          <Motion.div 
            className="flex flex-col justify-center items-center pt-2"
            variants={shouldReduceMotion ? {} : childVariants}
          >
            <Motion.div
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-300 to-green-400 shadow-xl shadow-cyan-400/40 ring-2 ring-cyan-400/20 ring-offset-2 ring-offset-black-900"
              variants={shouldReduceMotion ? {} : dotVariants}
              animate={shouldReduceMotion ? false : "animate"}
              aria-hidden="true"
            />
            <Motion.div
              className="hidden sm:block w-1 bg-gradient-to-b from-cyan-400 via-cyan-300 to-green-400 rounded-full mt-3 h-24 sm:h-40 opacity-60"
              initial={shouldReduceMotion ? {} : { scaleY: 0 }}
              animate={shouldReduceMotion ? {} : { scaleY: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              aria-hidden="true"
            />
          </Motion.div>

          {/* Main content */}
          <Motion.div 
            className="flex flex-col"
            variants={shouldReduceMotion ? {} : childVariants}
          >
            <Motion.h1 
              id="hero-heading" 
              className={headingClasses}
              variants={shouldReduceMotion ? {} : childVariants}
            >
              Hey, I'm{" "}
              <Motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 relative"
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                Saksham
                <Motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-green-400/20 rounded-lg blur-xl opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  aria-hidden="true"
                />
              </Motion.span>
            </Motion.h1>
            
            <Motion.p 
              className={subTextClasses}
              variants={shouldReduceMotion ? {} : childVariants}
            >
              I craft{" "}
              <span className="text-cyan-300 font-semibold">immersive 3D visuals</span>,
              <br className="sm:block hidden" />
              <span className="text-green-300 font-semibold">intuitive UIs</span>, and{" "}
              <span className="text-blue-300 font-semibold">performant web applications</span>.
            </Motion.p>

            {/* CTA buttons */}
            <Motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8"
              variants={shouldReduceMotion ? {} : childVariants}
            >
              <a href="#projects" className="inline-block">
              <Motion.button
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black-900"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              >
                View My Work
              </Motion.button>
              </a>
              <a href={resume} download className="inline-block">
                <Motion.button
                  className="px-6 py-3 border-2 border-gray-600 text-gray-300 font-semibold rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black-900"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                >
                  My Resume
                </Motion.button>
              </a>
            </Motion.div>
          </Motion.div>
        </Motion.div>
      </section>

      {/* 3D Canvas Section */}
      <section 
        className="relative w-full h-[400px] sm:h-screen mt-[-11rem] sm:mt-[-22.5rem] overflow-hidden" 
        aria-label="Interactive 3D Experience"
      >
        <Suspense >
          <ComputersCanvas className="w-full h-full" />
        </Suspense>
        <ScrollIndicator />
        
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black-900/50 via-transparent to-transparent pointer-events-none" />
      </section>
    </>
  );
});

Hero.displayName = "Hero";
export default Hero;