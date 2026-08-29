import React, { memo, useState, useMemo, Suspense } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Code2, 
  Globe, 
  BrainCircuit, 
  Database, 
  Terminal, 
  Sparkles,
  CheckCircle2,
  Cpu,
  Shield,
  Layers,
  Flame
} from 'lucide-react';
import clsx from 'clsx';
import { services } from '../constants';
import { SectionWrapper } from '../hoc';
import {
  cardVariant,
  glowEffect,
  staggerContainer,
  hoverLift
} from '../utils/motion';

const SKILL_GROUPS = [
  {
    id: 'languages',
    title: 'Programming Languages',
    subtitle: 'Core algorithmic & system development',
    icon: Code2,
    badge: 'Core Foundations',
    accentColor: 'blue',
    gridSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    borderGlow: 'hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
    tagStyle: 'bg-blue-500/10 text-blue-200 border-blue-500/20 hover:bg-blue-600 hover:text-white hover:border-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]',
    dotColor: 'bg-blue-400',
    skills: ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'C']
  },
  {
    id: 'web',
    title: 'Web & API Engineering',
    subtitle: 'Full-stack & distributed web platforms',
    icon: Globe,
    badge: 'Full-Stack',
    accentColor: 'cyan',
    gridSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    borderGlow: 'hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
    tagStyle: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]',
    dotColor: 'bg-cyan-400',
    skills: ['React.js', 'Next.js', 'FastAPI', 'Flask', 'Node.js', 'HTML5 & CSS3', 'RESTful APIs', 'WebSockets']
  },
  {
    id: 'cloud_db',
    title: 'Database & Cloud Platforms',
    subtitle: 'Scalable data stores & cloud backends',
    icon: Database,
    badge: 'Data & Infra',
    accentColor: 'emerald',
    gridSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    borderGlow: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    tagStyle: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    dotColor: 'bg-emerald-400',
    skills: ['SQL & Relational DBs', 'Firebase', 'Appwrite', 'Google Cloud Platform (GCP)', 'Cloud Architecture']
  },
  {
    id: 'ai_ml',
    title: 'Machine Learning & Applied AI',
    subtitle: 'Deep learning, computer vision & LLM pipelines',
    icon: BrainCircuit,
    badge: 'AI & Intelligence',
    accentColor: 'purple',
    gridSpan: 'col-span-12 md:col-span-6 lg:col-span-6',
    borderGlow: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    tagStyle: 'bg-purple-500/10 text-purple-200 border-purple-500/20 hover:bg-purple-600 hover:text-white hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    dotColor: 'bg-purple-400',
    skills: ['PyTorch', 'scikit-learn', 'TensorFlow', 'OpenCV & MediaPipe', 'Explainable AI (Grad-CAM, SHAP)', 'Generative AI (LLM Pipelines)', 'OCR (Tesseract)']
  },
  {
    id: 'tools',
    title: 'DevOps, Security & Tooling',
    subtitle: 'Engineering workflow & security forensics',
    icon: Terminal,
    badge: 'Tools & DevOps',
    accentColor: 'amber',
    gridSpan: 'col-span-12 md:col-span-6 lg:col-span-6',
    borderGlow: 'hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]',
    tagStyle: 'bg-amber-500/10 text-amber-200 border-amber-500/20 hover:bg-amber-600 hover:text-white hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    dotColor: 'bg-amber-400',
    skills: ['Git & GitHub', 'Docker', 'CI/CD Pipelines', 'YARA (Forensics)', 'Linux CLI', 'Jupyter Notebook', 'Vercel']
  }
];

const FILTER_TABS = [
  { id: 'all', label: 'All Capabilities' },
  { id: 'languages', label: 'Languages' },
  { id: 'web', label: 'Full-Stack Web' },
  { id: 'ai_ml', label: 'Applied AI/ML' },
  { id: 'cloud_db', label: 'Cloud & Data' },
  { id: 'tools', label: 'DevOps & Tools' },
];

