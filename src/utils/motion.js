// Basic animation variants
export const textVariant = (delay = 0) => {
  return {
    hidden: {
      y: -50,
      opacity: 0,
    },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        duration: 1.25,
        delay: delay,
      },
    },
  };
};



export const cardVariant = (delay = 0) => {
  return {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        delay: delay,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
};

// Enhanced animation variants to reduce repetition

// Hover animations
export const hoverLift = {
  y: -8,
  transition: { type: 'tween', duration: 0.2 }
};

export const hoverScale = (scale = 1.05) => ({
  scale,
  transition: { type: 'spring', stiffness: 300, damping: 20 }
});

export const hoverGlow = {
  boxShadow: "0 0 30px rgba(20, 184, 166, 0.3)",
  transition: { duration: 0.3 }
};

// Button animations
export const buttonTap = { scale: 0.95 };

export const buttonHover = {
  scale: 1.02,
  y: -2,
  transition: { type: 'spring', stiffness: 400, damping: 10 }
};

// Icon animations
export const iconSpin = {
  rotate: 360,
  transition: { duration: 2, repeat: Infinity, ease: "linear" }
};

export const iconFloat = (amplitude = 10) => ({
  y: [-amplitude, amplitude, -amplitude],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
});

export const iconRotateHover = {
  rotate: [0, 10, -10, 0],
  scale: 1.1,
  transition: { duration: 0.3 }
};



export const shimmerAnimation = {
  backgroundPosition: ["200% 0", "-200% 0"],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear"
  }
};

// Scroll animations
export const slideInFromLeft = (delay = 0) => ({
  hidden: {
    x: -100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay
    }
  }
});

export const slideInFromRight = (delay = 0) => ({
  hidden: {
    x: 100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay
    }
  }
});

export const slideInFromBottom = (delay = 0) => ({
  hidden: {
    y: 50,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay
    }
  }
});

// Badge animations
export const badgeEntrance = (delay = 0) => ({
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: { type: 'spring', duration: 0.5, delay }
});

export const badgePulse = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Particle animations
export const floatingParticle = (delay = 0, amplitude = 20) => ({
  y: [-amplitude, -amplitude * 2, -amplitude],
  opacity: [0.1, 0.6, 0.1],
  transition: {
    duration: 2 + delay,
    repeat: Infinity,
    ease: 'easeInOut',
    delay
  }
});

// Background animations
export const gradientShift = {
  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const breathingAnimation = {
  scale: [1, 1.02, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Text animations
export const typewriterAnimation = (text, delay = 0) => ({
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: {
      duration: text.length * 0.05,
      delay,
      ease: "easeInOut"
    }
  }
});

export const letterByLetter = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay
    }
  }
});

// Complex animations
export const morphAnimation = {
  scale: [1, 1.2, 0.8, 1],
  rotate: [0, 90, 180, 360],
  borderRadius: ["20%", "50%", "20%", "20%"],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const liquidAnimation = {
  borderRadius: ["60% 40% 30% 70%", "30% 60% 70% 40%", "60% 40% 30% 70%"],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Utility functions for common patterns
export const createStagger = (children, staggerDelay = 0.1) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.2
    }
  }
});

export const createBounce = (delay = 0) => ({
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8,
      delay
    }
  }
});

export const createSlideUp = (distance = 50, delay = 0) => ({
  hidden: { y: distance, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay
    }
  }
});

// Viewport-specific animations
export const viewportAnimation = {
  once: true,
  amount: 0.1
};

export const viewportAnimationHalf = {
  once: true,
  amount: 0.5
};

// Transition presets
export const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20
};

export const smoothTransition = {
  type: "tween",
  duration: 0.3,
  ease: "easeOut"
};

export const bounceTransition = {
  type: "spring",
  bounce: 0.5,
  duration: 0.8
};

// Combined animation sets for common UI elements
export const cardAnimations = {
  initial: "hidden",
  whileInView: "show",
  viewport: viewportAnimation,
  whileHover: hoverLift,
  variants: cardVariant()
};

export const buttonAnimations = {
  whileHover: buttonHover,
  whileTap: buttonTap
};

export const iconAnimations = {
  whileHover: iconRotateHover
};

// Helper function to create custom animations
export const createCustomVariant = (hiddenProps, visibleProps, transitionProps = {}) => ({
  hidden: hiddenProps,
  visible: {
    ...visibleProps,
    transition: {
      ...springTransition,
      ...transitionProps
    }
  }
});

// Add these motion variants to your existing motion.js file

// Enhanced skill tag animation with bounce effect
export const skillTagVariant = (index) => ({
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: index * 0.05,
      duration: 0.6,
    },
  },
});

