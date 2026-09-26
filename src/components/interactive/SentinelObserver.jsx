import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Briefcase,
  Check,
  Copy,
  Minus,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useArcade } from "../../context/ArcadeContext";
import { useRole } from "../../context/RoleContext";
import { useSound } from "../../context/SoundContext";
import { useThemeMood } from "../../context/ThemeMoodContext";

const SECTION_KNOWLEDGE = {
  hero: {
    title: "Terminal Core",
    comments: [
      "System online. Observing your navigation and technical evaluation.",
      "Admiring the 3D terminal? You can drag and rotate it in real time.",
      "Software & Applied AI. Notice the deterministic architecture focus.",
    ],
  },
  projects: {
    title: "Flagship Projects",
    action: { label: "View Case Studies", target: "projects" },
    comments: [
      "Flagship Case Studies: Notice the Grad-CAM neural forensics in the deepfake detector.",
      "Deterministic AST compiler for LLMs: Eliminating hallucinated syntax at the parse tree level.",
      "Notice the benchmark badges? Every latency metric is measured on actual hardware.",
    ],
  },
  "smaller-builds": {
    title: "Systems Lab",
    action: { label: "View Builds", target: "smaller-builds" },
    comments: [
      "Smaller builds, production rigor: CRDT canvas, WebSockets & PE binary forensics.",
      "Diverse systems engineering: from low-level binary analysis to real-time sync.",
    ],
  },
  "systems-lab": {
    title: "Inference Lab",
    action: { label: "View Lab", target: "systems-lab" },
    comments: [
      "14ms simulated edge latency. Distributed clustering and inference telemetry.",
      "Telemetry nominal: 99.98% uptime, Redis cache-aside & node health checks.",
    ],
  },
  tech: {
    title: "Tech Stack",
    action: { label: "View Stack", target: "tech" },
    comments: [
      "35+ production technologies indexed. Zero security vulnerabilities.",
      "PyTorch, FastAPI, React 19, Docker, WebSockets... which stack does your team run?",
    ],
  },
  certifications: {
    title: "Credentials",
    action: { label: "View Credentials", target: "certifications" },
    comments: [
      "AWS Certified AI Practitioner & Cloud Practitioner. All verifiable via Credly.",
      "Pro tip: Click 'Flip All' on the card deck to view exam competencies.",
    ],
  },
  education: {
    title: "Education",
    action: { label: "View Academics", target: "education" },
    comments: [
      "VIT Bhopal B.Tech CSE ('27) — 8.46 CGPA. Core algorithms & systems focus.",
      "Strong CS fundamentals combined with aggressive open-source development.",
    ],
  },
  leadership: {
    title: "Leadership",
    action: { label: "View Leadership", target: "leadership" },
    comments: [
      "Directed Central India's largest tech fest with 4,500+ attendees. High-stress throughput.",
      "Managing technical teams, logistics, and multi-lakh budgets as a sophomore.",
    ],
  },
  contact: {
    title: "Direct Contact",
    action: { label: "Copy Email", type: "copy" },
    comments: [
      "You reached Section 08! Saksham is actively open for Summer/Fall 2025/2026 roles.",
      "One click on 'Copy Email' below to reach Saksham directly at sakmmm07@gmail.com.",
    ],
  },
};

const QUICK_PROMPTS = [
  {
    id: "tldr",
    label: "TL;DR",
    Icon: Zap,
    eye: "scan",
    comment:
      "Saksham: CS undergrad @ VIT Bhopal ('27, 8.46 CGPA), AWS AI certified. Builds explainable deepfake forensics, deterministic LLM AST compilers & distributed cloud systems.",
    action: { label: "View Projects", target: "projects" },
  },
  {
    id: "ai",
    label: "Top AI",
    Icon: Brain,
    eye: "thinking",
    comment:
      "Flagship AI: Explainable Deepfake Forensics combining frequency analysis with Grad-CAM neural heatmaps, plus an AST-level LLM compiler eliminating hallucinated syntax.",
    action: { label: "Inspect AI Code", target: "projects" },
  },
  {
    id: "hire",
    label: "Hire",
    Icon: Briefcase,
    eye: "happy",
    comment:
      "Actively seeking Summer/Fall 2025 & 2026 SWE / Applied AI internships. Fast learner, ships production code, and ready for high-impact teams.",
    action: { label: "Copy Email", type: "copy" },
  },
  {
    id: "secrets",
    label: "Secrets",
    Icon: Terminal,
    eye: "wink",
    comment:
      "Secret intel: Try entering the Konami Code on your keyboard, or press `~` to launch the developer terminal shell!",
  },
];