const SkillCategoryCard = memo(({ group, index, isDimmed }) => {
  const { title, subtitle, icon: Icon, badge, borderGlow, tagStyle, dotColor, skills } = group;
  const reduceMotion = useReducedMotion();

  return (
    <Motion.div
      variants={reduceMotion ? {} : cardVariant(index * 0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      whileHover={reduceMotion ? {} : hoverLift}
      animate={{ opacity: isDimmed ? 0.35 : 1, scale: isDimmed ? 0.98 : 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "group relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-full",
        "glass-card border border-white/10",
        borderGlow
      )}
    >
      {/* Top accent glow gradient */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

      <div>
        {/* Card Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-400 block mb-0.5">
              {badge}
            </span>
            <h4 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug">
              {title}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Skills Chips Grid */}
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className={clsx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-default",
                tagStyle
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full", dotColor)} />
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer Meta */}
      <div className="pt-5 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <CheckCircle2 size={13} />
          <span>Production Ready</span>
        </span>
        <span className="font-mono text-[11px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-white/5">
          {skills.length} skills
        </span>
      </div>
    </Motion.div>
  );
});
SkillCategoryCard.displayName = 'SkillCategoryCard';

const ServiceCard = memo(({ service, index }) => {
  const { title, icon: Icon } = service;
  const reduceMotion = useReducedMotion();

  return (
    <Motion.div
      variants={reduceMotion ? {} : cardVariant(index * 0.1)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      className="group relative w-full max-w-sm mx-auto"
    >
      <Suspense fallback={
        <div className="w-full h-64 bg-zinc-900 rounded-2xl border border-zinc-800 animate-pulse" />
      }>
        <Motion.div
          className="relative glass-card glass-card-hover rounded-2xl p-8 h-full flex flex-col items-center overflow-hidden border border-white/10 group"
          variants={reduceMotion ? {} : glowEffect}
          whileHover="hover"
          role="article"
          aria-labelledby={`service-${index}-title`}
        >
          {/* Top gradient glow bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative p-4 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-lg group-hover:border-accent/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                <Icon className="w-10 h-10 text-accent drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 
                id={`service-${index}-title`}
                className="text-zinc-100 text-lg font-semibold group-hover:text-accent transition-colors"
              >
                {title}
              </h3>
              <p 
                className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto"
              >
                {title} architecture with modern industry best practices.
              </p>
            </div>
          </div>
        </Motion.div>
      </Suspense>
    </Motion.div>
  );
});
ServiceCard.displayName = 'ServiceCard';

const About = memo(() => {
  const [activeTab, setActiveTab] = useState('all');
  const reduceMotion = useReducedMotion();

  const totalSkillsCount = useMemo(() => {
    return SKILL_GROUPS.reduce((acc, curr) => acc + curr.skills.length, 0);
  }, []);

  return (
    <div 
      className="relative py-2 bg-primary"
      aria-labelledby="about-heading"
    >
      <div className="relative z-10 container mx-auto max-w-7xl">
        {/* Header section */}
        <header className="text-center mb-10 sm:mb-14">
          <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
            Overview & Core Competencies
          </p>
          <h2 
            id="about-heading" 
            className="text-4xl sm:text-5xl font-bold text-zinc-100"
          >
            Technical <span className="accent-gradient-text italic font-serif">Proficiency</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            B.Tech CSE student at <strong>VIT Bhopal (CGPA: 8.46/10, Class of 2027)</strong> specializing in full-stack web engineering, applied ML/AI systems, and cybersecurity forensics.
          </p>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 max-w-4xl mx-auto">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 outline-none",
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-blue-500/25 border border-blue-400/40"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'all' && (
                    <span className="ml-1.5 text-[11px] font-mono opacity-80">({totalSkillsCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Symmetrical Bento Box Grid */}
        <div className="mb-24">
          <div className="grid grid-cols-12 gap-6">
            {SKILL_GROUPS.map((group, index) => {
              const isDimmed = activeTab !== 'all' && activeTab !== group.id;
              return (
                <div 
                  key={group.id}
                  className={clsx(group.gridSpan, "transition-all duration-300")}
                >
                  <SkillCategoryCard group={group} index={index} isDimmed={isDimmed} />
                </div>
              );
            })}
          </div>
        </div>

        {/* What I Do - Services Subsection */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-semibold text-zinc-300 mb-3 shadow-sm">
              <Sparkles size={13} className="text-yellow-400" />
              <span>Specialized Domains</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Areas of <span className="text-accent italic font-serif">Expertise</span>
            </h3>
          </div>

          <Motion.div 
            variants={reduceMotion ? {} : staggerContainer(0.12, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center"
            role="list"
            aria-label="Services offered"
          >
            {services.map((service, index) => (
              <ServiceCard key={service.title} service={service} index={index} />
            ))}
          </Motion.div>
        </div>
      </div>
    </div>
  );
});

About.displayName = 'About';
const WrappedAbout = SectionWrapper(About, 'about', { padding: "px-4 pt-2 pb-8 xs:px-6 sm:px-16 sm:pt-4 sm:pb-12" });
WrappedAbout.displayName = 'WrappedAbout';
export default WrappedAbout;