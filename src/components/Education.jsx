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
      whileHover={hoverLift}
      className="group relative glass-card glass-card-hover rounded-2xl p-6 sm:p-8 w-full border border-white/10"
    >
      {/* Glow highlight on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profilePic ? (
              <img
                src={profilePic}
                alt={`${institution} logo`}
                className="w-12 h-12 rounded-xl object-contain p-1 bg-zinc-900 border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-accent">
                <GraduationCap size={24} />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
                <Building2 size={14} className="text-zinc-500" />
                <span>{institution}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/60 border border-white/10 text-xs font-semibold text-zinc-300">
            <Calendar size={13} className="text-accent" />
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
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" />
              {score}
            </span>
            <span className="text-accent font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <Motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-accent rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: index * 0.2 }}
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
      whileHover={hoverLift}
      className="group relative glass-card glass-card-hover rounded-2xl p-6 border border-white/10 flex flex-col justify-between"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1">
            <Trophy size={12} />
            {tag}
          </span>
          <span className="text-xs text-zinc-500 font-mono">{period}</span>
        </div>
        <h4 className="text-lg font-bold text-white group-hover:text-accent transition-colors">
          {title}
        </h4>
        <p className="text-sm font-semibold text-accent">{role}</p>
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
          <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
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
