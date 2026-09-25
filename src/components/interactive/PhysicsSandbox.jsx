import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowDown, Move, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { useSound } from "../../context/SoundContext";

const TECH_ITEMS = [
  {
    label: "React 19",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.15)",
    border: "rgba(6,182,212,0.4)",
  },
  {
    label: "PyTorch",
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    border: "rgba(249,115,22,0.4)",
  },
  {
    label: "FastAPI",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.4)",
  },
  {
    label: "Docker",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
  },
  {
    label: "TypeScript",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.4)",
  },
  {
    label: "Tailwind CSS",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
  },
  {
    label: "Python",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
    border: "rgba(251,191,36,0.4)",
  },
  {
    label: "PostgreSQL",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.15)",
    border: "rgba(129,140,248,0.4)",
  },
  {
    label: "Redis",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.15)",
    border: "rgba(244,63,94,0.4)",
  },
  {
    label: "AWS",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
  },
  {
    label: "Kubernetes",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.4)",
  },
  {
    label: "WebSockets",
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.4)",
  },
  {
    label: "OpenCV",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.15)",
    border: "rgba(192,132,252,0.4)",
  },
  {
    label: "CRDT / Canvas",
    color: "#e879f9",
    bg: "rgba(232,121,249,0.15)",
    border: "rgba(232,121,249,0.4)",
  },
  {
    label: "Linux",
    color: "#e4e4e7",
    bg: "rgba(228,228,231,0.15)",
    border: "rgba(228,228,231,0.4)",
  },
  {
    label: "Grad-CAM",
    color: "#fb7185",
    bg: "rgba(251,113,133,0.15)",
    border: "rgba(251,113,133,0.4)",
  },
];

const PhysicsSandbox = memo(({ isOpen, onClose }) => {
  const { playWhoosh, playBlip, playClick } = useSound();
  const canvasRef = useRef(null);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const animationFrameRef = useRef(null);

  const bodiesRef = useRef([]);
  const draggedBodyRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });

  // Initialize rigid bodies
  const initBodies = (width) => {
    bodiesRef.current = TECH_ITEMS.map((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const textWidth = item.label.length * 8 + 36;
      return {
        ...item,
        width: textWidth,
        height: 38,
        x: 60 + col * (width / 4.5) + (Math.random() * 20 - 10),
        y: 60 + row * 60,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        rotation: (Math.random() - 0.5) * 0.2,
        vRot: (Math.random() - 0.5) * 0.05,
      };
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    playWhoosh();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (bodiesRef.current.length === 0) {
        initBodies(rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Physics step loop
    const gravity = 0.35;
    const restitution = 0.65;
    const friction = 0.985;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bodies = bodiesRef.current;

      bodies.forEach((body) => {
        if (body === draggedBodyRef.current) {
          // Dragged by mouse
          body.vx = (mousePosRef.current.x - mousePosRef.current.prevX) * 0.8;
          body.vy = (mousePosRef.current.y - mousePosRef.current.prevY) * 0.8;
          body.x = mousePosRef.current.x - body.width / 2;
          body.y = mousePosRef.current.y - body.height / 2;
        } else {
          // Normal physics
          if (gravityEnabled) {
            body.vy += gravity;
          }

          body.vx *= friction;
          body.vy *= friction;
          body.vRot *= 0.97;

          body.x += body.vx;
          body.y += body.vy;
          body.rotation += body.vRot;

          // Boundary collision - Floor
          if (body.y + body.height > canvas.height) {
            body.y = canvas.height - body.height;
            body.vy = -body.vy * restitution;
            body.vx *= 0.92;
            body.vRot += body.vx * 0.01;
          }

          // Boundary collision - Ceiling
          if (body.y < 0) {
            body.y = 0;
            body.vy = -body.vy * restitution;
          }

          // Boundary collision - Left wall
          if (body.x < 0) {
            body.x = 0;
            body.vx = -body.vx * restitution;
          }

          // Boundary collision - Right wall
          if (body.x + body.width > canvas.width) {
            body.x = canvas.width - body.width;
            body.vx = -body.vx * restitution;
          }
        }

        // Draw Badge
        ctx.save();
        ctx.translate(body.x + body.width / 2, body.y + body.height / 2);
        ctx.rotate(body.rotation);

        // Rounded pill background
        const w = body.width;
        const h = body.height;
        const r = 14;

        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fillStyle = body.bg;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = body.border;
        ctx.stroke();

        // Glowing border reflection
        ctx.shadowColor = body.color;
        ctx.shadowBlur = 8;

        // Label
        ctx.fillStyle = body.color;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(body.label, 0, 0);

        ctx.restore();
      });

      mousePosRef.current.prevX = mousePosRef.current.x;
      mousePosRef.current.prevY = mousePosRef.current.y;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isOpen, gravityEnabled, playWhoosh]);

  // Pointer / Mouse interaction handlers
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current.x = x;
    mousePosRef.current.y = y;
    mousePosRef.current.prevX = x;
    mousePosRef.current.prevY = y;

    // Hit test bodies in reverse (top-most first)
    for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
      const b = bodiesRef.current[i];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        draggedBodyRef.current = b;
        playBlip();
        break;
      }
    }
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current.x = e.clientX - rect.left;
    mousePosRef.current.y = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    if (draggedBodyRef.current) {
      draggedBodyRef.current = null;
    }
  };

  // Scatter explosion trigger
  const handleExplode = () => {
    playWhoosh();
    bodiesRef.current.forEach((b) => {
      b.vx = (Math.random() - 0.5) * 35;
      b.vy = (Math.random() - 0.5) * 35 - 10;
      b.vRot = (Math.random() - 0.5) * 0.3;
    });
  };

  // Reset positions
  const handleReset = () => {
    playClick();
    const canvas = canvasRef.current;
    if (canvas) {
      initBodies(canvas.width, canvas.height);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <Motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="physics-sandbox-modal relative w-full max-w-4xl h-[560px] max-h-[85vh] rounded-3xl bg-zinc-950/95 border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden font-mono"
          >
            {/* Specular line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

            {/* Sandbox Header */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3.5 bg-zinc-900/80 border-b border-white/10 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 truncate">
                  <Move size={14} className="text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">
                    Physics Playground — Tech Stack Gravity Sandbox
                  </span>
                  <span className="sm:hidden">Physics Sandbox</span>
                </span>
              </div>

              {/* Controls Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExplode}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Apply radial explosion impulse"
                >
                  <Zap size={13} />
                  <span className="hidden sm:inline">Explode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGravityEnabled((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    gravityEnabled
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                  }`}
                  title="Toggle Earth vs Zero Gravity"
                >
                  <ArrowDown size={13} />
                  <span>{gravityEnabled ? "Gravity: 1G" : "Zero-G"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Reset badge grid"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer ml-1"
                  title="Close Sandbox"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="px-5 py-2 bg-cyan-950/20 border-b border-cyan-500/10 flex items-center justify-between text-[11px] text-zinc-400 select-none">
              <span>
                Grab any badge with your mouse/touch, fling it across the
                screen, or watch them collide!
              </span>
              <span className="text-cyan-400/80 font-bold hidden sm:inline">
                Rigid-Body 2D Physics
              </span>
            </div>

            {/* Physics Interactive Canvas */}
            <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-full block"
              />
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

PhysicsSandbox.displayName = "PhysicsSandbox";
export default PhysicsSandbox;
