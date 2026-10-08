import { Fingerprint, ShieldCheck, Terminal, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { discover, fragments, readDiscovery } from "../../utils/discovery";

const SecretTerminal = lazy(() => import("./SecretTerminal"));

export function DiscoverFragment({ id }) {
  const [found, setFound] = useState(() =>
    readDiscovery().fragments.includes(id),
  );
  useEffect(() => {
    const update = () => setFound(readDiscovery().fragments.includes(id));
    window.addEventListener("portfolio-discovery", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("portfolio-discovery", update);
      window.removeEventListener("storage", update);
    };
  }, [id]);
  return (
    <div className="margin-fragment">
      <button
        type="button"
        aria-expanded={found}
        aria-label={`Inspect ${id} fragment`}
        onClick={() => {
          discover(id);
          setFound(true);
        }}
      >
        <Fingerprint size={15} />{" "}
        <span className="mono">
          {found ? "FRAGMENT RECOVERED" : "A TRACE IN THE MARGIN"}
        </span>
      </button>
      {found && <p role="status">{fragments[id]}</p>}
    </div>
  );
}

export default function DiscoveryTools() {
  const [terminal, setTerminal] = useState(false);
  const [detective, setDetective] = useState(false);
  const [progress, setProgress] = useState(readDiscovery);
  const [celebrating, setCelebrating] = useState(false);
  const previousCount = useRef(progress.fragments.length);
  const celebrationTimer = useRef(null);
  useEffect(() => {
    const update = (event) => {
      const next = readDiscovery();
      if (
        event.type === "portfolio-discovery" &&
        previousCount.current < 4 &&
        next.fragments.length === 4
      ) {
        setCelebrating(true);
        clearTimeout(celebrationTimer.current);
        celebrationTimer.current = setTimeout(
          () => setCelebrating(false),
          6000,
        );
      }
      previousCount.current = next.fragments.length;
      setProgress({ ...next });
    };
    const shortcut = (event) => {
      if (event.ctrlKey && event.code === "Backquote" && !event.repeat) {
        event.preventDefault();
        setTerminal((value) => !value);
      }
    };
    window.addEventListener("keydown", shortcut);
    window.addEventListener("portfolio-discovery", update);
    window.addEventListener("storage", update);
    return () => {
      clearTimeout(celebrationTimer.current);
      window.removeEventListener("keydown", shortcut);
      window.removeEventListener("portfolio-discovery", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <>
      {celebrating && (
        <div className="discovery-completion">
          <button
            className="completion-close"
            type="button"
            aria-label="Dismiss discovery celebration"
            onClick={() => setCelebrating(false)}
          >
            <X size={15} aria-hidden="true" />
          </button>
          <div className="completion-emblem" aria-hidden="true">
            <svg className="completion-pieces" viewBox="0 0 64 64">
              {[
                "M8 8H30V30H8Z",
                "M34 8H56V30H34Z",
                "M8 34H30V56H8Z",
                "M34 34H56V56H34Z",
              ].map((path, index) => (
                <path
                  key={path}
                  d={path}
                  style={{
                    "--piece-x": `${index % 2 ? 22 : -22}px`,
                    "--piece-y": `${index < 2 ? -22 : 22}px`,
                  }}
                />
              ))}
            </svg>
            <ShieldCheck className="completion-seal" size={32} />
            <svg className="completion-sparks" viewBox="0 0 100 100">
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <line
                  key={angle}
                  x1="50"
                  y1="12"
                  x2="50"
                  y2="20"
                  transform={`rotate(${angle} 50 50)`}
                />
              ))}
            </svg>
          </div>
          <div role="status">
            <span className="mono">CASE CLOSED / 04 OF 04</span>
            <strong>Curiosity confirmed.</strong>
            <p>You found every hidden fragment.</p>
          </div>
        </div>
      )}
      <div className="discovery-launchers">
        <button
          type="button"
          aria-label="Open developer terminal"
          id="developer-terminal-launcher"
          aria-keyshortcuts="Control+`"
          onClick={() => {
            setDetective(false);
            setTerminal(true);
          }}
        >
          <Terminal size={17} />
          <span className="mono">TERMINAL</span>
        </button>
        <button
          type="button"
          aria-label="Developer detective mode"
          aria-expanded={detective}
          onClick={() => setDetective((value) => !value)}
        >
          <Fingerprint size={17} />
          <span className="mono">{progress.fragments.length}/4</span>
        </button>
      </div>
      {detective && (
        <aside
          className="detective-index"
          aria-label="Developer detective notebook"
        >
          <button
            type="button"
            className="detective-close"
            aria-label="Close detective notebook"
            onClick={() => setDetective(false)}
          >
            <X size={17} />
          </button>
          <span className="mono">DEVELOPER DETECTIVE</span>
          <h2>Look closer.</h2>
          <p>
            Open any project blueprint to recover your first fragment. Click the
            fingerprint traces in About, the Lab, and the footer to find the
            other three.
          </p>
          <ol>
            {Object.keys(fragments).map((id) => (
              <li key={id}>
                {progress.fragments.includes(id)
                  ? fragments[id]
                  : `Follow the ${id === "blueprint" ? "project blueprints" : id === "notebook" ? "About notebook" : id === "lab" ? "Laboratory" : "footer"}.`}
              </li>
            ))}
          </ol>
          {progress.achievements.includes("button-presser") && (
            <p className="discovery-award">Professional Button Presser</p>
          )}
          {progress.fragments.length === 4 && (
            <p role="status">
              Case closed. Curiosity looks good on you.{" "}
              <a href="/#contact">Let's build something.</a>
            </p>
          )}
          <a href="/lab">Investigate the Lab</a>
        </aside>
      )}
      {terminal && (
        <Suspense
          fallback={
            <div className="terminal-opening" role="status">
              Opening terminal…{" "}
              <button type="button" onClick={() => setTerminal(false)}>
                Cancel
              </button>
            </div>
          }
        >
          <SecretTerminal onClose={() => setTerminal(false)} />
        </Suspense>
      )}
    </>
  );
}
