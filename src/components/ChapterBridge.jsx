import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deepfake } from "../assets";
import { motionAllowed } from "../utils/studioMotion";
import ResponsiveImage from "./ResponsiveImage";
import "../styles/journey.css";

const acts = [
  {
    label: "The question",
    title: "What if the answer came with evidence?",
    body: "A prediction alone isn't enough. My deepfake-forensics project explores a more useful question: how can someone understand what informed the result?",
  },
  {
    label: "The structure",
    title: "Give curiosity a working shape.",
    body: "Visual and audio signals become a pipeline: input, analysis, explanation. Separate responsibilities. Traceable decisions. An idea becomes something you can build.",
  },
  {
    label: "The experience",
    title: "Make the system human.",
    body: "Explanations, analysis reports, and an interface people can navigate. The interesting part is turning the machinery into something useful.",
  },
];

export default function ChapterBridge() {
  const rootRef = useRef(null);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const root = rootRef.current;
    const sections = [...root.querySelectorAll(".journey-act")];
    let frame = 0,
      current = 0;
    const measure = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const distances = sections.map((section) =>
        Math.abs(
          section.getBoundingClientRect().top +
            section.offsetHeight / 2 -
            innerHeight * 0.56,
        ),
      );
      const next = distances.indexOf(Math.min(...distances));
      if (next !== current) {
        current = next;
        setStage(next);
      }
      root.style.setProperty(
        "--journey-progress",
        Math.max(
          0,
          Math.min(1, (innerHeight * 0.6 - bounds.top) / bounds.height),
        ),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <section
      className="idea-journey"
      id="idea-journey"
      ref={rootRef}
      aria-labelledby="journey-title"
      data-stage={stage}
    >
      <header className="shell journey-heading">
        <span className="mono">THE MAKING OF / DEEPFAKE FORENSICS</span>
        <h2 id="journey-title">
          Every build starts
          <br />
          with <em>a better question.</em>
        </h2>
        <a href="#projects" className="text-link">
          Back to the work <ArrowUpRight size={17} />
        </a>
      </header>
      <div className="shell journey-layout">
        <div className="journey-narrative">
          {acts.map((act, index) => (
            <article
              className="journey-act"
              id={`idea-act-${index}`}
              key={act.label}
            >
              <span className="mono">
                0{index + 1} / {act.label}
              </span>
              <h3>{act.title}</h3>
              <p>{act.body}</p>
              {index === 2 && (
                <a className="text-link" href="#build-deepfake-forensics">
                  Explore Deepfake Forensics <ArrowUpRight size={17} />
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="journey-sticky">
          <nav className="journey-stages" aria-label="Follow the idea">
            {acts.map((act, index) => (
              <a
                key={act.label}
                href={`#idea-act-${index}`}
                aria-current={stage === index ? "step" : undefined}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  document.getElementById(`idea-act-${index}`).scrollIntoView({
                    block: "center",
                    behavior: motionAllowed() ? "smooth" : "instant",
                  });
                }}
              >
                0{index + 1} <span>{act.label}</span>
              </a>
            ))}
          </nav>
          <div className="journey-scene" aria-hidden="true">
            <span className="journey-coordinate mono">SA / IDEA → SYSTEM</span>
            <svg viewBox="0 0 600 460" className="journey-diagram">
              <defs>
                <pattern
                  id="idea-grid"
                  width="30"
                  height="30"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M30 0H0V30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth=".5"
                  />
                </pattern>
              </defs>
              <rect
                width="600"
                height="460"
                fill="url(#idea-grid)"
                opacity=".13"
              />
              <g className="idea-orbits">
                <ellipse cx="300" cy="230" rx="145" ry="145" />
                <ellipse
                  cx="300"
                  cy="230"
                  rx="210"
                  ry="85"
                  transform="rotate(-30 300 230)"
                />
              </g>
              <g className="idea-seed">
                <path d="M300 166L315 215L364 230L315 245L300 294L285 245L236 230L285 215Z" />
                <circle cx="300" cy="230" r="8" />
              </g>
              <g className="idea-circuit">
                <path
                  className="idea-wire"
                  d="M140 230H300H460M300 230V135H460V230M300 230V325H140V230"
                />
                {[
                  [140, "INPUT"],
                  [300, "ANALYSIS"],
                  [460, "EXPLANATION"],
                ].map(([x, label]) => (
                  <g key={label}>
                    <rect x={x - 50} y="205" width="100" height="50" rx="8" />
                    <text x={x} y="234" textAnchor="middle">
                      {label}
                    </text>
                    <circle cx={x} cy="192" r="3" />
                  </g>
                ))}
              </g>
            </svg>
            <div className="idea-interface">
              <div className="idea-browser">
                <i />
                <i />
                <i />
                <span>deepfake / evidence workspace</span>
              </div>
              <ResponsiveImage
                sizes="(max-width: 650px) 75vw, 550px"
                src={deepfake}
                alt=""
                loading="lazy"
                width="1200"
                height="675"
              />
              <div className="idea-result mono">
                QUESTION → STRUCTURE → EXPERIENCE
              </div>
            </div>
            <div className="journey-scene-label">
              <span className="mono">
                0{stage + 1} / {acts[stage].label}
              </span>
              <p>
                {
                  [
                    "One question. Many possibilities.",
                    "Connections become a system.",
                    "The idea is ready to meet people.",
                  ][stage]
                }
              </p>
            </div>
          </div>
          <span className="journey-footnote mono">
            A visual build story · scroll or choose a chapter
          </span>
        </div>
      </div>
    </section>
  );
}
