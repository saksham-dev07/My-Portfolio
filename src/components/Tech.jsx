import React, { memo } from "react";
import { motion as Motion } from "framer-motion";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";
import { textVariant } from "../utils/motion";

const Tech = () => {
  return (
    <div className="w-full">
      <Motion.div 
        variants={textVariant()} 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        className="w-full text-center mb-12 sm:mb-16"
      >
        <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
          Tools & Technologies
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100">
          Core <span className="accent-gradient-text italic font-serif">Tech Stack</span>
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-sm sm:text-base text-zinc-400 mx-auto">
          Frameworks, languages, databases, and developer tooling utilized across production workflows.
        </p>
      </Motion.div>

      {/* Modern Responsive Grid with glowing glass vector badges */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-5 max-w-7xl mx-auto">
        {technologies.map((tech, idx) => {
          const IconComponent = typeof tech.icon === 'function' ? tech.icon : null;

          return (
            <Motion.div
              key={tech.name || `tech-${idx}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
              whileHover={{ y: -5, scale: 1.04 }}
              className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl glass-card border border-white/10 hover:border-accent/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-300 cursor-pointer"
            >
              {/* Glowing top line on hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                {IconComponent ? (
                  <IconComponent className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.12)] group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                ) : (
                  <img 
                    src={tech.icon} 
                    alt={tech.name} 
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.12)] group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-300" 
                  />
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors duration-200 text-center">
                {tech.name}
              </span>
            </Motion.div>
          );
        })}
      </div>
    </div>
  );
};

const WrappedTech = SectionWrapper(memo(Tech), "tech");
WrappedTech.displayName = "WrappedTech";
export default WrappedTech;