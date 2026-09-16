import React, { memo } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { Users, Calendar, Palette, CheckCircle2, ShieldCheck } from "lucide-react";
import { SectionWrapper } from "../hoc";
import { leadership } from "../constants";
import { fadeIn, staggerContainer, hoverLift } from "../utils/motion";

const LeadershipCard = memo(({ item, index }) => {
  const { title, organization, period, highlights, profilePic } = item;
  const reduceMotion = useReducedMotion();

  return (
    <Motion.div
      variants={reduceMotion ? {} : fadeIn("up", "spring", index * 0.15, 0.7)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      whileHover={reduceMotion ? {} : { y: -5, transition: { type: "spring", stiffness: 350, damping: 25 } }}
      className="group relative glass-card glass-card-hover rounded-2xl p-6 sm:p-8 w-full border border-white/10 overflow-hidden"
    >
      {/* Top specular reflection line */}
      <div className="specular-line" />

      {/* Subtle background optical glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-700 -mr-8 -mt-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 group-hover:bg-cyan-500/15 rounded-full blur-2xl pointer-events-none transition-all duration-700 -ml-6 -mb-6" />

      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {profilePic ? (
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-zinc-900/90 backdrop-blur-md border border-white/15 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-cyan-400/40 transition-colors duration-300 flex items-center justify-center">
                <img
                  src={profilePic}
                  alt={`${organization} logo`}
                  className="w-full h-full object-contain rounded-lg"
                  loading="lazy"
                  decoding="async"
                  width={48}
                  height={48}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-accent shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-cyan-400/40 transition-colors duration-300">
                <Palette size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
                <Users size={14} className="text-cyan-400/80" />
                <span className="font-medium text-zinc-200">{organization}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-island border border-white/10 text-xs font-semibold text-zinc-300 shadow-sm">
            <Calendar size={13} className="text-cyan-400" />
            <span>{period}</span>
          </div>
        </div>

        {/* Highlights List */}
        <div className="space-y-3 pt-2">
          {highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-start gap-3 group/item">
              <CheckCircle2 size={16} className="text-cyan-400 mt-1 flex-shrink-0 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed group-hover/item:text-zinc-100 transition-colors">
                {highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Motion.div>
  );
});

LeadershipCard.displayName = "LeadershipCard";

const Leadership = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative py-10 bg-primary" aria-labelledby="leadership-heading">
      <div className="relative z-10 container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="section-number-badge">
            <span className="number">05</span>
            <span>//</span>
            <span>Leadership & Impact</span>
          </div>
          <p className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold">
            Extracurricular & Community Impact
          </p>
          <h2
            id="leadership-heading"
            className="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4"
          >
            Leadership & <span className="accent-gradient-text italic font-serif">Volunteering</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Team leadership, visual branding direction, and student community initiatives.
          </p>
        </div>

        {/* Cards container */}
        <Motion.div
          variants={reduceMotion ? {} : staggerContainer(0.2, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {leadership.map((item, idx) => (
            <LeadershipCard key={item.id || idx} item={item} index={idx} />
          ))}
        </Motion.div>
      </div>
    </div>
  );
};

const WrappedLeadership = SectionWrapper(memo(Leadership), "leadership");
WrappedLeadership.displayName = "WrappedLeadership";
export default WrappedLeadership;
