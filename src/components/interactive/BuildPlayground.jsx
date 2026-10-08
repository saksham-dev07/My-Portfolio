import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Download,
  Eraser,
  MousePointer2,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Undo2,
  Wand2,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const colors = ["#a8b7ff", "#aa95f5", "#66d9eb", "#ffb08a"];

export function DrawingCanvas() {
  const canvasRef = useRef(null);
  const strokes = useRef([]);
  const current = useRef(null);
  const render = useRef(() => {});
  const [color, setColor] = useState(colors[0]);
  const [eraser, setEraser] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const paint = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      for (const stroke of [
        ...strokes.current,
        ...(current.current ? [current.current] : []),
      ]) {
        ctx.globalCompositeOperation = stroke.eraser
          ? "destination-out"
          : "source-over";
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.eraser ? 24 : 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        stroke.points.forEach(([x, y], index) => {
          if (index === 0) ctx.moveTo(x * width, y * height);
          else ctx.lineTo(x * width, y * height);
        });
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    render.current = paint;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      render.current = () => {};
    };
  }, []);
  const point = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    ];
  };
  const finish = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    setCount(strokes.current.length);
    render.current();
  };
  const exportImage = () => {
    const output = document.createElement("canvas");
    const canvas = canvasRef.current;
    output.width = canvas.width;
    output.height = canvas.height;
    const ctx = output.getContext("2d");
    ctx.fillStyle = "#121622";
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = "my-canvas-experiment.png";
    link.href = output.toDataURL("image/png");
    link.click();
  };
  return (
    <div className="drawing-demo">
      <div className="demo-topbar">
        <span className="demo-label">
          <span />
          CANVAS / YOUR IDEAS GO HERE
        </span>
        <span className="mono" role="status">
          {count} strokes
        </span>
      </div>
      <div className="drawing-stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Freehand drawing canvas. Use a pointer or touch to draw. Sample sketch, undo, clear, and export controls are available below."
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            const p = point(event);
            current.current = {
              color,
              eraser,
              points: [p, [p[0] + 0.001, p[1] + 0.001]],
            };
            render.current();
          }}
          onPointerMove={(event) => {
            if (!current.current) return;
            if (current.current.points.length < 5000)
              current.current.points.push(point(event));
            render.current();
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
        <div className="canvas-watermark" aria-hidden="true">
          think.
          <br />
          <em>draw. repeat.</em>
        </div>
      </div>
      <div className="drawing-toolbar">
        <button
          className="studio-control"
          type="button"
          aria-label="Pen tool"
          aria-pressed={!eraser}
          onClick={() => setEraser(false)}
        >
          <PenLine size={16} />
        </button>
        <button
          className="studio-control"
          type="button"
          aria-label="Eraser tool"
          aria-pressed={eraser}
          onClick={() => setEraser(true)}
        >
          <Eraser size={16} />
        </button>
        <div className="color-palette">
          {colors.map((value, index) => (
            <button
              type="button"
              key={value}
              style={{ backgroundColor: value }}
              aria-label={
                ["Blue ink", "Violet ink", "Cyan ink", "Copper ink"][index]
              }
              aria-pressed={color === value}
              onClick={() => {
                setColor(value);
                setEraser(false);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="studio-control"
          aria-label="Undo last stroke"
          disabled={!count}
          onClick={() => {
            strokes.current.pop();
            setCount(strokes.current.length);
            render.current();
          }}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="studio-control"
          aria-label="Clear drawing"
          disabled={!count}
          onClick={() => {
            strokes.current = [];
            setCount(0);
            render.current();
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          className="studio-control"
          aria-label="Download your drawing as PNG"
          onClick={exportImage}
        >
          <Download size={16} />
        </button>
      </div>
      <button
        className="demo-sample"
        type="button"
        onClick={() => {
          const points = Array.from({ length: 180 }, (_, i) => {
            const a = (i / 179) * Math.PI * 4;
            return [
              0.5 + Math.cos(a) * (0.28 - i / 900),
              0.5 + Math.sin(a) * (0.35 - i / 1000),
            ];
          });
          strokes.current.push({ color, eraser: false, points });
          setCount(strokes.current.length);
          render.current();
        }}
      >
        Try a sample sketch <Wand2 size={14} />
      </button>
    </div>
  );
}

const stages = [
  {
    name: "Intent",
    headline: "Understand the brief.",
    detail:
      "Define the purpose, the people using the application, and the actions they need to take.",
    code: '{\n  "intent": "collaborative workspace",\n  "users": ["creator", "collaborator"],\n  "actions": ["create", "share", "draw"]\n}',
  },
  {
    name: "Interface",
    headline: "Give the idea a shape.",
    detail:
      "Translate requirements into screens and components with explicit responsibilities.",
    code: "<Workspace>\n  <Toolbar tools={tools} />\n  <SharedCanvas room={room} />\n  <Presence members={members} />\n</Workspace>",
  },
  {
    name: "Data",
    headline: "Model what matters.",
    detail:
      "Define the entities and relationships that the interface needs to persist.",
    code: "workspace { id, owner, name }\nmember    { id, workspace, role }\nstroke    { id, author, points }\nevent     { id, workspace, delta }",
  },
  {
    name: "Refine",
    headline: "Check the boundaries.",
    detail:
      "Inspect how components, data, and access rules fit together before the next iteration.",
    code: "check(componentProps);\ncheck(schemaReferences);\ncheck(roleBoundaries);\n\nreturn refine(application);",
  },
];
export function PipelineDemo({ active }) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const pause = () => {
      if (document.documentElement.dataset.motion === "off") setRunning(false);
    };
    window.addEventListener("portfolio-motion-change", pause);
    return () => window.removeEventListener("portfolio-motion-change", pause);
  }, []);
  useEffect(() => {
    if (!running || !active) return;
    const timer = setTimeout(() => {
      if (step === 3) setRunning(false);
      else setStep(step + 1);
    }, 1600);
    return () => clearTimeout(timer);
  }, [running, step, active]);
  const stage = stages[step];
  return (
    <div className="pipeline-demo">
      <div className="demo-topbar">
        <span className="demo-label">
          <span />
          COMPILER / A WALK THROUGH THE STAGES
        </span>
        <span className="mono">Interactive example</span>
      </div>
      <div className="pipeline-prompt">
        <span className="mono">THE BRIEF</span>
        <p>“Build a collaborative canvas where teams can think together.”</p>
      </div>
      <div className="pipeline-stage-list" aria-label="Compiler stage">
        {stages.map((item, index) => (
          <button
            type="button"
            key={item.name}
            aria-pressed={step === index}
            onClick={() => {
              setStep(index);
              setRunning(false);
            }}
          >
            <span>{index < step ? <Check size={12} /> : index + 1}</span>
            {item.name}
            {index < 3 && <ChevronRight size={13} />}
          </button>
        ))}
      </div>
      <div className="pipeline-result" key={step} aria-live="polite">
        <div>
          <span className="eyebrow">STAGE 0{step + 1}</span>
          <h4>{stage.headline}</h4>
          <p>{stage.detail}</p>
        </div>
        <pre>
          <code>{stage.code}</code>
        </pre>
      </div>
      <div className="pipeline-controls">
        <span className="mono">A simplified example of the architecture.</span>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            if (running) setRunning(false);
            else {
              setStep(0);
              setRunning(true);
            }
          }}
        >
          {running ? (
            <>
              <Pause size={15} />
              Pause tour
            </>
          ) : (
            <>
              <Play size={15} />
              Run the pipeline
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function GravityDemo({ active }) {
  const arenaRef = useRef(null);
  const nodes = useRef([]);
  const bodies = useRef([]);
  const dragging = useRef(null);
  const dragSample = useRef(null);
  const pulseRef = useRef(null);
  const pulseAnimation = useRef(null);
  const [physicsNote, setPhysicsNote] = useState("");
  useEffect(() => {
    const move = (event) => {
      const index = dragging.current;
      if (index === null || event.pointerId !== dragSample.current?.pointerId)
        return;
      const rect = arenaRef.current.getBoundingClientRect();
      const body = bodies.current[index];
      const last = dragSample.current;
      const elapsed = Math.max(8, event.timeStamp - last.time);
      body.x = Math.max(
        0,
        Math.min(event.clientX - rect.left - body.w / 2, rect.width - body.w),
      );
      body.y = Math.max(
        0,
        Math.min(event.clientY - rect.top - body.h / 2, rect.height - body.h),
      );
      body.vx = Math.max(
        -10,
        Math.min(((event.clientX - last.x) / elapsed) * 16.67, 10),
      );
      body.vy = Math.max(
        -10,
        Math.min(((event.clientY - last.y) / elapsed) * 16.67, 10),
      );
      body.rotation = Math.max(-8, Math.min(8, body.vx));
      body.spin = body.vx * 0.15;
      dragSample.current = {
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
        pointerId: event.pointerId,
      };
      nodes.current[index].style.transform =
        `translate(${body.x}px,${body.y}px) rotate(${body.rotation}deg)`;
    };
    const end = (event) => {
      const index = dragging.current;
      if (index === null) return;
      if (
        event.pointerId !== undefined &&
        event.pointerId !== dragSample.current?.pointerId
      )
        return;
      if (
        event.type !== "pointerup" ||
        event.timeStamp - dragSample.current.time > 100
      ) {
        bodies.current[index].vx = 0;
        bodies.current[index].vy = 0;
        bodies.current[index].spin = 0;
      }
      delete nodes.current[index].dataset.dragging;
      dragging.current = null;
      dragSample.current = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
  }, []);
  const [gravity, setGravity] = useState(true);
  const [running, setRunning] = useState(
    () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.motion !== "off",
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setRunning(
        !query.matches && document.documentElement.dataset.motion !== "off",
      );
    query.addEventListener("change", update);
    window.addEventListener("portfolio-motion-change", update);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("portfolio-motion-change", update);
    };
  }, []);
  const reset = useRef(() => {});
  const labels = [
    "React",
    "Python",
    "PyTorch",
    "FastAPI",
    "TypeScript",
    "Docker",
    "AWS",
    "PostgreSQL",
  ];
  useEffect(() => {
    let frame,
      width,
      height,
      previous = 0,
      visible = true;
    const init = () => {
      const rect = arenaRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      bodies.current = nodes.current.map((node, index) => ({
        x: Math.max(
          0,
          Math.min(((index % 3) * width) / 3 + 12, width - node.offsetWidth),
        ),
        y: Math.floor(index / 3) * 60 + 20,
        vx: (index % 2 ? 1 : -1) * 1.2,
        vy: 0,
        rotation: 0,
        spin: 0,
        w: node.offsetWidth,
        h: node.offsetHeight,
      }));
      paint();
    };
    const paint = () =>
      bodies.current.forEach((body, index) => {
        if (nodes.current[index])
          nodes.current[index].style.transform =
            `translate(${body.x}px,${body.y}px) rotate(${body.rotation}deg)`;
      });
    reset.current = init;
    const loop = (time) => {
      const dt = Math.min((time - previous) / 16.67 || 1, 2);
      previous = time;
      bodies.current.forEach((body, index) => {
        if (dragging.current === index) return;
        body.rotation = Math.max(
          -10,
          Math.min(10, (body.rotation + body.spin * dt) * 0.96 ** dt),
        );
        body.spin *= 0.92 ** dt;
        if (gravity) body.vy += 0.16 * dt;
        else {
          body.vy *= 0.998;
          body.vx *= 0.998;
        }
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        if (body.x < 0 || body.x + body.w > width) {
          body.vx *= -0.85;
          body.x = Math.max(0, Math.min(body.x, width - body.w));
        }
        if (body.y < 0 || body.y + body.h > height) {
          body.vy *= -0.8;
          body.y = Math.max(0, Math.min(body.y, height - body.h));
        }
        for (let j = index + 1; j < bodies.current.length; j++) {
          const other = bodies.current[j];
          const overlapX =
            Math.min(body.x + body.w, other.x + other.w) -
            Math.max(body.x, other.x);
          const overlapY =
            Math.min(body.y + body.h, other.y + other.h) -
            Math.max(body.y, other.y);
          if (overlapX > 0 && overlapY > 0 && dragging.current !== j) {
            if (overlapY < overlapX) {
              const sign = body.y < other.y ? -1 : 1;
              body.y += (sign * overlapY) / 2;
              other.y -= (sign * overlapY) / 2;
              [body.vy, other.vy] = [other.vy * 0.75, body.vy * 0.75];
            } else {
              const sign = body.x < other.x ? -1 : 1;
              body.x += (sign * overlapX) / 2;
              other.x -= (sign * overlapX) / 2;
              [body.vx, other.vx] = [other.vx, body.vx];
            }
          }
        }
      });
      paint();
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (running && active && visible && !document.hidden) {
        previous = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };
    const resize = new ResizeObserver(() => {
      const rect = arenaRef.current.getBoundingClientRect();
      if (
        rect.width &&
        rect.height &&
        (width !== rect.width || height !== rect.height)
      )
        init();
    });
    resize.observe(arenaRef.current);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(arenaRef.current);
    document.addEventListener("visibilitychange", sync);
    const rect = arenaRef.current.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!bodies.current.length && width) init();
    else paint();
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pulseAnimation.current?.cancel();
    };
  }, [gravity, running, active]);
  return (
    <div className="gravity-demo">
      <div className="demo-topbar">
        <span className="demo-label">
          <span />
          SKILL STACK / LITERALLY
        </span>
        <span className="mono">Drag a sticker. Tap empty space.</span>
      </div>
      <div
        className="gravity-arena"
        ref={arenaRef}
        onPointerDown={(event) => {
          if (event.target.closest("button") || event.button !== 0) return;
          const bounds = arenaRef.current.getBoundingClientRect();
          const x = event.clientX - bounds.left,
            y = event.clientY - bounds.top;
          for (const body of bodies.current) {
            const dx = body.x + body.w / 2 - x,
              dy = body.y + body.h / 2 - y;
            const distance = Math.hypot(dx, dy) || 1;
            const strength = Math.max(0, 1 - distance / 280) * 12;
            body.vx += (dx / distance) * strength;
            body.vy += (dy / distance) * strength - 2;
            body.spin = (dx / distance) * 2;
          }
          setPhysicsNote("A small disturbance in the skill stack.");
          setRunning(true);
          if (
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
            document.documentElement.dataset.motion !== "off"
          ) {
            pulseAnimation.current?.cancel();
            Object.assign(pulseRef.current.style, {
              left: `${x}px`,
              top: `${y}px`,
            });
            pulseAnimation.current = pulseRef.current.animate(
              [
                { scale: "0", opacity: 0.7 },
                { scale: "1", opacity: 0 },
              ],
              { duration: 450, easing: "ease-out" },
            );
          }
        }}
      >
        <span className="gravity-pulse" ref={pulseRef} aria-hidden="true" />
        <div className="gravity-watermark" aria-hidden="true">
          break
          <br />
          <em>the gravity.</em>
        </div>
        {labels.map((label, index) => (
          <button
            type="button"
            className="gravity-chip"
            key={label}
            ref={(node) => {
              nodes.current[index] = node;
            }}
            style={{ "--chip-color": colors[index % 4] }}
            aria-label={`Toss ${label}. Drag or press Enter.`}
            onClick={(event) => {
              if (event.detail === 0) {
                const body = bodies.current[index];
                body.vy = -9;
                body.vx = index % 2 ? 3 : -3;
                body.spin = index % 2 ? 2 : -2;
                setRunning(true);
              }
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || dragging.current !== null) return;
              dragging.current = index;
              dragSample.current = {
                x: event.clientX,
                y: event.clientY,
                time: event.timeStamp,
                pointerId: event.pointerId,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.dataset.dragging = "true";
            }}
          >
            {label}
            <MousePointer2 size={11} />
          </button>
        ))}
      </div>
      <div className="gravity-controls">
        <button
          type="button"
          aria-pressed={gravity}
          onClick={() => setGravity(!gravity)}
        >
          Gravity {gravity ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={() => {
            for (const body of bodies.current) {
              body.vy = -6 - Math.random() * 5;
              body.vx = (Math.random() - 0.5) * 12;
              body.spin = (Math.random() - 0.5) * 5;
            }
            setPhysicsNote(
              "That was clearly a suggestion. No frameworks were harmed.",
            );
            setRunning(true);
          }}
        >
          <Wand2 size={14} />
          Do not press
        </button>
        <button
          type="button"
          aria-label={running ? "Pause physics" : "Resume physics"}
          onClick={() => setRunning(!running)}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          type="button"
          aria-label="Reset physics"
          onClick={() => {
            reset.current();
            setPhysicsNote("");
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <p className="gravity-note" role="status">
        {physicsNote || "Contained chaos. Your actual skills are safe."}
      </p>
    </div>
  );
}

const tabs = [
  { id: "canvas", label: "The canvas", icon: PenLine },
  { id: "pipeline", label: "The pipeline", icon: Workflow },
  { id: "gravity", label: "The chaos", icon: Wand2 },
];
export default function BuildPlayground({ embedded = false }) {
  const [tab, setTab] = useState("canvas");
  const Container = embedded ? "div" : "section";
  return (
    <Container
      id={embedded ? undefined : "playground"}
      className={embedded ? "playground-content" : "shell playground-section"}
      aria-labelledby="playground-title"
    >
      <div className="playground-intro">
        <span className="eyebrow">
          <MousePointer2 size={15} />
          Not a spectator sport
        </span>
        <h2 id="playground-title">
          Less scrolling.
          <br />
          <em>More experimenting.</em>
        </h2>
        <p>
          Draw something. Step through a compiler. Throw my skills around. A few
          small experiments, made for your cursor.
        </p>
        <div className="playground-tabs" aria-label="Choose an experiment">
          {tabs.map((item) => (
            <button
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
              key={item.id}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        <span className="playground-footnote mono">
          <Code2 size={13} />
          SMALL EXPERIMENTS. REAL INTERACTIONS.
        </span>
        <a className="lab-entry-link" href="/lab">
          More where that came from. Enter the Lab <ArrowRight size={15} />
        </a>
      </div>
      <div className="playground-panel">
        <div hidden={tab !== "canvas"}>
          <DrawingCanvas />
        </div>
        <div hidden={tab !== "pipeline"}>
          <PipelineDemo active={tab === "pipeline"} />
        </div>
        <div hidden={tab !== "gravity"}>
          <GravityDemo active={tab === "gravity"} />
        </div>
      </div>
    </Container>
  );
}
