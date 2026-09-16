import React, { memo } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { GraduationCap, Calendar, Award, Building2, CheckCircle, Trophy, Sparkles } from "lucide-react";
import { SectionWrapper } from "../hoc";
import { education, hackathons } from "../constants";
import { fadeIn, staggerContainer, hoverLift } from "../utils/motion";

const EducationCard = memo(({ item, index }) => {
  const { title, institution, period, score, progress, description, profilePic } = item;
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

      {/* Ambient optical backlight glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-700 -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-500/5 group-hover:bg-cyan-500/15 rounded-full blur-2xl pointer-events-none transition-all duration-700 -ml-8 -mb-8" />

      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {profilePic ? (
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-zinc-900/90 backdrop-blur-md border border-white/15 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-cyan-400/40 transition-colors duration-300 flex items-center justify-center">
                <img
                  src={profilePic}
                  alt={`${institution} logo`}
                  className="w-full h-full object-contain rounded-lg"
                  loading="lazy"
                  decoding="async"
                  width={48}
                  height={48}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-accent shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:border-cyan-400/40 transition-colors duration-300">
                <GraduationCap size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
                <Building2 size={14} className="text-cyan-400/80" />
                <span className="font-medium text-zinc-300">{institution}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-island border border-white/10 text-xs font-semibold text-zinc-300 shadow-sm">
            <Calendar size={13} className="text-cyan-400" />
            <span>{period}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          {description}
        </p>

        {/* Score Progress bar indicator */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
              {score}
            </span>
            <span className="text-cyan-400 font-bold font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-zinc-950/80 rounded-full overflow-hidden border border-white/10 p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            <Motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: "easeOut", delay: index * 0.2 }}
            />
          </div>
        </div>
      </div>
    </Motion.div>
  );
});

EducationCard.displayName = "EducationCard";

const HackathonCard = memo(({ item, index }) => {
  const { title, role, period, achievement, tag } = item;
  const reduceMotion = useReducedMotion();

  return (
    <Motion.div
      variants={reduceMotion ? {} : fadeIn("up", "spring", index * 0.15, 0.7)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      whileHover={reduceMotion ? {} : { y: -5, transition: { type: "spring", stiffness: 350, damping: 25 } }}
      className="group relative glass-card glass-card-hover rounded-2xl p-6 border border-white/10 flex flex-col justify-between overflow-hidden"
    >
      {/* Top specular line */}
      <div className="specular-line" />

      {/* Ambient corner flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 group-hover:bg-amber-500/15 rounded-full blur-2xl pointer-events-none transition-all duration-500 -mr-6 -mt-6" />

      <div className="relative z-10 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Trophy size={13} className="text-amber-400" />
            {tag}
          </span>
          <span className="text-xs text-zinc-400 font-mono px-2.5 py-0.5 rounded-full bg-zinc-950/60 border border-white/10">
            {period}
          </span>
        </div>
        <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
          {title}
        </h4>
        <p className="text-sm font-semibold text-cyan-400">{role}</p>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {achievement}
        </p>
      </div>
    </Motion.div>
  );
});

HackathonCard.displayName = "HackathonCard";

const Education = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative py-10 bg-primary" aria-labelledby="education-heading">
      <div className="relative z-10 container mx-auto max-w-7xl">
        {/* Header matching global styled italic serif accents */}
        <div className="text-center mb-16">
          <div className="section-number-badge">
            <span className="number">04</span>
            <span>//</span>
            <span>Academic Timeline</span>
          </div>
          <p className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold">
            Academic Background
          </p>
          <h2
            id="education-heading"
            className="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4"
          >
            Education <span className="accent-gradient-text italic font-serif">Timeline</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Academic foundation, B.Tech CSE degree at VIT Bhopal, and competitive achievements.
          </p>
        </div>

        {/* Timeline cards stack */}
        <Motion.div
          variants={reduceMotion ? {} : staggerContainer(0.2, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          className="space-y-6 max-w-4xl mx-auto mb-20"
        >
          {education.map((item, idx) => (
            <EducationCard key={item.id || idx} item={item} index={idx} />
          ))}
        </Motion.div>

        {/* Hackathons & Competitions subsection */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-amber-400" size={20} />
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Hackathons & <span className="text-accent italic font-serif">Competitions</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hackathons.map((item, idx) => (
              <HackathonCard key={item.id || idx} item={item} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WrappedEducation = SectionWrapper(memo(Education), "education");
WrappedEducation.displayName = "WrappedEducation";
export default WrappedEducation;
