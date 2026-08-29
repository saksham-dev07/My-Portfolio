import React, { forwardRef, memo } from "react";
import { motion as Motion } from "framer-motion";
import { styles } from "../styles";
import { staggerContainer } from "../utils/motion";

const SectionWrapper = (Component, idName, options = {}) => {
  const {
    padding = styles.padding,
    maxWidth = "max-w-7xl",
    viewportConfig = { once: true, amount: 0.05, margin: "0px 0px -20px 0px" },
    animationVariants = staggerContainer(),
    className = "",
    enableMemo = true,
    passRef = false,
  } = options;

  const combinedClassName = `${padding} ${maxWidth} mx-auto relative z-0 ${className}`.trim();

  const WrappedComponent = forwardRef((props, ref) => {
    return (
      <Motion.section
        variants={animationVariants}
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
      </Motion.section>
    );
  });

  const componentName = Component.displayName || Component.name || "Component";
  WrappedComponent.displayName = `SectionWrapper(${componentName}${idName ? `#${idName}` : ""})`;

  return enableMemo ? memo(WrappedComponent) : WrappedComponent;
};

export default SectionWrapper;