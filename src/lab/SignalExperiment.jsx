import { Download, Pause, Play, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "../utils/studioMotion";

export default function SignalExperiment({ mode }) {
  const canvas = useRef(null);
  const attractor = useRef({ x: 0.5, y: 0.5 });
  const elapsed = useRef(0);
  const [seed, setSeed] = useState(7);
  const [energy, setEnergy] = useState(45);
  const [paused, setPaused] = useState(false);
  const [motion, setMotion] = useState(motionAllowed);
  useEffect(() => {
    const update = () => setMotion(motionAllowed());
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", update);
    window.addEventListener("portfolio-motion-change", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("portfolio-motion-change", update);
    };
  }, []);
  useEffect(() => {
    const element = canvas.current;
    const context = element.getContext("2d");
    if (!context) return;
    let frame = 0;
    let time = elapsed.current;
    let visible = true;
    let last = 0;
    const render = (timestamp = 0) => {
      frame = 0;
      const width = element.width,
        height = element.height;
      const running = motion && !paused && visible && !document.hidden;
      if (running) time += Math.min((timestamp - last) / 1000 || 0, 0.04);
      elapsed.current = time;
      last = timestamp;
      context.fillStyle = "#11131d";
      context.fillRect(0, 0, width, height);
      const points = Array.from(
        { length: mode === "art" ? 96 : 32 },
        (_, i) => {
          const angle = i * 2.399963 + seed * 0.71;
          const radius =
            Math.sqrt((i + 1) / 96) * Math.min(width, height) * 0.47;
          const influence = energy / 100;
          return mode === "art"
            ? {
                x: width / 2 + Math.cos(angle + time * 0.12) * radius,
                y:
                  height / 2 +
                  Math.sin(angle * (1 + (seed % 3) * 0.01) + time * 0.1) *
                    radius,
              }
            : {
                x:
                  width * (0.12 + 0.76 * (((i * 17) % 31) / 31)) +
                  Math.sin(time * 0.3 + angle) * 14 +
                  (attractor.current.x - 0.5) * 45 * influence,
                y:
                  height * (0.15 + 0.7 * (((i * 11) % 29) / 29)) +
                  Math.cos(time * 0.2 + angle) * 12 +
                  (attractor.current.y - 0.5) * 45 * influence,
              };
        },
      );
      if (mode === "neural") {
        const x = attractor.current.x * width;
        const y = attractor.current.y * height;
        for (const point of points) {
          const influence = Math.max(
            0,
            1 - Math.hypot(x - point.x, y - point.y) / (width * 0.4),
          );
          point.x += ((x - point.x) * influence * energy) / 350;
          point.y += ((y - point.y) * influence * energy) / 350;
        }
      }
      points.forEach((point, i) => {
        if (mode === "art") {
          const next = points[(i + 13 + (seed % 9)) % points.length];
          context.strokeStyle = `hsla(${235 + i * 0.8},60%,75%,${0.18 + energy / 250})`;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(next.x, next.y);
          context.stroke();
        } else
          points.slice(i + 1).forEach((next) => {
            const distance = Math.hypot(next.x - point.x, next.y - point.y);
            if (distance < width * (0.13 + energy / 650)) {
              context.strokeStyle = `rgba(169,183,255,${Math.max(0.05, 0.5 - distance / width)})`;
              context.beginPath();
              context.moveTo(point.x, point.y);
              context.lineTo(next.x, next.y);
              context.stroke();
            }
          });
        context.fillStyle = i % 5 ? "#a8b7ff" : "#e7af8c";
        context.beginPath();
        context.arc(point.x, point.y, i % 5 ? 2 : 4, 0, Math.PI * 2);
        context.fill();
      });
      if (running) frame = requestAnimationFrame(render);
    };
    const redraw = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      render(performance.now());
    };
    const resize = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      element.width = Math.max(1, Math.round(bounds.width * dpr));
      element.height = Math.max(1, Math.round(bounds.height * dpr));
      redraw();
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      redraw();
    });
    resize.observe(element);
    observer.observe(element);
    document.addEventListener("visibilitychange", redraw);
    element.addEventListener("pointermove", redraw);
    redraw();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", redraw);
      element.removeEventListener("pointermove", redraw);
    };
  }, [seed, energy, mode, paused, motion]);
  const move = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    attractor.current = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };
  return (
    <div className="signal-experiment">
      <canvas
        ref={canvas}
        aria-label={
          mode === "art"
            ? "Generated geometric artwork; use the seed and energy controls below"
            : "Illustrative neural connections; move your pointer or adjust energy"
        }
        onPointerMove={move}
      />
      <div className="signal-controls">
        <label>
          Energy{" "}
          <input
            type="range"
            min="0"
            max="100"
            value={energy}
            onChange={(event) => setEnergy(Number(event.target.value))}
          />
          <output>{energy}%</output>
        </label>
        <button type="button" onClick={() => setSeed((value) => value + 1)}>
          <Shuffle size={15} /> New seed
        </button>
        <button
          type="button"
          aria-pressed={paused}
          disabled={!motion}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={() => {
            const link = document.createElement("a");
            link.href = canvas.current.toDataURL("image/png");
            link.download = `saksham-lab-${mode}-${seed}.png`;
            link.click();
          }}
        >
          <Download size={15} /> Export image
        </button>
      </div>
      <p className="mono">
        SEED / {seed} ·{" "}
        {mode === "art"
          ? "DETERMINISTIC GENERATIVE STUDY"
          : "SIGNAL VISUALIZATION, NOT MODEL INFERENCE"}
        {!motion && " · STATIC MOTION PREFERENCE"}
      </p>
    </div>
  );
}
