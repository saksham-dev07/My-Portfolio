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
      whileHover={hoverLift}
      className="group relative glass-card glass-card-hover rounded-2xl p-6 sm:p-8 w-full border border-white/10"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profilePic ? (
              <img
                src={profilePic}
                alt={`${organization} logo`}
                className="w-12 h-12 rounded-xl object-contain p-1 bg-zinc-900 border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-accent">
                <Palette size={24} />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
                <Users size={14} className="text-accent" />
                <span className="font-medium text-zinc-300">{organization}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/60 border border-white/10 text-xs font-semibold text-zinc-300">
            <Calendar size={13} className="text-accent" />
            <span>{period}</span>
          </div>
        </div>

        {/* Highlights List */}
        <div className="space-y-3 pt-2">
          {highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-accent mt-1 flex-shrink-0" />
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
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
          <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
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
