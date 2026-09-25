import { AnimatePresence, motion as Motion } from "framer-motion";
import { ChevronDown, Coffee, Cpu, Flame, Sun, Terminal } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { MOODS } from "../../constants/moods";
import { useSound } from "../../context/SoundContext";
import { useThemeMood } from "../../context/ThemeMoodContext";

const ICONS = {
  Cpu,
  Sun,
  Terminal,
  Coffee,
  Flame,
};

// Theme-specific accent colors for the active indicator and icon
const MOOD_COLORS = {
  cyber: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-400/50",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.4)]",
    text: "text-cyan-400",
  },
  light: {
    bg: "bg-amber-400/20",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.4)]",
    text: "text-amber-500",
  },
  hacker: {
    bg: "bg-green-500/20",
    border: "border-green-400/50",
    glow: "shadow-[0_0_12px_rgba(34,197,94,0.4)]",
    text: "text-green-400",
  },
  chill: {
    bg: "bg-orange-400/20",
    border: "border-orange-400/50",
    glow: "shadow-[0_0_12px_rgba(251,146,60,0.4)]",
    text: "text-orange-400",
  },
  chaotic: {
    bg: "bg-fuchsia-500/20",
    border: "border-fuchsia-400/50",
    glow: "shadow-[0_0_12px_rgba(217,70,239,0.4)]",
    text: "text-fuchsia-400",
  },
};

const MoodSwitcher = memo(({ isMobile = false }) => {
  const { mood, setMood } = useThemeMood();
  const { playClick, playBlip } = useSound();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [buttonHovered, setButtonHovered] = useState(false);
  const containerRef = useRef(null);

  const activeMoodObj = MOODS.find((m) => m.id === mood) || MOODS[0];
  const ActiveIcon = ICONS[activeMoodObj.iconName] || Cpu;
  const activeColors = MOOD_COLORS[mood] || MOOD_COLORS.cyber;

  // Close on click outside or escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Resting State: Consolidated Single Circular Button */}
      <Motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen((prev) => !prev);
          playClick();
        }}
        onMouseEnter={() => !isMobile && setButtonHovered(true)}
        onMouseLeave={() => !isMobile && setButtonHovered(false)}
        className={`mood-consolidated-btn group relative flex items-center justify-center ${
          isMobile ? "w-6 h-6" : "w-8 h-8"
        } rounded-full border transition-all duration-200 cursor-pointer shrink-0 ${
          isOpen
            ? `${activeColors.bg} ${activeColors.border} ${activeColors.glow}`
            : "bg-zinc-900/80 border-white/10 hover:border-white/25 hover:bg-zinc-800/90 shadow-sm"
        }`}
        aria-label={`Theme: ${activeMoodObj.label}. Click to switch theme.`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Active Theme Icon */}
        <ActiveIcon
          size={isMobile ? 12 : 15}
          className={`shrink-0 transition-colors duration-200 ${activeColors.text}`}
        />

        {/* Subtle Visual Hint: Micro Chevron Badge */}
        <span
          className={`mood-chevron-badge absolute -bottom-0.5 -right-0.5 ${
            isMobile ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
          } rounded-full bg-zinc-950 border border-white/20 flex items-center justify-center text-zinc-400 group-hover:text-white shadow-sm transition-transform duration-200 ${
            isOpen ? "rotate-180 text-cyan-400 border-cyan-400/40" : ""
          }`}
          aria-hidden="true"
        >
          <ChevronDown size={isMobile ? 6 : 8} strokeWidth={2.5} />
        </span>
      </Motion.button>

      {/* Tooltip on Resting State Button (when not open) */}
      <AnimatePresence>
        {!isMobile && buttonHovered && !isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: 4, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            transition={{ duration: 0.12 }}
            style={{ left: "50%" }}
            className="mood-tooltip absolute top-full mt-2 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[10px] font-mono text-zinc-200 whitespace-nowrap shadow-xl pointer-events-none z-50 flex items-center justify-center"
          >
            <span className="mood-tooltip-arrow absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900 border-l border-t border-white/15" />
            <span className="relative z-10">{activeMoodObj.label} Theme</span>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Floating Capsule: Reveals All 5 Themes */}
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`mood-expanded-capsule absolute top-full right-0 mt-2 flex items-center gap-1 ${
              isMobile ? "p-1" : "p-1.5"
            } rounded-full bg-zinc-950/95 border border-white/15 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.85)] z-50 shrink-0`}
            role="menu"
            aria-label="Theme Selection Options"
          >
            {MOODS.map((m) => {
              const isSelected = m.id === mood;
              const ItemIcon = ICONS[m.iconName] || Cpu;
              const itemColors = MOOD_COLORS[m.id] || MOOD_COLORS.cyber;

              return (
                <button
                  key={m.id}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    if (m.id !== mood) {
                      setMood(m.id, e);
                      playClick();
                    } else {
                      playBlip();
                    }
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => !isMobile && setHoveredId(m.id)}
                  onMouseLeave={() => !isMobile && setHoveredId(null)}
                  className={`mood-icon-btn relative z-10 flex items-center justify-center ${
                    isMobile ? "w-6 h-6" : "w-7 h-7"
                  } rounded-full transition-colors duration-200 outline-none cursor-pointer shrink-0 ${
                    isSelected
                      ? itemColors.text
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                  aria-label={`Switch to ${m.label} theme`}
                  aria-pressed={isSelected}
                >
                  {/* Active theme highlight pill */}
                  {isSelected && (
                    <Motion.div
                      layoutId="expanded-mood-active-indicator"
                      className={`absolute inset-0 rounded-full ${itemColors.bg} ${itemColors.border} border ${itemColors.glow} backdrop-blur-md`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 30,
                      }}
                    />
                  )}
                  <ItemIcon
                    size={isMobile ? 12 : 14}
                    className="relative z-10 shrink-0"
                  />

                  {/* Tooltip per individual theme icon in expanded state */}
                  <AnimatePresence>
                    {!isMobile && hoveredId === m.id && (
                      <Motion.div
                        initial={{ opacity: 0, y: 4, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 2, x: "-50%" }}
                        transition={{ duration: 0.12 }}
                        style={{ left: "50%" }}
                        className="mood-tooltip absolute top-full mt-2 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[10px] font-mono text-zinc-200 whitespace-nowrap shadow-xl pointer-events-none z-50 flex items-center justify-center"
                      >
                        <span className="mood-tooltip-arrow absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900 border-l border-t border-white/15" />
                        <span className="relative z-10">{m.label}</span>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MoodSwitcher.displayName = "MoodSwitcher";
export default MoodSwitcher;
