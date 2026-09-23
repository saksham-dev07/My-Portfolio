import React, { useEffect, useRef, memo } from "react";
import { useThemeMood } from "../../context/ThemeMoodContext";

const THEME_COLORS = {
  cyber: ["#06b6d4", "#3b82f6", "#67e8f9"],
  light: ["#0284c7", "#f59e0b", "#38bdf8"],
  hacker: ["#22c55e", "#10b981", "#4ade80"],
  chill: ["#f97316", "#fbbf24", "#fdba74"],
  chaotic: ["#f43f5e", "#d946ef", "#c084fc"],
};

const CursorTrail = memo(() => {
  const canvasRef = useRef(null);
  const { mood } = useThemeMood();
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    // Disable on touch devices, small screens, or reduced motion
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
    const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isSmall || isReducedMotion) return;

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

    const particles = [];
    const MAX_PARTICLES = 36;
    let animId = null;
    let isRunning = false;
    let lastMousePos = { x: -100, y: -100 };

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 2.8 + 1.2;
        this.life = 1;
        this.decay = Math.random() * 0.035 + 0.025;
        this.vx = (Math.random() - 0.5) * 1.4;
        this.vy = (Math.random() - 0.5) * 1.4 - 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size *= 0.96;
        this.life -= this.decay;
      }

      draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.life * 0.7);
        c.shadowColor = this.color;
        c.shadowBlur = 8;
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, Math.max(0.2, this.size), 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0 || p.size <= 0.3) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(render);
      } else {
        isRunning = false;
      }
    };

    const handleMouseMove = (e) => {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      const dist = Math.hypot(dx, dy);

      // Only spawn if moved sufficiently
      if (dist > 6) {
        lastMousePos = { x: e.clientX, y: e.clientY };
        const palette = THEME_COLORS[moodRef.current] || THEME_COLORS.cyber;
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push(new Particle(e.clientX, e.clientY, color));
        if (particles.length > MAX_PARTICLES) {
          particles.shift();
        }

        if (!isRunning) {
          isRunning = true;
          animId = requestAnimationFrame(render);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      style={{ opacity: 0.85 }}
    />
  );
});

CursorTrail.displayName = "CursorTrail";
export default CursorTrail;
