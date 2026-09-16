import React, { memo, useState, useMemo } from "react";
import { motion as Motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Layers, Cpu, Database, Server, Terminal, Globe } from "lucide-react";
import clsx from "clsx";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";
import { textVariant } from "../utils/motion";

const CATEGORIES = [
  { id: "all", label: "All Tech", icon: Layers },
  { id: "Languages", label: "Languages", icon: Terminal },
  { id: "Frontend", label: "Frontend", icon: Globe },
  { id: "Backend", label: "Backend", icon: Server },
  { id: "AI & ML", label: "AI & ML", icon: Cpu },
  { id: "Cloud & DB", label: "Cloud & DB", icon: Database },
  { id: "DevOps & Tools", label: "DevOps & Tools", icon: Sparkles },
];

const CATEGORY_COLORS = {
  Languages: {
    accent: "text-amber-400",
    glow: "rgba(251, 191, 36, 0.4)",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  Frontend: {
    accent: "text-cyan-400",
    glow: "rgba(6, 182, 212, 0.45)",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
  Backend: {
    accent: "text-emerald-400",
    glow: "rgba(52, 211, 153, 0.45)",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  "AI & ML": {
    accent: "text-purple-400",
    glow: "rgba(168, 85, 247, 0.5)",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  "Cloud & DB": {
    accent: "text-blue-400",
    glow: "rgba(59, 130, 246, 0.45)",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  "DevOps & Tools": {
    accent: "text-teal-400",
    glow: "rgba(45, 212, 191, 0.45)",
    badge: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  },
};

const TechCard = memo(({ tech, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = typeof tech.icon === "function" ? tech.icon : null;
  const categoryConfig = CATEGORY_COLORS[tech.category] || {
    accent: "text-cyan-400",
    glow: "rgba(6, 182, 212, 0.4)",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  };

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.15) }}
      whileHover={{ y: -6, scale: 1.05, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={{ scale: 0.96 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl glass-card border border-white/10 hover:border-white/25 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer overflow-visible aspect-square sm:aspect-[1/1.05]",
        isHovered ? "z-50 ring-1 ring-white/25" : "z-10"
      )}
    >
      {/* Top specular reflection line */}
      <div className="specular-line" />

      {/* Ambient glowing backlight tuned to category */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: categoryConfig.glow }}
      />

      {/* Vector Icon */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
        {IconComponent ? (
          <IconComponent aria-label={tech.name} className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.12)] group-hover:drop-shadow-[0_0_14px_rgba(59,130,246,0.7)] transition-all duration-300" />
        ) : (
          <img
            src={tech.icon}
            alt={tech.name}
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.12)] group-hover:drop-shadow-[0_0_14px_rgba(59,130,246,0.7)] transition-all duration-300"
            loading="lazy"
            decoding="async"
            width={48}
            height={48}
          />
        )}
      </div>

      {/* Tech Name */}
      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors duration-200 text-center tracking-tight">
        {tech.name}
      </span>

      {/* Interactive Tooltip on Hover (Floats above card with arrow and high z-index) */}
      <AnimatePresence>
        {isHovered && (
          <Motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-48 p-2.5 rounded-xl bg-zinc-950/95 backdrop-blur-2xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.85)] text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${categoryConfig.badge}`}>
                {tech.category}
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-200 leading-snug">
              {tech.desc}
            </p>
            {/* Tooltip downward notch arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-950 border-r border-b border-white/20" />
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
});

TechCard.displayName = "TechCard";

const Tech = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const reduceMotion = useReducedMotion();

  const filteredTech = useMemo(() => {
    if (activeCategory === "all") return technologies;
    return technologies.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const countsByCategory = useMemo(() => {
    const counts = { all: technologies.length };
    technologies.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="w-full relative py-6">
      {/* Subtle atmospheric gradient orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <Motion.div
        variants={reduceMotion ? {} : textVariant()}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        className="w-full text-center mb-10 sm:mb-12 relative z-10"
      >
        {/* Section number divider badge */}
        <div className="section-number-badge">
          <span className="number">02</span>
          <span>//</span>
          <span>Core Arsenal</span>
        </div>

        <p className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold">
          Tools & Frameworks
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100">
          Core <span className="accent-gradient-text italic font-serif">Tech Stack</span>
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-sm sm:text-base text-zinc-400 mx-auto">
          Production-proven languages, full-stack frameworks, AI runtimes, and cloud databases categorized for rapid inspection.
        </p>

        {/* Interactive Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 max-w-4xl mx-auto px-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            const count = countsByCategory[cat.id] || 0;

            return (
              <Motion.button
                key={cat.id}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 outline-none cursor-pointer border",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border-white/30"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border-white/10 hover:border-white/20 backdrop-blur-md"
                )}
              >
                <Icon size={14} className={isActive ? "text-cyan-200" : "text-zinc-400"} />
                <span>{cat.label}</span>
                <span className={clsx("text-[11px] font-mono px-1.5 py-0.2 rounded-full", isActive ? "bg-white/20 text-white" : "bg-zinc-900 text-zinc-500")}>
                  {count}
                </span>
              </Motion.button>
            );
          })}
        </div>
      </Motion.div>

      {/* Modern Responsive Grid with Category-tuned Glow & Tooltips */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-5 max-w-7xl mx-auto relative z-10"
        >
          {filteredTech.map((tech, idx) => (
            <TechCard key={tech.name} tech={tech} index={idx} />
          ))}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
};

const WrappedTech = SectionWrapper(memo(Tech), "tech");
WrappedTech.displayName = "WrappedTech";
export default WrappedTech;