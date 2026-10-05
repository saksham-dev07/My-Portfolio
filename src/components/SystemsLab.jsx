import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Database,
  ScanLine,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import SectionHeading from "./SectionHeading";

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
export default function SystemsLab() {
  const [selected, setSelected] = useState("forensics");
  const flow = flows.find((item) => item.id === selected);
  return (
    <section
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
                onClick={() => setSelected(item.id)}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="architecture-content"
            key={selected}
            aria-live="polite"
          >
            <div className="architecture-intro">
              <span className="eyebrow">
                Architecture notes / Illustrative flow
              </span>
              <h3>{flow.title}</h3>
              <p>{flow.body}</p>
            </div>
            <div className="flow-diagram">
              {flow.steps.map((step, index) => (
                <div className="flow-step" key={step.name}>
                  <span className="flow-icon">
                    <step.icon size={24} />
                  </span>
                  <span className="mono">0{index + 1}</span>
                  <h4>{step.name}</h4>
                  <p>{step.detail}</p>
                  {index < flow.steps.length - 1 && (
                    <ArrowRight
                      className="flow-arrow"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
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
