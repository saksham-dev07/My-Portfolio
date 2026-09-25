import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, Mail, Sparkles, Zap } from "lucide-react";
import React, { memo, useCallback, useRef, useState } from "react";
import { useSound } from "../../context/SoundContext";

const QUIPS = [
  "Instant Hire",
  "Too slow!",
  "Almost got me!",
  "Fast reflexes!",
  "You caught me!",
];

const DodgeButton = memo(() => {
  const { playDodge, playSuccess } = useSound();
  const [dodgeCount, setDodgeCount] = useState(0);
  const [isCaught, setIsCaught] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handlePointerEnter = useCallback(() => {
    if (isCaught) return;

    if (dodgeCount < 3) {
      playDodge();
      // Generate safe evasive offset within bounds
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const newX = Math.cos(angle) * distance;
      const newY = Math.sin(angle) * (distance * 0.5); // Keep vertical displacement restrained

      setCoords({ x: newX, y: newY });
      setDodgeCount((prev) => prev + 1);
    } else {
      // 4th attempt: Let the user catch it!
      setIsCaught(true);
      playSuccess();
      setCoords({ x: 0, y: 0 });
    }
  }, [dodgeCount, isCaught, playDodge, playSuccess]);

  const handleClick = () => {
    if (!isCaught) {
      if (dodgeCount >= 2) {
        setIsCaught(true);
        playSuccess();
        setCoords({ x: 0, y: 0 });
      } else {
        handlePointerEnter();
      }
      return;
    }
    // Already caught: Open direct email
    window.location.href =
      "mailto:sakmmm07@gmail.com?subject=I%20Caught%20Your%20Dodge%20Button!%20Let's%20Talk";
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center p-2"
    >
      <Motion.button
        type="button"
        animate={{
          x: coords.x,
          y: coords.y,
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 24,
        }}
        onMouseEnter={handlePointerEnter}
        onClick={handleClick}
        whileTap={{ scale: 0.94 }}
        className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-tight transition-colors shadow-lg cursor-pointer ${
          isCaught
            ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 shadow-emerald-500/30 shadow-lg scale-105"
            : dodgeCount > 0
              ? "bg-zinc-900 border border-amber-400/50 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              : "bg-zinc-900/90 hover:bg-zinc-800 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        }`}
        aria-label="Playful instant hire button"
      >
        {isCaught ? (
          <>
            <CheckCircle2 size={14} className="text-zinc-950 animate-bounce" />
            <span>Email Me Directly!</span>
          </>
        ) : (
          <>
            {dodgeCount > 0 ? (
              <Sparkles size={14} className="text-amber-400 animate-spin" />
            ) : (
              <Zap
                size={14}
                className="text-cyan-400 group-hover:scale-110 transition-transform"
              />
            )}
            <span>{QUIPS[Math.min(dodgeCount, QUIPS.length - 1)]}</span>
          </>
        )}

        {/* Counter Badge */}
        {!isCaught && dodgeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
            {dodgeCount}/3
          </span>
        )}
      </Motion.button>
    </div>
  );
});

DodgeButton.displayName = "DodgeButton";
export default DodgeButton;
