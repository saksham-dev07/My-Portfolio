import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Database,
  Pause,
  Play,
  ScanLine,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRole } from "../context/RoleContext";
import { motionAllowed } from "../utils/studioMotion";
import SectionHeading from "./SectionHeading";
import "../styles/connected-stories.css";

const flows = [
  {
    id: "forensics",
    label: "Explainable AI",
    icon: ScanLine,
    title: "Evidence alongside a prediction.",
    body: "The deepfake research platform combines 15 visual and audio signals with explanation maps and PDF reports. Dataset benchmarks describe particular tests; a prediction still needs human review.",
    steps: [
      { icon: ScanLine, name: "Input", detail: "Visual & audio signals" },
      {
        icon: BrainCircuit,
        name: "Inference",
        detail: "15 forensic signals",
      },
      { icon: ShieldCheck, name: "Explanation", detail: "Grad-CAM & SHAP" },
      { icon: Code2, name: "Output", detail: "PDF analysis report" },
    ],
    principle: "Design for understanding",
    note: "Make the reasoning visible so a user can examine what informed the result.",
  },
  {
    id: "compiler",
    label: "LLM workflows",
    icon: Workflow,
    title: "A pipeline with clear boundaries.",
    body: "The natural-language app compiler chains Gemini calls across intent, interface, schema, and refinement. Each stage has a defined responsibility and feeds a structured result into the next.",
    steps: [
      { icon: Code2, name: "Intent", detail: "Parse requirements" },
      { icon: Workflow, name: "Design", detail: "Build UI structure" },
      { icon: Database, name: "Schema", detail: "Model application data" },
      { icon: ShieldCheck, name: "Refinement", detail: "Cross-layer checks" },
    ],
    principle: "Structure before scale",
    note: "Break a large generative task into smaller steps that can be inspected and refined.",
  },
  {
    id: "realtime",
    label: "Real-time systems",
    icon: Code2,
    title: "Shared state, responsive interfaces.",
    body: "NexusBoard combines a double-buffered Canvas interface with Socket.IO and Node.js. Local drawing stays responsive while stroke updates travel to the shared room.",
    steps: [
      { icon: Code2, name: "Interaction", detail: "Draw a canvas stroke" },
      { icon: Workflow, name: "Stroke", detail: "Serialize drawing data" },
      { icon: Database, name: "Transport", detail: "Share through Socket.IO" },
      { icon: ShieldCheck, name: "Render", detail: "Apply to shared canvas" },
    ],
    principle: "Respect the interaction",
    note: "Keep the local experience responsive while moving updates through a clear synchronization path.",
  },
];
// Small, illustrative payloads explain the boundaries without running a model.
const samples = {
  forensics: {
    project: "deepfake-forensics",
    payload: "A video frame and its audio track",
    stages: [
      [
        "video + audio",
        "face crop + audio features",
        "Prepare the visual and audio inputs for separate analysis.",
      ],
      [
        "face crop + audio features",
        "visual + lip-sync signals",
        "Different forensic signals contribute evidence to the analysis.",
      ],
      [
        "signals + model activations",
        "attribution map + signal summary",
        "An explanation shows which regions informed a result. It is evidence to inspect, not proof by itself.",
      ],
      [
        "analysis + explanation",
        "PDF evidence report",
        "Bring the findings and their context together for human review.",
      ],
    ],
  },
  compiler: {
    project: "nl-app-compiler",
    payload: "Build a task board with owners and due dates",
    stages: [
      [
        "task-board request",
        "Task { title, owner, dueDate }",
        "Turn an open-ended request into explicit application requirements.",
      ],
      [
        "structured requirements",
        "Board → columns → task cards",
        "Choose interface responsibilities before generating their implementation.",
      ],
      [
        "requirements + UI structure",
        "tasks { id, title, ownerId, dueDate }",
        "Keep the application data aligned with what the interface needs.",
      ],
      [
        "intent + interface + schema",
        "application structure for review",
        "Check the generated layers together, then inspect and refine the result.",
      ],
    ],
  },
  realtime: {
    project: "nexusboard",
    payload: "A new stroke on a shared whiteboard",
    stages: [
      [
        "pointer positions",
        "local canvas stroke",
        "Draw locally first so the interface can respond without waiting for the network.",
      ],
      [
        "local canvas stroke",
        "{ points, color, width }",
        "Serialize the stroke into the data other clients need to render it.",
      ],
      [
        "stroke payload",
        "Socket.IO → shared room",
        "Move the update through the room's synchronization boundary.",
      ],
      [
        "received stroke payload",
        "stroke on another canvas",
        "Apply the received drawing data to the shared canvas.",
      ],
    ],
  },
};
export default function SystemsLab() {
  const [selected, setSelected] = useState("forensics");
  const [stepIndex, setStepIndex] = useState(0);
  const [tracing, setTracing] = useState(false);
  const section = useRef(null);
  const { setActiveRole } = useRole();
  const flow = flows.find((item) => item.id === selected);
  const sample = samples[selected];
  const stage = sample.stages[stepIndex];
  useEffect(() => {
    if (!tracing) return;
    const timer = setTimeout(() => {
      if (stepIndex === flow.steps.length - 1) setTracing(false);
      else setStepIndex((index) => index + 1);
    }, 1100);
    return () => clearTimeout(timer);
  }, [tracing, stepIndex, flow.steps.length]);
  useEffect(() => {
    const stop = () => {
      if (document.hidden || !motionAllowed()) setTracing(false);
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setTracing(false);
    });
    observer.observe(section.current);
    document.addEventListener("visibilitychange", stop);
    window.addEventListener("portfolio-motion-change", stop);
    reduced.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", stop);
      window.removeEventListener("portfolio-motion-change", stop);
      reduced.removeEventListener("change", stop);
    };
  }, []);
  const inspect = (index) => {
    setTracing(false);
    setStepIndex(index);
  };
  return (
    <section
      ref={section}
      id="systems-lab"
      className="approach-section"
      aria-labelledby="approach-title"
    >
      <div className="shell section-block">
        <SectionHeading
          number="02"
          label="How I think"
          title={
            <span id="approach-title">
              Beyond the interface.
              <br />
              <em>Inside the system.</em>
            </span>
          }
          description="A look at the decisions and architecture patterns behind my projects."
        />
        <div className="architecture-card">
          <div
            className="architecture-tabs"
            aria-label="Explore architecture patterns"
          >
            {flows.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => {
                  setTracing(false);
                  setStepIndex(0);
                  setSelected(item.id);
                }}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="architecture-content" key={selected}>
            <div className="architecture-intro">
              <span className="eyebrow">
                Architecture notes / Illustrative flow
              </span>
              <h3>{flow.title}</h3>
              <p>{flow.body}</p>
            </div>
            <div className="trace-toolbar">
              <div>
                <span className="mono">FOLLOW A SAMPLE</span>
                <p>{sample.payload}</p>
              </div>
              <button
                type="button"
                className="trace-control"
                onClick={() => {
                  if (tracing) setTracing(false);
                  else {
                    setStepIndex(motionAllowed() ? 0 : flow.steps.length - 1);
                    setTracing(motionAllowed());
                  }
                }}
              >
                {tracing ? (
                  <Pause size={15} aria-hidden="true" />
                ) : (
                  <Play size={15} aria-hidden="true" />
                )}
                {tracing ? "Pause trace" : "Trace a sample"}
              </button>
            </div>
            <div
              className="flow-diagram"
              role="group"
              aria-label="Inspect a system stage"
            >
              {flow.steps.map((step, index) => (
                <button
                  type="button"
                  className="flow-step"
                  key={step.name}
                  aria-pressed={stepIndex === index}
                  aria-controls="trace-inspector"
                  onClick={() => inspect(index)}
                  onFocus={() => {
                    if (!tracing) setStepIndex(index);
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse" && !tracing)
                      setStepIndex(index);
                  }}
                  data-transferring={tracing && stepIndex === index}
                >
                  <span className="flow-icon">
                    <step.icon size={24} />
                  </span>
                  <span className="mono">0{index + 1}</span>
                  <strong className="flow-name">{step.name}</strong>
                  <span className="flow-detail">{step.detail}</span>
                  {index < flow.steps.length - 1 && (
                    <ArrowRight
                      className="flow-arrow"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
            <div
              id="trace-inspector"
              className="trace-inspector"
              aria-live="polite"
            >
              <div className="trace-inspector-title">
                <span className="mono">
                  0{stepIndex + 1} / {flow.steps[stepIndex].name}
                </span>
                <span className="mono">ILLUSTRATIVE PAYLOAD</span>
              </div>
              <div className="trace-payload">
                <div>
                  <span className="mono">IN</span>
                  <code>{stage[0]}</code>
                </div>
                <ArrowRight size={20} aria-hidden="true" />
                <div>
                  <span className="mono">OUT</span>
                  <code>{stage[1]}</code>
                </div>
              </div>
              <p>{stage[2]}</p>
              <a
                className="text-link"
                href={`#build-${sample.project}`}
                onClick={(event) => {
                  if (
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  )
                    flushSync(() => setActiveRole("all"));
                }}
              >
                See the project <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="architecture-principle">
              <span className="mono">THE PRINCIPLE</span>
              <strong>{flow.principle}</strong>
              <p>{flow.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
