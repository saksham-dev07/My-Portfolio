import { ArrowUpRight, Layers3, Monitor } from "lucide-react";
import { useState } from "react";

import { projectBlueprints } from "../data/projectBlueprints";
import { discover } from "../utils/discovery";
import { motionAllowed } from "../utils/studioMotion";
import { DiscoverFragment } from "./interactive/DiscoveryTools";

export default function ProjectPreview({ project }) {
  const [mode, setMode] = useState("interface");
  const [step, setStep] = useState(0);
  const blueprint = projectBlueprints[project.id];
  const stages = blueprint?.stages;
  return (
    <div className={`project-visual preview-${project.category}`}>
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
        </div>
      )}
      {mode === "interface" || !stages ? (
        <a
          className={`project-preview preview-${project.category}`}
          href={project.live_demo || project.source_code_link}
          target="_blank"
          rel="noreferrer"
          aria-label={`Explore ${project.name} (opens in a new tab)`}
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
            <img
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
