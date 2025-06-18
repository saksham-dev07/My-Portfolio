import { motion } from "framer-motion";
import React, { useMemo, forwardRef } from "react";
import { styles } from "../styles";
import { staggerContainer } from "../utils/motion";

const StarWrapper = (Component, idName, options = {}) => {
  const {
    padding = styles.padding,
    maxWidth = "max-w-7xl",
    viewportConfig = { once: true, amount: 0.25 },
    animationVariants = staggerContainer(),
    className = "",
    enableMemo = true,
    passRef = false
  } = options;

  const WrappedComponent = forwardRef((props, ref) => {
    // Memoize the motion variants to prevent unnecessary re-calculations
    const variants = useMemo(() => animationVariants, []);
    
    // Combine default classes with custom className
    const combinedClassName = useMemo(
      () => `${padding} ${maxWidth} mx-auto relative z-0 ${className}`.trim(),
      [padding, maxWidth, className]
    );

    return (
      <motion.section
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={viewportConfig}
        className={combinedClassName}
        ref={passRef ? ref : undefined}
      >
        <span className="hash-span" id={idName}>
          &nbsp;
        </span>
        {passRef ? (
          <Component ref={ref} {...props} />
        ) : (
          <Component {...props} />
        )}
      </motion.section>
    );
  });

  // Enhanced display name with better component identification
  const componentName = Component.displayName || Component.name || "Component";
  WrappedComponent.displayName = `StarWrapper(${componentName}${idName ? `#${idName}` : ""})`;

  // Conditionally apply memoization based on options
  return enableMemo ? React.memo(WrappedComponent) : WrappedComponent;
};

// Alternative composition-based approach for better flexibility
export const withStarWrapper = (options = {}) => (Component) => {
  return StarWrapper(Component, options.idName, options);
};

// Hook-based alternative for functional components that need more control
export const useStarWrapper = (idName, options = {}) => {
  const {
    padding = styles.padding,
    maxWidth = "max-w-7xl",
    viewportConfig = { once: true, amount: 0.25 },
    animationVariants = staggerContainer(),
    className = ""
  } = options;

  const variants = useMemo(() => animationVariants, []);
  const combinedClassName = useMemo(
    () => `${padding} ${maxWidth} mx-auto relative z-0 ${className}`.trim(),
    [padding, maxWidth, className]
  );

  return {
    sectionProps: {
      variants,
      initial: "hidden",
      whileInView: "show",
      viewport: viewportConfig,
      className: combinedClassName
    },
    hashSpan: (
      <span className="hash-span" id={idName}>
        &nbsp;
      </span>
    )
  };
};

export default StarWrapper;