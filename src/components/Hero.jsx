import { motion as Motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  Sparkles,
  Terminal,
} from "lucide-react";
import { lazy, memo, Suspense, useCallback, useEffect, useState } from "react";
import { profile, resume } from "../assets";
import {
  AwsIcon,
  DockerIcon,
  FastapiIcon,
  FirebaseIcon,
  GcpIcon,
  LinuxIcon,
  NextIcon,
  NodeIcon,
  OpencvIcon,
  PostgresIcon,
  PythonIcon,
  PytorchIcon,
  ReactIcon,
  TailwindIcon,
  TsIcon,
} from "../assets/techIcons";
import { useRole } from "../context/RoleContext";

// Lazy load 3D workstation
const ComputersCanvas = lazy(() =>
  import("./canvas/Computers").catch(() => ({
    default: () => (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
        <Sparkles size={28} className="text-cyan-400 mb-2" />
        <p className="text-xs font-mono text-zinc-400">Interactive 3D Engine</p>
      </div>
    ),
  })),
);

// Ticker items with official SVG icons
const MARQUEE_ITEMS = [
  { name: "Python", icon: PythonIcon },
  { name: "PyTorch", icon: PytorchIcon },
  { name: "TypeScript", icon: TsIcon },
  { name: "React.js", icon: ReactIcon },
  { name: "Next.js", icon: NextIcon },
  { name: "FastAPI", icon: FastapiIcon },
  { name: "Node.js", icon: NodeIcon },
  { name: "PostgreSQL", icon: PostgresIcon },
  { name: "Docker", icon: DockerIcon },
  { name: "OpenCV", icon: OpencvIcon },
  { name: "AWS", icon: AwsIcon },
  { name: "Google Cloud", icon: GcpIcon },
  { name: "Linux", icon: LinuxIcon },
  { name: "Firebase", icon: FirebaseIcon },
  { name: "Tailwind CSS", icon: TailwindIcon },
];

const ROLE_NARRATIVES = {
  all: {
    title: "Applied AI & Full-Stack Engineer.",
    body: "I build deepfake forensic engines, multi-stage LLM compilers, and distributed real-time web applications.",
  },
  fullstack: {
    title: "Full-Stack Web Engineer.",
    body: "I build reactive component architectures, collaborative canvas engines, and end-to-end microservices.",
  },
  ai: {
    title: "Applied AI & Computer Vision Specialist.",
    body: "I train multi-modal forensic neural nets, design LLM compiler pipelines, and build explainability systems.",
  },
  backend: {
    title: "Backend & Systems Engineer.",
    body: "I engineer high-throughput async REST/WebSocket APIs, relational schemas, and containerized cloud services.",
  },
};

