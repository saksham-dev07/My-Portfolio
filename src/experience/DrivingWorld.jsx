import { ArrowLeft, Compass, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import "../driving-world.css";

export default function DrivingWorld({ onExit }) {
  const frame = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Saksham Agarwal | The Driving World";

    const onMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "exit-world"
      ) {
        onExit?.();
      }
    };
    window.addEventListener("message", onMessage);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onExit?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.title = previousTitle;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onExit]);

  return (
    <main
      className="driving-world-container"
      role="main"
      aria-label="3D Driving World Portfolio"
    >
      <header className="driving-world-bar">
        <button
          type="button"
          onClick={() => onExit?.()}
          className="driving-world-exit-btn"
          aria-label="Return to portfolio"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Return to Portfolio</span>
        </button>

        <div className="driving-world-meta">
          <span className="mono">
            <Compass size={13} aria-hidden="true" /> THE DRIVING WORLD
          </span>
          <span className="driving-world-dot" aria-hidden="true" />
          <span>Interactive 3D Portfolio</span>
        </div>

        <a
          href="/driving-world/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="driving-world-tab-btn"
          aria-label="Open Driving World in standalone tab"
        >
          <span>Open Full Tab</span>
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      </header>

      <iframe
        ref={frame}
        src="/driving-world/index.html"
        title="Saksham's Driving World"
        className="driving-world-iframe"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
