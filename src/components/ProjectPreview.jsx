import { ArrowUpRight, Layers3, Monitor, Play } from "lucide-react";
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { projectBlueprints } from "../data/projectBlueprints";
import { discover } from "../utils/discovery";
import { motionAllowed } from "../utils/studioMotion";
import { DiscoverFragment } from "./interactive/DiscoveryTools";
import ResponsiveImage from "./ResponsiveImage";
import "../styles/project-samples.css";

const ForensicsSample = lazy(() => import("./interactive/ForensicsSample"));
const PipelineSample = lazy(() =>
  import("./interactive/BuildPlayground").then((module) => ({
    default: module.PipelineDemo,
  })),
);

export default function ProjectPreview({ project }) {
  const [mode, setMode] = useState("interface");
  const [step, setStep] = useState(0);
  const visualRef = useRef(null);
  const previousMode = useRef(mode);
  const blueprint = projectBlueprints[project.id];
  const stages = blueprint?.stages;
  const hasSample = ["deepfake-forensics", "nl-app-compiler"].includes(
    project.id,
  );

  useLayoutEffect(() => {
    if (previousMode.current === mode) return;
    const openingBlueprint = mode === "blueprint";
    previousMode.current = mode;
    if (!motionAllowed() || document.hidden) return;
    const panel = visualRef.current?.querySelector(
      ":scope > .project-preview, :scope > .project-blueprint, :scope > .project-sample",
    );
    if (!panel) return;
    const animation = panel.animate(
      [
        {
          opacity: 0.35,
          transform: openingBlueprint
            ? "translateX(18px)"
            : "translateY(12px) scale(.985)",
          clipPath: openingBlueprint ? "inset(0 0 0 8%)" : "inset(0)",
        },
        { opacity: 1, transform: "none", clipPath: "inset(0)" },
      ],
      { duration: 440, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (!motionAllowed() || document.hidden) animation.cancel();
    };
    reduced.addEventListener("change", settle);
    window.addEventListener("portfolio-motion-change", settle);
    document.addEventListener("visibilitychange", settle);
    return () => {
      animation.cancel();
      reduced.removeEventListener("change", settle);
      window.removeEventListener("portfolio-motion-change", settle);
      document.removeEventListener("visibilitychange", settle);
    };
  }, [mode]);

  return (
    <div
      className={`project-visual preview-${project.category}`}
      ref={visualRef}
      data-preview-mode={mode}
    >
      {stages && (
        <div
          className="project-lens"
          role="group"
          aria-label={`View ${project.name}`}
        >
          <button
            type="button"
            aria-pressed={mode === "interface"}
            onClick={() => setMode("interface")}
          >
            <Monitor size={12} />
            Interface
          </button>
          <button
            type="button"
            aria-pressed={mode === "blueprint"}
            onClick={() => {
              discover("blueprint");
              setMode("blueprint");
            }}
          >
            <Layers3 size={12} />
            Blueprint
          </button>
          {hasSample && (
            <button
              type="button"
              aria-pressed={mode === "sample"}
              onClick={() => setMode("sample")}
            >
              <Play size={12} aria-hidden="true" />
              Try a sample
            </button>
          )}
        </div>
      )}
      {mode === "sample" ? (
        <div className="project-sample">
          <Suspense
            fallback={
              <div className="sample-loading" role="status">
                Opening the sample…
              </div>
            }
          >
            {project.id === "deepfake-forensics" ? (
              <ForensicsSample />
            ) : (
              <PipelineSample active={mode === "sample"} />
            )}
          </Suspense>
        </div>
      ) : mode === "interface" || !stages ? (
        <a
          className={`project-preview preview-${project.category}`}
          href={project.live_demo || project.source_code_link}
          target="_blank"
          rel="noreferrer"
          aria-label={`Explore ${project.name} (opens in a new tab)`}
          data-cursor="View interface"
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse" || !motionAllowed()) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty(
              "--lens-x",
              `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
            );
            event.currentTarget.style.setProperty(
              "--lens-y",
              `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
            );
          }}
        >
          <span className="preview-light" aria-hidden="true" />
          <div className="preview-bar">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="mono">{project.id.replaceAll("-", " / ")}</span>
            <ArrowUpRight size={15} />
          </div>
          <div className="preview-image">
            <ResponsiveImage
              sizes="(max-width: 650px) 90vw, (max-width: 1100px) 50vw, 650px"
              src={project.image}
              alt={`Interface preview of ${project.name}`}
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="preview-open">
            <ArrowUpRight size={21} />
          </span>
        </a>
      ) : (
        <div className="project-blueprint">
          <div className="blueprint-heading">
            <span className="mono">UNDER THE INTERFACE</span>
            <span className="mono">FIG. 0{step + 1}</span>
          </div>
          <svg
            viewBox="0 0 460 155"
            aria-hidden="true"
            className="blueprint-diagram"
            data-step={step}
          >
            {blueprint.edges.map(([from, to], i) => {
              const a = blueprint.nodes[from];
              const b = blueprint.nodes[to];
              return (
                <path
                  key={i}
                  className={`blueprint-path${b[3] === step ? " is-flowing" : ""}`}
                  pathLength="1"
                  d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`}
                />
              );
            })}
            {blueprint.nodes.map(([x, y, label, stage]) => (
              <g key={label} className={step === stage ? "is-active" : ""}>
                <rect x={x - 34} y={y - 14} width="68" height="28" rx="4" />
                <text x={x} y={y + 4} textAnchor="middle">
                  {label}
                </text>
              </g>
            ))}
          </svg>
          <div
            className="blueprint-steps"
            role="group"
            aria-label={`Explore ${project.name} architecture`}
          >
            {stages.map(([title, tech], i) => (
              <button
                key={title}
                type="button"
                aria-pressed={step === i}
                onClick={() => setStep(i)}
              >
                <span className="mono">0{i + 1}</span>
                <strong>{title}</strong>
                <small>{tech}</small>
              </button>
            ))}
          </div>
          <p className="blueprint-note" aria-live="polite" key={step}>
            {stages[step][2]}
          </p>
          <DiscoverFragment id="blueprint" />
          <a
            className="blueprint-footnote mono"
            href={`${project.source_code_link}#readme`}
            target="_blank"
            rel="noreferrer"
          >
            SIMPLIFIED ARCHITECTURE · VIEW SOURCE <ArrowUpRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}
