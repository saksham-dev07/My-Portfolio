import React, { useState, useEffect, useRef, memo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Trophy, Gamepad2, X, Sparkles } from "lucide-react";
import { useSound } from "../../context/SoundContext";
import { useArcade } from "../../context/ArcadeContext";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const KonamiCelebration = memo(() => {
  const { playVictory } = useSound();
  const { openSignalRun, triggerKonami } = useArcade();
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);

  // Global key sequence detector
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing inside text inputs
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const expectedKey = KONAMI_SEQUENCE[progress];
      if (e.key.toLowerCase() === expectedKey.toLowerCase()) {
        const nextProgress = progress + 1;
        setProgress(nextProgress);

        if (nextProgress === KONAMI_SEQUENCE.length) {
          // Konami code completed!
          setIsActive(true);
          triggerKonami();
          playVictory();
          setProgress(0);
        }
      } else {
        // Reset if mismatched (unless restarting sequence with ArrowUp)
        if (e.key === "ArrowUp") {
          setProgress(1);
        } else {
          setProgress(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [progress, playVictory, triggerKonami]);

  // Confetti Particle Physics Canvas
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ffffff"];
    const particles = [];

    // Spawn 120 confetti pieces bursting from corners & top
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 200,
        y: height * 0.4,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        gravity: 0.28,
        life: 1,
        decay: Math.random() * 0.008 + 0.005,
      });
    }

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;

        if (p.life > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        } else {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const dismissTimer = setTimeout(() => {
      setIsActive(false);
    }, 7000);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      clearTimeout(dismissTimer);
    };
  }, [isActive]);

  return (
    <>
      {isActive && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-[80]"
          aria-hidden="true"
        />
      )}

      {/* Achievement Toast Modal */}
      <AnimatePresence>
        {isActive && (
          <Motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[92%] sm:w-auto p-4 rounded-2xl bg-zinc-950/95 border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.4)] backdrop-blur-2xl text-white font-mono flex items-center gap-3.5"
            role="alert"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Trophy size={20} className="animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                  Retro Cheat Unlocked
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold">
                  +30 LIVES
                </span>
              </div>
              <p className="text-xs text-zinc-200 font-semibold truncate mt-0.5">
                Konami Code Accepted!
              </p>
              <p className="text-[11px] text-zinc-400">
                You've unlocked the SIGNAL RUN interactive resume run!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsActive(false);
                  openSignalRun();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Gamepad2 size={13} />
                <span>Play</span>
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded hover:bg-white/10"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

KonamiCelebration.displayName = "KonamiCelebration";
export default KonamiCelebration;