const POKE_QUOTES = [
  "Neural core operational! What system would you like to inspect next?",
  "Audit stat: Sub-100ms first paint, code-split 3D canvas, and WCAG AA certified.",
  "Did you know? You can switch the color theme palette anytime in the navbar.",
  "All benchmarks in the systems lab were tested under live concurrency.",
  "Observing cursor telemetry... your navigational velocity is impressive, engineer.",
];

const THEME_REACTIONS = {
  hacker: "Matrix protocol engaged. Root terminal access unlocked.",
  light: "High-luminance mode detected. High-contrast shaders active.",
  chill: "Lo-fi wave online. Relaxed engineering exploration enabled.",
  chaotic: "Maximum entropy mode activated! UI physics running at 100%.",
  cyber: "Cyberpunk neon telemetry restored. Cyan-indigo grid online.",
};

const ROLE_REACTIONS = {
  ai: "Applied AI filter active: Highlighting deepfake forensics & LLM compiler.",
  backend:
    "Systems filter active: Highlighting edge clustering & microservices.",
  fullstack:
    "Full-Stack filter active: Auditing React 19 UI & production APIs.",
  all: "Displaying full catalog: AI models, distributed systems & web apps.",
};

const getTimeGreeting = () => {
  if (typeof window === "undefined") return "System online. Telemetry ready.";
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) {
    return "Late night code audit? Dedicated engineer detected. Systems online.";
  }
  if (hour >= 5 && hour < 11) {
    return "Morning inspection! Great time to evaluate top engineering talent.";
  }
  if (hour >= 11 && hour < 17) {
    return "Afternoon telemetry active. Tracking your journey through Saksham's portfolio.";
  }
  return "Evening review underway. Observing your technical evaluation.";
};

const TOTAL_SECTIONS = 8;

