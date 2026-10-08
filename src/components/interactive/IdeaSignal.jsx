import {
  ArrowRight,
  Braces,
  Lightbulb,
  MousePointer2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { motionAllowed } from "../../utils/studioMotion";
import "../../styles/idea-signal.css";

const captions = {
  idle: "A question is where it starts. Send one through.",
  idea: "Start with a little curiosity.",
  system: "Give the idea a working structure.",
  experience: "Make it useful to someone.",
  complete: "Connected. A little logic. A lot of possibility.",
};

export default function IdeaSignal() {
  const [phase, setPhase] = useState("idle");
  const [run, setRun] = useState(0);
  const captionId = useId();
  const stopRef = useRef(() => {});
  const running = ["idea", "system", "experience"].includes(phase);

  useEffect(() => {
    if (!run) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers = [];
    const stop = () => {
      timers.forEach(clearTimeout);
      setPhase("complete");
    };
    stopRef.current = stop;
    const onPreference = () => {
      if (!motionAllowed()) stop();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    if (!motionAllowed() || document.hidden) {
      stop();
      return;
    }
    setPhase("idea");
    for (const [next, delay] of [
      ["system", 640],
      ["experience", 1280],
      ["complete", 2180],
    ]) {
      timers.push(setTimeout(() => setPhase(next), delay));
    }
    reduced.addEventListener("change", onPreference);
    window.addEventListener("portfolio-motion-change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      timers.forEach(clearTimeout);
      reduced.removeEventListener("change", onPreference);
      window.removeEventListener("portfolio-motion-change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      stopRef.current = () => {};
    };
  }, [run]);

  return (
    <div className="idea-signal" data-phase={phase}>
      <div className="idea-signal-heading">
        <span className="mono">CURIOSITY, CONNECTED</span>
        <button
          type="button"
          className="idea-signal-launch"
          aria-label={
            running ? "Finish the signal" : "Send an idea through the system"
          }
          aria-describedby={captionId}
          onClick={() => {
            if (running) stopRef.current();
            else setRun((value) => value + 1);
          }}
        >
          {running
            ? "Skip to the good part"
            : run
              ? "One more idea"
              : "Send an idea"}
          {run && !running ? (
            <RotateCcw size={13} aria-hidden="true" />
          ) : (
            <ArrowRight size={13} aria-hidden="true" />
          )}
        </button>
      </div>
      <svg
        className="idea-signal-diagram"
        viewBox="0 0 300 64"
        aria-hidden="true"
        key={run}
      >
        <path
          className="idea-signal-wire"
          d="M54 31 H78 Q84 31 84 25 V19 Q84 13 90 13 H104 Q110 13 110 19 V25 Q110 31 116 31 H126"
        />
        <path
          className="idea-signal-wire"
          d="M172 31 H196 Q202 31 202 37 V43 Q202 49 208 49 H222 Q228 49 228 43 V37 Q228 31 234 31 H244"
        />
        <path
          className="idea-packet idea-packet-first"
          pathLength="1"
          d="M54 31 H78 Q84 31 84 25 V19 Q84 13 90 13 H104 Q110 13 110 19 V25 Q110 31 116 31 H126"
        />
        <path
          className="idea-packet idea-packet-second"
          pathLength="1"
          d="M172 31 H196 Q202 31 202 37 V43 Q202 49 208 49 H222 Q228 49 228 43 V37 Q228 31 234 31 H244"
        />
        <g className="idea-node idea-node-start">
          <rect x="8" y="8" width="46" height="46" rx="13" />
          <Lightbulb x="21" y="21" width="20" height="20" />
        </g>
        <g className="idea-node idea-node-system">
          <rect x="126" y="8" width="46" height="46" rx="13" />
          <Braces x="139" y="21" width="20" height="20" />
        </g>
        <g className="idea-node idea-node-experience">
          <rect x="244" y="8" width="46" height="46" rx="13" />
          <MousePointer2 x="257" y="21" width="20" height="20" />
          <circle className="idea-arrival-ring" cx="267" cy="31" r="28" />
        </g>
      </svg>
      <div className="idea-signal-labels mono" aria-hidden="true">
        <span>IDEA</span>
        <span>SYSTEM</span>
        <span>EXPERIENCE</span>
      </div>
      <p id={captionId}>{captions[phase]}</p>
      <span className="sr-only" role="status">
        {phase === "complete"
          ? "Idea connected: curiosity becomes a system, then a useful experience."
          : ""}
      </span>
    </div>
  );
}
