// motion.js - High-performance GPU accelerated transitions (zero CPU spring thrashing)

const CUBIC_EASE = [0.16, 1, 0.3, 1];

export const textVariant = (delay = 0) => ({
  hidden: {
    y: -15,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: CUBIC_EASE,
      delay,
    },
  },
});

export const fadeIn = (direction = "up", type = "tween", delay = 0, duration = 0.45) => ({
  hidden: {
    x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    opacity: 0,
  },
  show: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type,
      duration,
      delay,
      ease: CUBIC_EASE,
    },
  },
});

export const cardVariant = (delay = 0) => ({
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: CUBIC_EASE,
      delay,
    },
  },
});

export const skillTagVariant = (index = 0) => ({
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: CUBIC_EASE,
      delay: Math.min(index * 0.02, 0.2),
    },
  },
});

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0.04) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const hoverLift = {
  y: -5,
  transition: { duration: 0.25, ease: CUBIC_EASE },
};

export const hoverScale = {
  scale: 1.03,
  transition: { duration: 0.2, ease: CUBIC_EASE },
};

export const scaleOnHover = {
  scale: 1.04,
  transition: { duration: 0.2, ease: CUBIC_EASE },
};

export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.2, ease: CUBIC_EASE },
};

export const glowEffect = {
  hover: {
    boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)",
    transition: { duration: 0.2 },
  },
};

export const iconRotateHover = {
  rotate: 8,
  scale: 1.08,
  transition: { duration: 0.2, ease: CUBIC_EASE },
};

export const pulseAnimation = {
  animate: {
    scale: [1, 1.04, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const viewportAnimation = {
  once: true,
  amount: 0.05,
};