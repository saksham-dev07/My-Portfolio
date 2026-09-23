import React, { memo, useCallback, useState, useEffect, useRef } from "react";
import { motion as Motion, useInView } from "framer-motion";
import { 
  ArrowUp, 
  ArrowUpRight,
  Github, 
  Linkedin, 
  Mail, 
  Copy, 
  Check, 
  FileText, 
  Code2, 
  Radio, 
  Activity,
  Sun,
  Moon,
  Sparkles,
  Compass,
  Cpu,
  Layers,
  Award,
  GitBranch,
  Zap,
  Heart
} from "lucide-react";
import { profile, resume } from "../assets";

/* ── Static Data ── */
const DIRECTORY = [
  { id: "projects", num: "01", title: "Selected Work" },
  { id: "smaller-builds", num: "02", title: "Additional Projects" },
  { id: "systems-lab", num: "03", title: "Systems & Cloud Lab" },
  { id: "skills", num: "04", title: "Technical Toolkit" },
  { id: "credentials", num: "05", title: "Official Credentials" },
  { id: "education", num: "06", title: "Academic Honors" },
  { id: "leadership", num: "07", title: "Leadership & Impact" },
  { id: "contact", num: "08", title: "Direct Outreach" },
];

const CASE_STUDIES = [
  { name: "Deepfake Forensics", tag: "XAI / MesoNet / Grad-CAM", target: "projects" },
  { name: "NL App Compiler", tag: "Deterministic AST & UI Synth", target: "projects" },
  { name: "DocPilot Clinical AI", tag: "16kHz Audio & HIPAA Scribe", target: "projects" },
  { name: "NexusBoard CRDT", tag: "Vector Clocks & Canvas Sync", target: "projects" },
  { name: "Systems & Cloud Lab", tag: "HTTP/3, gRPC & Inference", target: "systems-lab" },
];

const MARQUEE_TECH = [
  "React 19", "Tailwind CSS", "Vite 6", "Framer Motion", "Lenis Scroll",
  "Resend API", "Vercel Edge", "Three.js", "React Three Fiber",
];

const STATS = [
  { label: "Flagship Projects", value: 4, icon: Layers },
  { label: "Certifications", value: 10, icon: Award },
  { label: "Repositories", value: 12, icon: GitBranch },
  { label: "Technologies", value: 35, icon: Zap },
];

/* ── Animated Counter Hook ── */
function useCounter(end, inView, duration = 1800) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return count;
}

/* ── Stat Card ── */
const StatCard = memo(({ stat, inView }) => {
  const count = useCounter(stat.value, inView);
  const Icon = stat.icon;
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300 group">
      <Icon size={16} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
      <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
        {count}
        <span className="text-cyan-400">+</span>
      </span>
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</span>
    </div>
  );
});
StatCard.displayName = "StatCard";

/* ── Infinite Marquee ── */
const InfiniteMarquee = memo(() => (
  <div className="relative overflow-hidden py-4" aria-hidden="true">
    {/* Fade masks */}
    <div className="footer-marquee-mask-left absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
    <div className="footer-marquee-mask-right absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
    <div className="flex animate-marquee">
      {[...MARQUEE_TECH, ...MARQUEE_TECH, ...MARQUEE_TECH].map((tech, i) => (
        <span
          key={i}
          className="shrink-0 mx-3 sm:mx-5 text-xs sm:text-sm font-mono text-zinc-500 whitespace-nowrap uppercase tracking-widest"
        >
          {tech}
        </span>
      ))}
    </div>
  </div>
));
InfiniteMarquee.displayName = "InfiniteMarquee";

