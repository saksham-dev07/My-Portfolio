import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { styles } from "../styles";
import { staggerContainer } from "../utils/motion";

const MOBILE_BREAKPOINT = 640;

const StarWrapper = (Component, idName) =>
  function HOC(props) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
      const debounce = (fn, delay = 150) => {
        let timer;
        return () => {
          clearTimeout(timer);
          timer = setTimeout(fn, delay);
        };
      };

      const handleResize = debounce(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      });

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <motion.section
        variants={staggerContainer()}
        initial={isMobile ? "show" : "hidden"}
        animate={isMobile ? "show" : undefined}
        whileInView={!isMobile ? "show" : undefined}
        viewport={!isMobile ? { once: true, amount: 0.25 } : undefined}
        className={`${styles.padding} max-w-7xl mx-auto relative z-0`}
      >
        <span className="hash-span" id={idName}>&nbsp;</span>
        <Component {...props} />
      </motion.section>
    );
  };

export default StarWrapper;
