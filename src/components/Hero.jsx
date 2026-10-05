import {
  ArrowDownRight,
  ArrowUpRight,
  Github,
  Linkedin,
  Monitor,
  Scan,
  UserRound,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { profileStudio } from "../assets";
import PortraitStudio from "./interactive/PortraitStudio";
import SignalSculpture from "./interactive/SignalSculpture";

const WorkstationStage = lazy(() => import("./interactive/WorkstationStage"));
const scenes = {
  desk: {
    number: "01",
    label: "THE DESK",
    title: "Where ideas become real.",
    note: "An open editor, a question, a reason to build.",
    caption: "An idea. A little persistence. A working system.",
    short: "Where the next idea starts.",
  },
  signal: {
    number: "02",
    label: "THE SIGNAL",
    title: "Finding the pattern.",
    note: "Models are useful when people can understand their decisions.",
    caption: "Patterns → understanding → something useful.",
    short: "A little structure in the unexpected.",
  },
  portrait: {
    number: "03",
    label: "THE HUMAN",
    title: "The person behind the code.",
    note: "Curiosity connects everything I build.",
    caption: "One curious mind. Many reasons to keep building.",
    short: "Curious by nature. A builder by choice.",
  },
};

export default function Hero() {
  const [view, setView] = useState("desk");
  const scene = scenes[view];
  return (
    <section
      id="home"
      className="hero shell studio-hero"
      aria-labelledby="hero-title"
    >
      <div className="hero-topline">
        <span className="availability">
          <span />
          Open to internships &amp; collaborations
        </span>
        <span className="mono hero-location">
          SOFTWARE ENGINEER / APPLIED AI / CLASS OF 2027
        </span>
      </div>
      <h1 id="hero-title" className="hero-name" aria-label="Saksham Agarwal">
        <span className="name-line">
          <span>Saksham</span>
        </span>
        <span className="name-line name-surname">
          <span>
            Agarwal<span className="name-period">.</span>
          </span>
        </span>
      </h1>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="hero-cross" aria-hidden="true">
              +
            </span>
            A builder's digital studio
          </p>
          <h2 className="hero-manifesto">
            A little logic.
            <br />
            <em>A lot of curiosity.</em>
          </h2>
          <p className="hero-description">
            I turn complex ideas into intelligent, useful experiences. Applied
            AI, full-stack systems, and interfaces with a little personality.
          </p>
          <div className="hero-actions">
            <a className="button button-primary magnetic" href="#projects">
              Explore the work <ArrowDownRight size={18} />
            </a>
            <a className="button button-secondary magnetic" href="#playground">
              Go off-script <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-socials">
            <a href="/resume.pdf" target="_blank" rel="noreferrer">
              Résumé <ArrowUpRight size={13} />
            </a>
            <a
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
          </div>
          <div className="hero-note-card" data-scene={view} key={view}>
            <span className="mono">
              {scene.number} / {scene.label}
            </span>
            <p>
              <strong>{scene.title}</strong>
              <br />
              {scene.note}
            </p>
            <svg viewBox="0 0 100 60" aria-hidden="true">
              <path d="M5 12 Q40 0 42 32 T86 37 M73 32 L88 39 L79 50" />
            </svg>
          </div>
        </div>
        <div className="hero-art creative-art studio-hero-art">
          <div className="art-view-toggle" aria-label="Hero experience">
            <button
              type="button"
              aria-pressed={view === "desk"}
              onClick={() => setView("desk")}
            >
              <Monitor size={13} />
              <span className="scene-choice-number">01</span>
              The desk
            </button>
            <button
              type="button"
              aria-pressed={view === "signal"}
              onClick={() => setView("signal")}
            >
              <Scan size={13} />
              <span className="scene-choice-number">02</span>
              The signal
            </button>
            <button
              type="button"
              aria-pressed={view === "portrait"}
              onClick={() => setView("portrait")}
            >
              <UserRound size={13} />
              <span className="scene-choice-number">03</span>
              The human
            </button>
          </div>
          <div className="hero-scene-switch" key={view}>
            {view === "desk" ? (
              <Suspense
                fallback={
                  <div className="workstation-loading" role="status">
                    <Monitor size={30} />
                    <p>Opening the studio…</p>
                    <span>The original 3D workstation</span>
                  </div>
                }
              >
                <WorkstationStage />
              </Suspense>
            ) : view === "signal" ? (
              <SignalSculpture />
            ) : (
              <PortraitStudio />
            )}
          </div>
          <div className="creative-caption">
            <img src={profileStudio} alt="" width={34} height={34} />
            <p>
              {scene.title}
              <span>{scene.caption}</span>
            </p>
            <span className="mono">SA / 2026</span>
          </div>
          <p className="hero-scene-note">
            <span>
              {scene.number} / {scene.label}
            </span>
            {scene.short}
          </p>
        </div>
      </div>
      <div className="hero-bottom">
        <span className="mono">IDEAS TO INTERFACES. MODELS TO MEANING.</span>
        <a href="#playground">
          There’s more to play with <ArrowDownRight size={15} />
        </a>
        <span className="mono">SCROLL TO DISCOVER</span>
      </div>
    </section>
  );
}