const SentinelObserver = memo(() => {
  const { playBlip, playClick, playSuccess } = useSound();
  const { activeRole } = useRole();
  const { mood } = useThemeMood();
  const { konamiActive, isSignalRunOpen } = useArcade();

  const [comment, setComment] = useState(getTimeGreeting);
  const [activeAction, setActiveAction] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [moodEye, setMoodEye] = useState("normal"); // 'normal' | 'wink' | 'scan' | 'happy' | 'thinking'
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [visitedSections, setVisitedSections] = useState(
    () => new Set(["hero"]),
  );
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const idleTimer = useRef(null);
  const currentSection = useRef("hero");
  const isInitialMount = useRef(true);

  // Behavior trigger function
  const triggerComment = useCallback(
    (newComment, eyeState = "normal", action = null) => {
      setComment(newComment);
      setMoodEye(eyeState);
      setActiveAction(action);
      playBlip();
    },
    [playBlip],
  );

  // React to Role filter switches
  useEffect(() => {
    if (isInitialMount.current) return;
    if (activeRole && ROLE_REACTIONS[activeRole]) {
      triggerComment(ROLE_REACTIONS[activeRole], "scan", {
        label: "View Filtered",
        target: "projects",
      });
    }
  }, [activeRole, triggerComment]);

  // React to Theme Mood switches
  useEffect(() => {
    if (isInitialMount.current) return;
    if (mood && THEME_REACTIONS[mood]) {
      triggerComment(THEME_REACTIONS[mood], "happy");
    }
  }, [mood, triggerComment]);

  // React to Konami Code easter egg
  useEffect(() => {
    if (konamiActive) {
      triggerComment(
        "KONAMI CODE UNLOCKED! 30 extra interview passes granted to your hiring committee.",
        "happy",
        { label: "Copy Email", type: "copy" },
      );
    }
  }, [konamiActive, triggerComment]);

  // React to Signal Run Mini-Game
  useEffect(() => {
    if (isSignalRunOpen) {
      triggerComment(
        "Signal Run Mini-Game engaged! Dodge latency packets and keep throughput high.",
        "scan",
      );
    }
  }, [isSignalRunOpen, triggerComment]);

  // Tab visibility change (detect user switching back to portfolio tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerComment(
          "Welcome back! Telemetry sensors synchronized and ready.",
          "wink",
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [triggerComment]);

  // Scroll speed, section observer & idle listener
  useEffect(() => {
    isInitialMount.current = false;

    // Reset idle timer
    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        const idleQuotes = [
          "Telemetry idle. Taking your time? I respect thorough technical due diligence.",
          "Did you know? Saksham's Deepfake Forensics engine uses Grad-CAM heatmaps for explainable verification.",
          "Still reviewing? Tap any of the quick action chips below for an instant brief.",
        ];
        const randomQuote =
          idleQuotes[Math.floor(Math.random() * idleQuotes.length)];
        triggerComment(randomQuote, "thinking");
      }, 25000); // 25s of inactivity
    };

    resetIdleTimer();

    // Scroll speed & section listener
    const handleScroll = () => {
      resetIdleTimer();
      const currentY = window.scrollY;
      const now = Date.now();
      const timeDiff = now - lastScrollTime.current;
      const dist = Math.abs(currentY - lastScrollY.current);

      // Fast scroll check (> 1400px in < 250ms)
      if (dist > 1400 && timeDiff < 250) {
        const fastQuotes = [
          "Speedrunner detected! Slow down, the flagship engineering case studies are right here.",
          "Scrolling at warp speed! Notice the interactive live demos in Section 01.",
        ];
        const randomQuote =
          fastQuotes[Math.floor(Math.random() * fastQuotes.length)];
        triggerComment(randomQuote, "wink", {
          label: "View Projects",
          target: "projects",
        });
      }

      lastScrollY.current = currentY;
      lastScrollTime.current = now;

      // Detect current section in viewport
      const sections = [
        "hero",
        "projects",
        "smaller-builds",
        "systems-lab",
        "tech",
        "certifications",
        "education",
        "leadership",
        "contact",
      ];

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (
            rect.top <= window.innerHeight * 0.45 &&
            rect.bottom >= window.innerHeight * 0.2
          ) {
            if (currentSection.current !== id) {
              currentSection.current = id;
              setVisitedSections((prev) => new Set([...prev, id]));

              const knowledge =
                SECTION_KNOWLEDGE[id] || SECTION_KNOWLEDGE.projects;
              const pool = knowledge.comments;
              const randomComment =
                pool[Math.floor(Math.random() * pool.length)];

              triggerComment(randomComment, "normal", knowledge.action || null);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", resetIdleTimer, { passive: true });
    window.addEventListener("keydown", resetIdleTimer, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [triggerComment]);

  // Action handlers
  const handleScrollTo = useCallback(
    (targetId) => {
      const el = document.getElementById(targetId);
      if (!el) return;
      if (window.lenis) {
        window.lenis.scrollTo(el, { offset: -80 });
      } else {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
      playClick();
    },
    [playClick],
  );

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText("sakmmm07@gmail.com");
    setCopiedEmail(true);
    toast.success("Email copied to clipboard: sakmmm07@gmail.com");
    playSuccess();
    setTimeout(() => setCopiedEmail(false), 2500);
  }, [playSuccess]);

  const handleActionClick = useCallback(
    (action) => {
      if (!action) return;
      if (action.type === "copy") {
        handleCopyEmail();
      } else if (action.target) {
        handleScrollTo(action.target);
      }
    },
    [handleCopyEmail, handleScrollTo],
  );

  const handlePromptClick = useCallback(
    (prompt) => {
      playClick();
      triggerComment(prompt.comment, prompt.eye, prompt.action || null);
    },
    [playClick, triggerComment],
  );

  const handlePokeMascot = useCallback(() => {
    playClick();
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }
    const quote = POKE_QUOTES[Math.floor(Math.random() * POKE_QUOTES.length)];
    triggerComment(quote, "happy");
  }, [isMinimized, playClick, triggerComment]);

  if (!isVisible || isMobileScreen) return null;

  const auditedCount = Math.min(visitedSections.size, TOTAL_SECTIONS);

  return (
    <aside
      aria-label="Interactive Sentinel Bot"
      className="hidden md:flex fixed bottom-5 right-5 z-40 flex-col items-end pointer-events-none select-none"
    >
      <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isMinimized ? (
            <Motion.div
              key="expanded"
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="sentinel-observer-bubble relative mb-2 max-w-[280px] sm:max-w-[340px] rounded-xl bg-zinc-950/95 border border-cyan-500/30 p-3 shadow-2xl backdrop-blur-xl font-mono text-zinc-300"
            >
              {/* Header Controls & Telemetry Status */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                  <span>Sentinel Bot</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-normal">
                    Audit {auditedCount}/{TOTAL_SECTIONS}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1 hover:text-zinc-300 transition-colors rounded hover:bg-white/5 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400"
                    title="Minimize Sentinel"
                    aria-label="Minimize Sentinel Bot"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:text-red-400 transition-colors rounded hover:bg-white/5 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400"
                    title="Dismiss Sentinel"
                    aria-label="Dismiss Sentinel Bot"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Bot Commentary Speech Bubble — Compact Crisp Font Size */}
              <div className="relative text-xs sm:text-[13px] leading-relaxed text-zinc-200 mb-2.5">
                <p className="text-zinc-200">"{comment}"</p>
              </div>

              {/* Contextual Action Button (if relevant to current topic) */}
              {activeAction && (
                <div className="mb-2.5">
                  <button
                    type="button"
                    onClick={() => handleActionClick(activeAction)}
                    className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 hover:text-cyan-100 text-[11px] font-semibold transition-all cursor-pointer shadow-sm focus-visible:ring-1 focus-visible:ring-cyan-400"
                  >
                    {activeAction.type === "copy" ? (
                      copiedEmail ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span>Copied sakmmm07@gmail.com</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Email (sakmmm07@gmail.com)</span>
                        </>
                      )
                    ) : (
                      <>
                        <Sparkles size={11} className="text-cyan-400" />
                        <span>{activeAction.label}</span>
                        <ArrowRight size={11} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Intelligent Quick Queries ("Ask Sentinel") */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                  <Bot size={11} className="text-cyan-400" />
                  <span>Ask Sentinel:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PROMPTS.map((prompt) => {
                    const PromptIcon = prompt.Icon;
                    return (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => handlePromptClick(prompt)}
                        className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400"
                      >
                        <PromptIcon
                          size={11}
                          className="text-cyan-400 group-hover:scale-110 transition-transform"
                        />
                        <span>{prompt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speech bubble pointer arrow */}
              <div className="sentinel-bubble-pointer absolute -bottom-1.5 right-6 w-3 h-3 bg-zinc-950 border-r border-b border-cyan-500/30 transform rotate-45" />
            </Motion.div>
          ) : null}
        </AnimatePresence>

        {/* Mascot Avatar Orb */}
        <div className="flex justify-end">
          <Motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handlePokeMascot}
            className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
            title={
              isMinimized
                ? "Wake up Sentinel Mascot"
                : "Poke Sentinel AI (Tap for Intel)"
            }
            aria-label={
              isMinimized
                ? "Wake up Sentinel Mascot"
                : "Poke Sentinel AI for System Intel"
            }
          >
            {/* Ambient Background Flare */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-600/20 pointer-events-none" />

            {/* Dynamic Expressive Eyes */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5">
                {moodEye === "wink" ? (
                  <>
                    <span className="w-2.5 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                    <span className="w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  </>
                ) : moodEye === "happy" ? (
                  <>
                    <span className="w-2.5 h-1.5 rounded-t-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                    <span className="w-2.5 h-1.5 rounded-t-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                  </>
                ) : moodEye === "scan" ? (
                  <span className="w-6 h-1 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                ) : moodEye === "thinking" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
                    <span className="w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] transition-all duration-300 animate-pulse" />
                    <span className="w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] transition-all duration-300 animate-pulse" />
                  </>
                )}
              </div>

              {/* Visor Smile / Indicator */}
              {moodEye !== "scan" && (
                <div className="w-4 h-0.5 rounded-full bg-cyan-400/80 mt-1 shadow-[0_0_4px_#22d3ee]" />
              )}
            </div>

            {/* Minimized Indicator Badge */}
            {isMinimized && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 text-zinc-950 text-[9px] font-bold flex items-center justify-center shadow-md animate-bounce">
                !
              </span>
            )}
          </Motion.button>
        </div>
      </div>
    </aside>
  );
});

SentinelObserver.displayName = "SentinelObserver";
export default SentinelObserver;
