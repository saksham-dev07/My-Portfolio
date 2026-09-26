import { AnimatePresence, motion as Motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "../../context/SoundContext";

const COMMENTARIES = {
  hero: [
    "System online. I'll be judging your navigation closely.",
    "Admiring the 3D terminal? Go ahead, drag it around.",
    "Software & Applied AI. Let's see what you explore first.",
  ],
  projects: [
    "Examining the flagship case studies? Notice the Grad-CAM neural forensics.",
    "Deterministic AST compiler for LLMs. No hallucinated code allowed.",
    "Notice the live metrics? We benchmark everything around here.",
  ],
  fastScroll: [
    "Skipping past my projects? Bold move, recruiter.",
    "Scrolling at light speed! Don't miss the engineering case studies.",
    "Speedrunner detected! Slow down, the good stuff is right here.",
  ],
  "smaller-builds": [
    "Smaller builds, but every repo has clean commits and live demos.",
    "WebSockets, CRDT canvas, and PE header forensics. Versatile, right?",
  ],
  "systems-lab": [
    "14ms simulated edge latency. Distributed clustering at its finest.",
    "Live telemetry running. All systems 99.98% operational.",
  ],
  tech: [
    "35+ production technologies. And zero npm security vulnerabilities.",
    "PyTorch, FastAPI, React 19, Docker... which one is your stack?",
  ],
  certifications: [
    "AWS Certified AI Practitioner & Cloud Practitioner. All verifiable.",
    "Click 'Flip All' on the cards. Smooth 3D perspective transforms.",
  ],
  education: [
    "8.46 CGPA at VIT Bhopal... yes, I actually study.",
    "Class of 2027. Early engineering internships & high throughput.",
  ],
  leadership: [
    "Led 4,500+ attendees at Central India's largest tech fest. I handle chaos.",
    "Managing budgets and technical teams since sophomore year.",
  ],
  contact: [
    "You made it all the way to Section 08! You're basically hired.",
    "Don't be shy — send an inquiry or connect on LinkedIn!",
  ],
  idle: [
    "Still here? Bold. Either you're reading every line or you fell asleep.",
    "Taking your time? I respect thorough technical due diligence.",
    "Staring at the UI? The typography is Inter and Fira Code, by the way.",
  ],
};

const SentinelObserver = memo(() => {
  const { playBlip } = useSound();
  const [comment, setComment] = useState(
    "System online. I'll be observing your navigation behavior.",
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [moodEye, setMoodEye] = useState("normal"); // 'normal' | 'wink' | 'look' | 'happy'
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

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

  // Behavior trigger function
  const triggerComment = useCallback(
    (newComment, eyeState = "normal") => {
      setComment(newComment);
      setMoodEye(eyeState);
      playBlip();
    },
    [playBlip],
  );

  useEffect(() => {
    // Reset idle timer
    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        const pool = COMMENTARIES.idle;
        const randomComment = pool[Math.floor(Math.random() * pool.length)];
        triggerComment(randomComment, "wink");
      }, 20000); // 20s of inactivity
    };

    resetIdleTimer();

    // Scroll speed & section listener
    const handleScroll = () => {
      resetIdleTimer();
      const currentY = window.scrollY;
      const now = Date.now();
      const timeDiff = now - lastScrollTime.current;
      const dist = Math.abs(currentY - lastScrollY.current);

      // Fast scroll check (> 1200px in < 250ms)
      if (dist > 1200 && timeDiff < 250) {
        const pool = COMMENTARIES.fastScroll;
        const randomComment = pool[Math.floor(Math.random() * pool.length)];
        triggerComment(randomComment, "wink");
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
              const pool = COMMENTARIES[id] || COMMENTARIES.projects;
              const randomComment =
                pool[Math.floor(Math.random() * pool.length)];
              triggerComment(randomComment, "normal");
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

  if (!isVisible || isMobileScreen) return null;

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
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="sentinel-observer-bubble relative mb-2 max-w-[300px] sm:max-w-[360px] rounded-2xl bg-zinc-950/95 border border-cyan-500/30 p-3.5 shadow-2xl backdrop-blur-xl font-mono text-base text-zinc-200"
            >
              {/* Header Controls */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Sentinel Bot v1.0</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1 hover:text-zinc-300 transition-colors rounded hover:bg-white/5 cursor-pointer"
                    title="Minimize Sentinel"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:text-red-400 transition-colors rounded hover:bg-white/5 cursor-pointer"
                    title="Dismiss Sentinel"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Bot Commentary Speech Bubble */}
              <div className="relative leading-relaxed text-zinc-200 text-base">
                <p>"{comment}"</p>
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
            onClick={() => setIsMinimized((prev) => !prev)}
            className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer overflow-hidden"
            title={
              isMinimized
                ? "Wake up Sentinel Mascot"
                : "Minimize Sentinel Mascot"
            }
          >
            {/* Ambient Background Flare */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-600/20 pointer-events-none" />

            {/* Holographic Face & Eyes */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5">
                {/* Left Eye */}
                <span
                  className={`w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] transition-all duration-300 ${
                    moodEye === "wink" ? "h-0.5" : "animate-pulse"
                  }`}
                />
                {/* Right Eye */}
                <span className="w-2 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] transition-all duration-300 animate-pulse" />
              </div>

              {/* Visor Smile / Indicator */}
              <div className="w-4 h-0.5 rounded-full bg-cyan-400/80 mt-1 shadow-[0_0_4px_#22d3ee]" />
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