/* ── Stagger Animation Variants ── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Main Footer ── */
const Footer = memo(() => {
  const [currentTime, setCurrentTime] = useState("");
  const [presence, setPresence] = useState({ isAwake: true, label: "Online / Building", detail: "Avg reply: < 2h" });
  const [latency, setLatency] = useState(13);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const footerRef = useRef(null);
  const statsRef = useRef(null);
  const isInView = useInView(footerRef, { once: true, amount: 0.15 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 });

  // Live IST Clock & diurnal presence engine
  useEffect(() => {
    const updateTimeAndPresence = () => {
      try {
        const now = new Date();
        const istString = now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setCurrentTime(`${istString} IST`);

        const istHour = parseInt(
          new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            hour: "numeric",
            hour12: false,
          }).format(now),
          10
        );

        const isAwake = istHour >= 8 && istHour < 24;
        setPresence({
          isAwake,
          label: isAwake ? "Online / Building" : "Recharging / Offline",
          detail: isAwake ? "Avg reply: < 2h" : "Queued for morning",
        });
      } catch {
        setCurrentTime("17:00:00 IST");
        setPresence({ isAwake: true, label: "Online / Building", detail: "Avg reply: < 2h" });
      }
    };

    updateTimeAndPresence();
    const clockInterval = setInterval(updateTimeAndPresence, 1000);
    const latencyInterval = setInterval(() => {
      setLatency(11 + Math.floor(Math.random() * 5));
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(latencyInterval);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      if (window.lenis) {
        window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
      } else {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  }, []);

  const handleCopyEmail = useCallback(() => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText("sakmmm07@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <footer ref={footerRef} className="relative bg-zinc-950 border-t border-white/10 text-zinc-400 pt-16 sm:pt-20 pb-10 px-4 sm:px-12 overflow-hidden">
      {/* Specular Top Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 via-blue-500/40 to-transparent pointer-events-none" />

      {/* Ambient Backlight Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-44 bg-cyan-500/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Subtle Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px" }} />

      <Motion.div
        className="container mx-auto max-w-7xl relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >

        {/* ═══ Row 1: 4-Column Directory ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Identity & Quick Actions */}
          <Motion.div className="lg:col-span-4 space-y-4" variants={itemVariants}>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-cyan-400/40 bg-zinc-900 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0 group">
                <img
                  src={profile}
                  alt="Saksham Agarwal"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  width={48}
                  height={48}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Saksham Agarwal</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <p className="text-xs font-mono text-zinc-400">Software &amp; Applied AI Engineer</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              B.Tech Computer Science undergraduate at VIT Bhopal. Specializing in explainable neural forensics, deterministic LLM compilers, and distributed real-time cloud architectures.
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <a
                href={resume}
                download="Saksham_Agarwal_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-mono font-bold hover:bg-zinc-200 transition-all shadow-sm cursor-pointer active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <FileText size={12} />
                <span>Resume (PDF)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
                title="Copy sakmmm07@gmail.com"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy Email"}</span>
              </button>

              <a
                href="mailto:sakmmm07@gmail.com"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer"
              >
                <span>Compose</span>
                <ArrowUpRight size={12} />
              </a>
            </div>
          </Motion.div>

          {/* Col 2: Section Directory */}
          <Motion.div className="lg:col-span-3 space-y-3" variants={itemVariants}>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
              <Compass size={12} className="text-cyan-400" />
              <span>Directory</span>
            </span>
            <ul className="space-y-1 text-xs font-mono list-none">
              {DIRECTORY.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className="group flex items-center gap-2 text-zinc-400 hover:text-cyan-300 transition-all py-0.5 rounded-md hover:bg-white/[0.02] px-1.5 -mx-1.5"
                  >
                    <span className="text-[10px] text-zinc-600 group-hover:text-cyan-400 font-semibold transition-colors w-4">{item.num}</span>
                    <span className="w-1 h-[1px] bg-zinc-700 group-hover:bg-cyan-500 group-hover:w-3 transition-all duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Motion.div>

          {/* Col 3: Case Studies */}
          <Motion.div className="lg:col-span-2 space-y-3" variants={itemVariants}>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
              <Code2 size={12} className="text-purple-400" />
              <span>Case Studies</span>
            </span>
            <ul className="space-y-2 text-xs font-mono list-none">
              {CASE_STUDIES.map((study, idx) => (
                <li key={idx}>
                  <a
                    href={`#${study.target}`}
                    onClick={(e) => handleNavClick(e, study.target)}
                    className="flex flex-col group cursor-pointer rounded-md hover:bg-white/[0.02] px-1.5 py-1 -mx-1.5 transition-all"
                  >
                    <span className="text-zinc-300 group-hover:text-white transition-colors font-medium flex items-center gap-1">
                      <span>{study.name}</span>
                      <ArrowUpRight size={10} className="text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-purple-400 transition-colors">
                      {study.tag}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Motion.div>

          {/* Col 4: Live Operations & Telemetry */}
          <Motion.div className="lg:col-span-3 space-y-3 lg:text-right flex flex-col lg:items-end" variants={itemVariants}>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
              <Radio size={12} className="text-emerald-400 animate-pulse" />
              <span>Live Operations</span>
            </span>

            <div className="space-y-2.5 font-mono text-xs text-zinc-400 w-full lg:w-auto">
              {/* Presence Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-200">
                <span className={`w-2 h-2 rounded-full ${presence.isAwake ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"}`} />
                <span>{presence.label}</span>
                <span className="text-zinc-500 text-[10px]">({presence.detail})</span>
              </div>

              {/* Clock */}
              <div className="flex items-center gap-1.5 lg:justify-end text-zinc-300">
                {presence.isAwake ? (
                  <Sun size={13} className="text-amber-400 shrink-0" />
                ) : (
                  <Moon size={13} className="text-indigo-400 shrink-0" />
                )}
                <span>INDIA (IST) &bull; {currentTime || "--:--:-- IST"}</span>
              </div>

              {/* Telemetry */}
              <div className="flex items-center gap-2 lg:justify-end text-[11px] text-zinc-500">
                <span>UTC+05:30</span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 text-emerald-400/80">
                  <Activity size={10} />
                  <span>{latency}ms</span>
                </span>
                <span>&bull;</span>
                <span>TLS 1.3</span>
              </div>

              {/* Availability CTA */}
              <div className="pt-1">
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, "contact")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-semibold transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                >
                  <Sparkles size={11} />
                  <span>Available for 2026/2027 Roles</span>
                </a>
              </div>
            </div>
          </Motion.div>
        </div>

        {/* ═══ Row 2: Animated Stats Counter Band ═══ */}
        <Motion.div
          ref={statsRef}
          className="py-10 border-b border-white/10"
          variants={itemVariants}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} inView={statsInView} />
            ))}
          </div>
        </Motion.div>

        {/* ═══ Row 3: Giant Typographic Signature with Mouse Spotlight ═══ */}
        <Motion.div
          className="relative py-10 select-none overflow-hidden text-center cursor-default rounded-3xl"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          variants={itemVariants}
        >
          {/* Cursor Spotlight */}
          {mousePos.active && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.12), rgba(168, 85, 247, 0.06), transparent 70%)`,
              }}
            />
          )}

          <div className="text-[8.5vw] sm:text-[11vw] md:text-[12vw] font-black tracking-tighter leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-zinc-600/70 via-zinc-800/40 to-zinc-950 font-sans transition-all duration-700 hover:from-cyan-400/35 hover:via-zinc-700/55 hover:to-zinc-900">
            SAKSHAM AGARWAL
          </div>
          
          <div className="pt-5 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            <span>Neural Forensics</span>
            <span className="text-zinc-700">&bull;</span>
            <span>Deterministic LLM Compilers</span>
            <span className="text-zinc-700">&bull;</span>
            <span>Distributed Real-Time Cloud</span>
          </div>
        </Motion.div>

        {/* ═══ Row 4: Infinite Scrolling Tech Marquee ═══ */}
        <Motion.div className="border-y border-white/[0.06]" variants={itemVariants}>
          <InfiniteMarquee />
        </Motion.div>

        {/* ═══ Row 5: Bottom Bar — Copyright, Socials, Back to Top ═══ */}
        <Motion.div
          className="pt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-between text-xs font-mono text-zinc-500"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 shrink-0 bg-zinc-900 shadow-sm">
              <img
                src={profile}
                alt="Saksham Agarwal"
                className="w-full h-full object-cover object-top"
                width={28}
                height={28}
              />
            </div>
            <span className="flex items-center gap-1 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Saksham Agarwal &bull; B.Tech CSE Class of 2027
            </span>
          </div>

          {/* Socials & Back to Top */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              {[
                { href: "https://github.com/saksham-dev07", label: "GitHub", icon: <Github size={14} />, title: "@saksham-dev07" },
                { href: "https://www.linkedin.com/in/saksham-agarwal-b44910289/", label: "LinkedIn", icon: <Linkedin size={14} />, title: "LinkedIn Profile" },
                { href: "mailto:sakmmm07@gmail.com", label: "Email", icon: <Mail size={14} />, title: "sakmmm07@gmail.com" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  aria-label={`${link.label} Profile`}
                  className="relative p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-cyan-400/40 transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  title={link.title}
                >
                  {link.icon}
                  {/* Hover Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    {link.title}
                  </span>
                </a>
              ))}
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-sm active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={13} />
            </button>
          </div>
        </Motion.div>

        {/* ═══ Crafted With Care Micro-Signature ═══ */}
        <div className="pt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-600">
          <span>Crafted with precision</span>
          <Heart size={10} className="text-rose-500/60" />
          <span>in India</span>
        </div>

      </Motion.div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
