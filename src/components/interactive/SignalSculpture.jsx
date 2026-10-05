import {
  Circle,
  GitBranch,
  MoveUpRight,
  Pause,
  Play,
  RotateCcw,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const modes = [
  { id: "orbit", label: "Orbit", icon: Circle },
  { id: "wave", label: "Wave", icon: Waves },
  { id: "helix", label: "Helix", icon: GitBranch },
];

export default function SignalSculpture() {
  const [mode, setMode] = useState("orbit");
  const [paused, setPaused] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off",
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setPaused(
        query.matches || document.documentElement.dataset.motion === "off",
      );
    query.addEventListener("change", update);
    window.addEventListener("portfolio-motion-change", update);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("portfolio-motion-change", update);
    };
  }, []);
  const canvasRef = useRef(null);
  const pointer = useRef({ x: -1000, y: -1000 });
  const impulse = useRef(0);
  const rotation = useRef(0);
  const drawRef = useRef(() => {});
  const activeMode = useRef(mode);
  activeMode.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame;
    let visible = true;
    let width = 0;
    let height = 0;
    let previousTime = 0;
    const draw = (time = performance.now()) => {
      if (!paused)
        rotation.current +=
          Math.min((time - previousTime) / 1000 || 0, 0.05) * 0.25;
      previousTime = time;
      const t = rotation.current;
      const scale = Math.min(width, height) * 0.31;
      ctx.clearRect(0, 0, width, height);
      const points = [];
      for (let i = 0; i < 68; i++) {
        for (let j = 0; j < 14; j++) {
          const a = (i / 68) * Math.PI * 2;
          const b = (j / 14) * Math.PI * 2;
          let x, y, z;
          if (activeMode.current === "orbit") {
            x = (1 + 0.36 * Math.cos(b)) * Math.cos(a);
            y = (1 + 0.36 * Math.cos(b)) * Math.sin(a);
            z = 0.36 * Math.sin(b);
          } else if (activeMode.current === "wave") {
            x = (i / 67 - 0.5) * 2.7;
            y = (j / 13 - 0.5) * 1.7;
            z = Math.sin(x * 3 + t * 4) * 0.35 + Math.cos(y * 4 + t * 3) * 0.25;
          } else {
            x = Math.cos(a * 2 + b * 0.12) * 0.7;
            y = (i / 67 - 0.5) * 2.5;
            z = Math.sin(a * 2 + b * 0.12) * 0.7;
          }
          const rx = x * Math.cos(t) - z * Math.sin(t);
          const rz = x * Math.sin(t) + z * Math.cos(t);
          const ry = y * 0.78 - rz * 0.62;
          const depth = y * 0.62 + rz * 0.78;
          const perspective = 3 / (3 + depth * 0.35);
          let px = width / 2 + rx * scale * perspective;
          let py = height / 2 + ry * scale * perspective;
          const dx = px - pointer.current.x;
          const dy = py - pointer.current.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 130 && distance > 0) {
            const force =
              (1 - distance / 130) ** 2 * (paused ? 20 : 38) +
              impulse.current * 20;
            px += (dx / distance) * force;
            py += (dy / distance) * force;
          }
          points.push({ x: px, y: py, z: depth, row: i, col: j });
        }
      }
      for (let i = 0; i < points.length - 14; i += 2) {
        const p = points[i],
          next = points[i + 14];
        ctx.strokeStyle =
          p.z > 0 ? "rgba(170,150,255,.10)" : "rgba(175,234,170,.15)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
      for (const p of points.sort((a, b) => b.z - a.z)) {
        const alpha = Math.max(0.2, 0.75 - p.z * 0.28);
        ctx.fillStyle =
          p.col % 5 === 0
            ? `rgba(177,154,255,${alpha})`
            : `rgba(168,183,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.7, 1.5 - p.z * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      impulse.current *= 0.93;
    };
    drawRef.current = draw;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const loop = (time) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previousTime = performance.now();
      if (visible && !document.hidden && !paused)
        frame = requestAnimationFrame(loop);
      else draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibility.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    resize();
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      drawRef.current = () => {};
    };
  }, [paused]);

  useEffect(() => {
    activeMode.current = mode;
    drawRef.current();
  }, [mode]);
  const move = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    if (paused) drawRef.current();
  };
  const burst = () => {
    impulse.current = 2;
    drawRef.current();
  };
  const key = (event) => {
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(
        event.key,
      )
    ) {
      event.preventDefault();
      if (pointer.current.x < 0)
        pointer.current = {
          x: event.currentTarget.clientWidth / 2,
          y: event.currentTarget.clientHeight / 2,
        };
      if (event.key === " ") burst();
      else {
        pointer.current.x +=
          event.key === "ArrowLeft" ? -25 : event.key === "ArrowRight" ? 25 : 0;
        pointer.current.y +=
          event.key === "ArrowUp" ? -25 : event.key === "ArrowDown" ? 25 : 0;
        drawRef.current();
      }
    }
  };
  return (
    <div className="signal-studio">
      <div className="studio-top">
        <span className="studio-live">
          <i />
          SIGNAL SCULPTURE
        </span>
        <MoveUpRight size={15} />
      </div>
      <div className="sculpture-stage">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="Interactive particle sculpture. Move your pointer to bend the field. Use arrow keys to move the force and Space to create a pulse."
          onPointerMove={move}
          onPointerDown={(event) => {
            move(event);
            burst();
          }}
          onPointerLeave={() => {
            pointer.current = { x: -1000, y: -1000 };
            if (paused) drawRef.current();
          }}
          onKeyDown={key}
        />
        <div className="sculpture-coordinate mono" aria-hidden="true">
          x / y / z<br />a little order.
          <br />a little chaos.
        </div>
        <span className="sculpture-hint mono">Move to bend. Tap to pulse.</span>
      </div>
      <div className="sculpture-toolbar">
        <div className="sculpture-modes" aria-label="Sculpture shape">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="studio-control"
          aria-label={paused ? "Animate sculpture" : "Pause sculpture"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <button
          type="button"
          className="studio-control"
          aria-label="Reset sculpture"
          onClick={() => {
            rotation.current = 0;
            impulse.current = 0;
            pointer.current = { x: -1000, y: -1000 };
            setMode("orbit");
            drawRef.current();
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}
