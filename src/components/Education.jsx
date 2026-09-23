import React, { memo } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { 
  GraduationCap, 
  Calendar, 
  Award, 
  Building2, 
  Trophy, 
  Sparkles,
  CheckCircle2,
  BookOpen,
  MapPin,
  TrendingUp
} from "lucide-react";
import { SectionWrapper } from "../hoc";
import { fadeIn } from "../utils/motion";
import { education, hackathons } from "../constants";

const vitCoursework = [
  "Data Structures & Algorithms",
  "Operating Systems",
  "Computer Networks",
  "Database Systems (DBMS)",
  "Object-Oriented Programming (Java/C++)",
  "Applied Machine Learning",
  "Deep Learning & Computer Vision",
  "Cloud Architecture (AWS)"
];

const Education = () => {
  const reduceMotion = useReducedMotion();

  // Primary degree (VIT Bhopal)
  const undergrad = education.find(item => item.id === 1) || education[0];
  // Secondary schooling
  const schooling = education.filter(item => item.id !== 1);

  return (
    <div className="space-y-12" id="education">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">06</span>
            <span>&bull;</span>
            <span>Academic Foundation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Education &amp; Academic Honors
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Undergraduate engineering curriculum at VIT Bhopal, specializations in AI/ML & systems, and foundational schooling.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
            <GraduationCap size={12} />
            <span>Class of 2027 &bull; CGPA 8.46</span>
          </span>
        </div>
      </div>

      {/* Flagship Undergrad Degree Card (Full Width Architectural Presentation) */}
      <Motion.div
        variants={reduceMotion ? {} : fadeIn("up", "spring", 0.1, 0.7)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        className="group relative rounded-3xl bg-zinc-900/60 border border-white/10 p-4 sm:p-8 backdrop-blur-xl hover:border-cyan-400/40 transition-all duration-300 shadow-2xl overflow-hidden"
      >
        {/* Specular top reflection line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Ambient backlight aura */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 group-hover:bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/5 group-hover:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 -ml-20 -mb-20" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {undergrad.profilePic ? (
                <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-zinc-900/90 border border-white/15 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:border-cyan-400/40 transition-colors">
                  <img
                    src={undergrad.profilePic}
                    alt={undergrad.institution}
                    className="w-full h-full max-w-full max-h-full object-contain"
                    width={48}
                    height={48}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-white/15 flex items-center justify-center shrink-0">
                  <GraduationCap size={24} className="text-cyan-400" />
                </div>
              )}

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  <GraduationCap size={13} />
                  <span>Bachelor of Technology</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  {undergrad.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 flex items-center gap-2">
                  <Building2 size={13} className="text-zinc-500" />
                  <span>{undergrad.institution}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-1.5 shadow-sm">
                <Calendar size={12} className="text-cyan-400" />
                <span>{undergrad.period}</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Class of 2027
              </span>
            </div>
          </div>

          {/* Performance & Academic Metric Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Metric 1: CGPA */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-emerald-400" />
                Cumulative Grade Point
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  8.46
                </span>
                <span className="text-xs font-mono text-zinc-500">/ 10.0</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">Consolidated B.Tech Standing</p>
            </div>

            {/* Metric 2: Specialization */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                Core Engineering Focus
              </span>
              <p className="text-sm font-bold text-zinc-100">
                Artificial Intelligence, Machine Learning &amp; Distributed Systems
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                {undergrad.description}
              </p>
            </div>
          </div>

          {/* Core Coursework Badges */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <BookOpen size={13} className="text-cyan-400" />
              <span>Key University Coursework:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {vitCoursework.map((course, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950/60 border border-white/10 text-xs font-mono text-zinc-300 hover:border-cyan-400/40 hover:text-white transition-colors"
                >
                  {course}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Motion.div>

      {/* Secondary Schooling Cards (Clean 2-Column Responsive Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schooling.map((item, idx) => (
          <Motion.div
            key={item.id}
            variants={reduceMotion ? {} : fadeIn("up", "spring", 0.2 + idx * 0.1, 0.6)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            className="group relative rounded-3xl bg-zinc-900/50 border border-white/10 p-4 sm:p-6 backdrop-blur-xl hover:border-white/20 transition-all shadow-xl overflow-hidden flex flex-col justify-between"
          >
            {/* Specular line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.profilePic && (
                    <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-xl bg-zinc-900/90 border border-white/15 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={item.profilePic}
                        alt={item.institution}
                        className="w-full h-full max-w-full max-h-full object-contain"
                        width={40}
                        height={40}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      {item.institution}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-400 shrink-0">
                  {item.period}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            {/* Score Badge */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">CBSE Board Score:</span>
              <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 font-bold text-cyan-400">
                {item.score}
              </span>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Subsection: Hackathons & Competitions */}
      <div className="pt-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
              <Trophy size={14} />
              <span>Competitive Milestones</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hackathons &amp; Competitions
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            National ML Hackathon &bull; Global Algorithmic Code
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hackathons.map((item, idx) => (
            <Motion.div
              key={item.id}
              variants={reduceMotion ? {} : fadeIn("up", "spring", 0.3 + idx * 0.1, 0.6)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
              className="group relative rounded-3xl bg-zinc-900/60 border border-white/10 p-4 sm:p-7 backdrop-blur-xl hover:border-amber-400/40 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between"
            >
              {/* Specular line */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              {/* Ambient flare */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 group-hover:bg-amber-500/10 rounded-full blur-2xl pointer-events-none transition-all duration-500 -mr-10 -mt-10" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                    <Trophy size={12} className="text-amber-400" />
                    <span>{item.tag}</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono px-2.5 py-0.5 rounded-full bg-zinc-950/60 border border-white/10">
                    {item.period}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold font-mono text-cyan-400">
                    {item.role}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                  {item.achievement}
                </p>
              </div>

              <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Verified Performance
                </span>
                <span className="text-zinc-400">National Stage</span>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WrappedEducation = SectionWrapper(memo(Education), "education");
WrappedEducation.displayName = "WrappedEducation";
export default WrappedEducation;
