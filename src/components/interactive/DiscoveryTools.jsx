import { Fingerprint, Terminal, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
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
  useEffect(() => {
    const update = () => setProgress({ ...readDiscovery() });
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
      window.removeEventListener("keydown", shortcut);
      window.removeEventListener("portfolio-discovery", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <>
      <div className="discovery-launchers">
        <button
          type="button"
          aria-label="Open developer terminal"
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