// Glow effect for cards on hover
export const glowEffect = {
  hover: {
    boxShadow: [
      "0 0 20px rgba(168, 85, 247, 0.4)",
      "0 0 40px rgba(168, 85, 247, 0.2)",
      "0 0 60px rgba(168, 85, 247, 0.1)",
    ],
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Floating animation for background elements
export const floatingAnimation = {
  animate: {
    y: [-10, 10, -10],
    x: [-5, 5, -5],
    rotate: [-2, 2, -2],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Stagger container for sequential animations
export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Scale on hover with smooth spring animation
export const scaleOnHover = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
};

// Shimmer effect for skill tags
export const shimmerEffect = {
  hidden: {
    x: "-100%",
    opacity: 0,
  },
  visible: {
    x: "100%",
    opacity: [0, 1, 0],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

// Enhanced text reveal with multiple effects
export const textReveal = (delay = 0) => ({
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay,
    },
  },
});

// Magnetic hover effect
export const magneticHover = {
  hover: {
    scale: 1.02,
    rotateY: 5,
    rotateX: 5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

// Pulse animation for accent elements
export const pulseAnimation = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Slide in with rotation
export const slideInRotate = (direction = "left", delay = 0) => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -100 : 100,
    rotate: direction === "left" ? -10 : 10,
  },
  show: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      delay,
    },
  },
});

// Enhanced card hover with multiple effects
export const cardHoverEffect = {
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

// Morphing background gradient
export const morphingGradient = {
  animate: {
    background: [
      "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(45deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
    ],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Typewriter effect for text
export const typewriter = (text, delay = 0) => ({
  hidden: {
    width: 0,
  },
  show: {
    width: "auto",
    transition: {
      duration: text.length * 0.05,
      delay,
      ease: "easeInOut",
    },
  },
});

// Particle-like animation for decorative elements
export const particleFloat = (index) => ({
  animate: {
    y: [0, -20, 0],
    x: [0, Math.sin(index) * 10, 0],
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 3 + index * 0.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.2,
    },
  },
});

// Glass morphism effect
export const glassMorphism = {
  hover: {
    backdropFilter: "blur(20px)",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};
// motion.js - Enhanced animation configurations
export const slideIn = (direction, type, delay, duration) => {
  return {
    hidden: {
      x:
        direction === "left"
          ? "-100%"
          : direction === "right"
          ? "100%"
          : 0,
      y:
        direction === "up"
          ? "100%"
          : direction === "down"
          ? "-100%"
          : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: type,
        delay: delay,
        duration: duration,
        ease: "easeOut",
      },
    },
  };
};

export const fadeIn = (direction, type, delay, duration) => {
  return {
    hidden: {
      x:
        direction === "left"
          ? 100
          : direction === "right"
          ? -100
          : 0,
      y:
        direction === "up"
          ? 100
          : direction === "down"
          ? -100
          : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: type,
        delay: delay,
        duration: duration,
        ease: "easeOut",
      },
    },
  };
};

// New enhanced animations for the contact form
export const formFieldVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95 
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smooth motion
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }),
  focus: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

export const buttonVariants = {
  idle: { 
    scale: 1,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeInOut"
    }
  },
  loading: {
    scale: 1,
    transition: {
      duration: 0.2
    }
  },
  success: { 
    scale: 1.1,
    transition: {
      duration: 0.4,
      ease: "backOut"
    }
  }
};

export const progressVariants = {
  hidden: { 
    scaleX: 0,
    opacity: 0 
  },
  visible: (progress) => ({
    scaleX: progress / 100,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      opacity: { duration: 0.3 }
    }
  })
};

export const errorVariants = {
  hidden: { 
    opacity: 0, 
    height: 0,
    y: -10
  },
  visible: { 
    opacity: 1, 
    height: "auto",
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.6
    }
  }
};

export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: -15,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    rotateX: 5,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

export const iconVariants = {
  idle: {
    scale: 1,
    rotate: 0,
    color: "#9CA3AF"
  },
  focus: {
    scale: 1.1,
    rotate: 5,
    color: "#3B82F6",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  error: {
    scale: 1.1,
    rotate: -5,
    color: "#EF4444",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

export const loadingVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: "linear",
      repeat: Infinity
    }
  }
};

export const successPulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
};

export const textShimmerVariants = {
  shimmer: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      ease: "linear",
      repeat: Infinity
    }
  }
};

// Floating animation for decorative elements
export const floatingVariants = {
  float: {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
};

export const glowVariants = {
  idle: {
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)"
  },
  hover: {
    boxShadow: "0 0 40px rgba(59, 130, 246, 0.6)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(10px)"
  },
  in: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  },
  out: {
    opacity: 0,
    scale: 1.05,
    filter: "blur(10px)",
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  }
};