const Hero = memo(() => {
  const { activeRole } = useRole();
  const [load3D, setLoad3D] = useState(false);
  const eyebrowText = "B.Tech CSE at VIT Bhopal · Graduating 2027";

  useEffect(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;

    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        const supported = Boolean(window.WebGLRenderingContext && gl);
        gl?.getExtension?.("WEBGL_lose_context")?.loseContext?.();
        return supported;
      } catch {
        return false;
      }
    };

    if (!mobile && checkWebGL()) {
      const timer = setTimeout(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => setLoad3D(true), { timeout: 1500 });
        } else {
          setLoad3D(true);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleScrollToContact = useCallback((e) => {
    e.preventDefault();
    const el = document.getElementById("contact");
    if (el) {
      if (window.lenis) {
        window.lenis.scrollTo(el, { offset: -80, duration: 1.2 });
      } else {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  }, []);

  const narrative = ROLE_NARRATIVES[activeRole] || ROLE_NARRATIVES.all;

  return (
    <section
      className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-primary pt-20 sm:pt-28 pb-3 sm:pb-4"
      aria-labelledby="hero-name"
    >
      {/* Ambient optical backlight glow */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="hidden sm:block absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Content Container */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-12 relative z-10 flex-1 flex flex-col justify-center">
        {/* Eyebrow Status Badge with Avatar (Single-line on mobile, no awkward wrapping) */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-6">
          <div className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-full overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)] shrink-0 bg-zinc-950">
            <img
              src={profile}
              alt="Saksham Agarwal"
              className="w-full h-full object-cover object-top"
              width={40}
              height={40}
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-xs font-mono shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="xs:hidden">VIT Bhopal '27 · Available</span>
            <span className="hidden xs:inline">{eyebrowText}</span>
          </div>
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400 text-xs font-mono">
            <Terminal size={12} className="text-cyan-400" />
            <span>CGPA: 8.46 / 10.0</span>
          </div>
        </div>

        {/* Display Headline with Staggered Character Reveal */}
        <div className="space-y-1 sm:space-y-2 mb-3.5 sm:mb-6">
          <p className="text-xs sm:text-sm font-mono tracking-widest uppercase text-cyan-400/90 font-semibold">
            Software & Applied AI Engineer
          </p>
          <Motion.h1
            id="hero-name"
            className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.95] flex flex-wrap"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.03, delayChildren: 0.2 },
              },
            }}
          >
            {["Saksham", "Agarwal"].map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="inline-flex whitespace-nowrap mr-3 sm:mr-5"
              >
                {word.split("").map((char, charIndex) => (
                  <Motion.span
                    key={charIndex}
                    className="inline-block hover:text-cyan-400 transition-colors duration-200"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                  >
                    {char}
                  </Motion.span>
                ))}
              </span>
            ))}
          </Motion.h1>
        </div>

        {/* Narrative / Engineering Value Statement */}
        <div className="max-w-2xl mb-5 sm:mb-8 space-y-1 sm:space-y-1.5">
          <p className="text-base sm:text-lg md:text-xl font-medium text-white tracking-tight">
            {narrative.title}
          </p>
          <p className="text-xs sm:text-base text-zinc-400 leading-relaxed font-normal">
            {narrative.body}
          </p>
        </div>

        {/* Action Group: Magnetic Buttons & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Primary CTA: Resume */}
            <a
              href={resume}
              download="Saksham_Agarwal_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-zinc-100 hover:shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>Resume</span>
              <ArrowUpRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            {/* Secondary Ghost CTA: Contact */}
            <button
              onClick={handleScrollToContact}
              className="group flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4.5 sm:px-5 py-2.5 sm:py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm border border-white/15 hover:border-white/30 shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
            >
              <span>Contact</span>
              <ArrowDown
                size={14}
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </button>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-start sm:justify-center gap-2">
            <a
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="p-2.5 sm:p-3 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <Github size={15} />
            </a>
            <a
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
              className="p-2.5 sm:p-3 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <Linkedin size={15} />
            </a>
            <a
              href="mailto:sakmmm07@gmail.com"
              aria-label="Direct Email"
              title="Email Saksham directly (sakmmm07@gmail.com)"
              className="p-2.5 sm:p-3 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/40 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <Mail size={15} />
            </a>
          </div>
        </div>
      </div>

      {/* Background 3D Workstation Canvas (desktop only, non-blocking) */}
      <div className="hero-3d-wrapper hidden md:block absolute inset-0 z-0 pointer-events-none opacity-40 lg:opacity-75">
        {load3D && (
          <Suspense fallback={null}>
            <div className="w-full h-full pointer-events-auto">
              <ComputersCanvas />
            </div>
          </Suspense>
        )}
      </div>

      {/* Infinite Tech Marquee Ticker (abhyudaytomar.com signature feature) */}
      <div
        className="relative w-full overflow-hidden border-y border-white/10 bg-zinc-950/70 backdrop-blur-md py-3.5 z-20"
        role="region"
        aria-label="Core technologies and toolset"
      >
        {/* Edge gradient masks */}
        <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-primary via-primary/80 to-transparent pointer-events-none z-10 hero-marquee-mask-left" />
        <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-primary via-primary/80 to-transparent pointer-events-none z-10 hero-marquee-mask-right" />

        <div className="animate-marquee-scroll flex items-center gap-8 text-zinc-400">
          {/* Track 1 */}
          <ul className="flex items-center gap-8 list-none">
            {MARQUEE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li
                  key={`track1-${idx}`}
                  className="hero-marquee-item flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/40 hover:text-white transition-all cursor-default text-xs font-mono font-medium"
                >
                  <span className="w-4 h-4 flex items-center justify-center opacity-85">
                    <Icon className="w-full h-full object-contain" />
                  </span>
                  <span>{item.name}</span>
                </li>
              );
            })}
          </ul>

          {/* Track 2 (Duplicate for seamless loop) */}
          <ul className="flex items-center gap-8 list-none" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li
                  key={`track2-${idx}`}
                  className="hero-marquee-item flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/40 hover:text-white transition-all cursor-default text-xs font-mono font-medium"
                >
                  <span className="w-4 h-4 flex items-center justify-center opacity-85">
                    <Icon className="w-full h-full object-contain" />
                  </span>
                  <span>{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
