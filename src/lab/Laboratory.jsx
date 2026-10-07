import { ArrowLeft, ArrowUpRight, FlaskConical, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import DiscoveryTools, {
  DiscoverFragment,
} from "../components/interactive/DiscoveryTools";
import "../laboratory.css";

const Drawing = lazy(() =>
  import("../components/interactive/BuildPlayground").then((module) => ({
    default: module.DrawingCanvas,
  })),
);
const Pipeline = lazy(() =>
  import("../components/interactive/BuildPlayground").then((module) => ({
    default: module.PipelineDemo,
  })),
);
const Gravity = lazy(() =>
  import("../components/interactive/BuildPlayground").then((module) => ({
    default: module.GravityDemo,
  })),
);
const Signals = lazy(() => import("./SignalExperiment"));
const experiments = [
  {
    id: "canvas",
    name: "The shared impulse",
    status: "STABLE",
    kind: "Canvas / interaction",
    detail: "A small drawing surface. Leave an idea, undo it, or export it.",
    component: Drawing,
  },
  {
    id: "pipeline",
    name: "Anatomy of a prompt",
    status: "EXPERIMENTAL",
    kind: "Compiler / walkthrough",
    detail:
      "Follow a sample idea through four stages. An illustrative pipeline, without an API call.",
    component: Pipeline,
  },
  {
    id: "gravity",
    name: "Gravity has opinions",
    status: "CHAOTIC",
    kind: "Physics / interaction",
    detail: "Give the toolkit a gentle shove. The mess is yours to reset.",
    component: Gravity,
  },
  {
    id: "neural",
    name: "Neural playground",
    status: "EXPERIMENTAL",
    kind: "Signal / visualization",
    detail:
      "Move an attractor through a network. Explore how a local influence changes its connections.",
    component: Signals,
  },
  {
    id: "art",
    name: "Curiosity in a loop",
    status: "STABLE",
    kind: "Generative / art",
    detail:
      "A deterministic seed, a little energy and a different drawing every time. Export your discovery.",
    component: Signals,
  },
];

export default function Laboratory() {
  const [selected, setSelected] = useState(null);
  const panel = useRef(null);
  const launchers = useRef({});
  const experiment = experiments.find((item) => item.id === selected);
  useEffect(() => {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const originalDescription = description?.content;
    const originalCanonical = canonical?.href;
    document.title =
      "Saksham's Lab — Interactive Experiments | Saksham Agarwal";
    if (description)
      description.content =
        "Explore Saksham Agarwal's interactive drawing, compiler, gravity, neural visualization and generative art experiments.";
    if (canonical) canonical.href = "https://saksham-dev07.me/lab";
    window.scrollTo(0, 0);
    return () => {
      document.title = title;
      if (description) description.content = originalDescription;
      if (canonical) canonical.href = originalCanonical;
    };
  }, []);
  useEffect(() => {
    if (selected) {
      panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
      panel.current?.focus({ preventScroll: true });
    }
  }, [selected]);
  const close = () => {
    setSelected(null);
    launchers.current[selected]?.focus();
  };
  return (
    <div className="laboratory-page">
      <a className="skip-link" href="#lab-main">
        Skip to experiments
      </a>
      <header className="lab-header shell">
        <a className="brand-mark" href="/">
          sa<span>.</span>
        </a>
        <a href="/#playground">
          <ArrowLeft size={16} /> Back to portfolio
        </a>
        <span className="mono">INDEPENDENT EXPERIMENTS / VOL. 01</span>
      </header>
      <main id="lab-main" className="shell">
        <div className="lab-intro">
          <span className="eyebrow">
            <FlaskConical size={15} /> CURIOSITY, IN PUBLIC
          </span>
          <h1>
            SAKSHAM'S
            <br />
            <em>LAB</em>
            <span aria-hidden="true">.</span>
          </h1>
          <p>Things I build when curiosity wins.</p>
          <span className="mono">
            Small ideas. Working controls. Occasionally questionable gravity.
          </span>
          <DiscoverFragment id="lab" />
        </div>
        <div className="lab-grid">
          {experiments.map((item, index) => (
            <article className={`lab-card lab-card-${item.id}`} key={item.id}>
              <div className="lab-card-top">
                <span className="mono">EXPERIMENT / 0{index + 1}</span>
                <span className="lab-status mono">{item.status}</span>
              </div>
              <div className="lab-specimen" aria-hidden="true">
                {Array.from(
                  { length: item.id === "neural" ? 9 : 5 },
                  (_, i) => (
                    <i key={i} style={{ "--i": i }} />
                  ),
                )}
              </div>
              <span className="mono">{item.kind}</span>
              <h2>{item.name}</h2>
              <p>{item.detail}</p>
              <button
                type="button"
                ref={(node) => {
                  launchers.current[item.id] = node;
                }}
                aria-expanded={selected === item.id}
                aria-controls="lab-experiment"
                onClick={() => setSelected(item.id)}
              >
                Launch experiment <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
        {experiment && (
          <section
            id="lab-experiment"
            className="lab-experiment"
            ref={panel}
            tabIndex={-1}
            aria-labelledby="experiment-title"
          >
            <header>
              <div>
                <span className="mono">EXPERIMENT RUNNING</span>
                <h2 id="experiment-title">{experiment.name}</h2>
              </div>
              <button type="button" onClick={close}>
                <X size={17} /> Close experiment
              </button>
            </header>
            <Suspense fallback={<p role="status">Opening this experiment…</p>}>
              <experiment.component
                key={experiment.id}
                active
                mode={selected === "art" ? "art" : "neural"}
              />
            </Suspense>
          </section>
        )}
        <footer className="lab-footer">
          <p>
            Some ideas become projects.
            <br />
            <em>Some just make you curious.</em>
          </p>
          <a href="/#contact">
            Have an interesting one? <ArrowUpRight size={16} />
          </a>
        </footer>
      </main>
      <DiscoveryTools />
    </div>
  );
}
