import { Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projects, technologies } from "../../constants";
import { saveExeReturn } from "../../utils/exeProgress";
import { motionAllowed } from "../../utils/studioMotion";
import { terminalCommand } from "../../utils/terminalCommands";

export default function SecretTerminal({ onClose }) {
  const dialog = useRef(null);
  const output = useRef(null);
  const input = useRef(null);
  const timers = useRef([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState([
    "SAKSHAM / DEVELOPER INTERFACE\nType help. This terminal only knows portfolio commands.",
  ]);
  const [effect, setEffect] = useState(null);
  const [previous, setPrevious] = useState([]);
  const cursor = useRef(-1);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    input.current?.focus();
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
      element.close();
      delete document.documentElement.dataset.terminalEffect;
      requestAnimationFrame(() => {
        if (opener?.isConnected && !document.querySelector("dialog[open]"))
          opener.focus();
      });
    };
  }, []);
  useEffect(() => {
    if (!history.length) {
      if (output.current) output.current.scrollTop = 0;
      return;
    }
    if (output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [history]);
  useEffect(() => {
    const stop = () => {
      if (!motionAllowed()) {
        setEffect(null);
        delete document.documentElement.dataset.terminalEffect;
      }
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", stop);
    window.addEventListener("portfolio-motion-change", stop);
    return () => {
      reduced.removeEventListener("change", stop);
      window.removeEventListener("portfolio-motion-change", stop);
    };
  }, []);
  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    const command = value.slice(0, 240);
    const result = terminalCommand(command, { projects, skills: technologies });
    setValue("");
    input.current?.focus();
    setPrevious((items) => [command, ...items].slice(0, 30));
    cursor.current = -1;
    if (result.action === "exit") {
      onClose();
      return;
    }
    if (result.action === "clear") {
      setHistory([]);
      return;
    }
    setHistory((items) => [...items, `> ${command}`, result.text].slice(-120));
    if (result.action?.startsWith("/")) {
      if (result.action === "/resume.pdf")
        window.open(result.action, "_blank", "noopener,noreferrer");
      else
        timers.current.push(
          setTimeout(
            () => {
              if (result.action.startsWith("/world"))
                saveExeReturn("developer-terminal-launcher");
              onClose();
              window.location.assign(result.action);
            },
            command.toLowerCase() === "sudo hire saksham" ? 850 : 250,
          ),
        );
    }
    if (["matrix", "glitch"].includes(result.action)) {
      setEffect(motionAllowed() ? result.action : null);
      document.documentElement.dataset.terminalEffect = motionAllowed()
        ? result.action
        : "";
      timers.current.push(
        setTimeout(() => {
          setEffect(null);
          delete document.documentElement.dataset.terminalEffect;
        }, 1600),
      );
    }
  };
  return (
    <dialog
      ref={dialog}
      className="developer-terminal"
      aria-labelledby="terminal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="terminal-titlebar">
        <h2 id="terminal-title">
          <Terminal size={16} /> SAKSHAM / TERMINAL
        </h2>
        <button
          type="button"
          aria-label="Close developer terminal"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="terminal-output"
        ref={output}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {history.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      {effect === "matrix" && (
        <div className="terminal-rain" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} style={{ "--rain-delay": `${i * -0.17}s` }}>
              01
              <br />
              10
              <br />
              01
              <br />
              11
              <br />
              00
              <br />
              10
              <br />
              01
            </span>
          ))}
        </div>
      )}
      <div
        className="terminal-suggestions"
        role="group"
        aria-label="Try a portfolio command"
      >
        {["world", "world deepfake-forensics", "surprise", "skills"].map(
          (command) => (
            <button
              type="button"
              key={command}
              onClick={() => {
                setValue(command);
                input.current?.focus();
              }}
            >
              {command}
            </button>
          ),
        )}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="developer-command">&gt;</label>
        <input
          id="developer-command"
          aria-label="Terminal command"
          ref={input}
          value={value}
          maxLength={240}
          autoComplete="off"
          spellCheck={false}
          placeholder="help"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (
              !["ArrowUp", "ArrowDown"].includes(event.key) ||
              !previous.length
            )
              return;
            event.preventDefault();
            cursor.current = Math.max(
              -1,
              Math.min(
                previous.length - 1,
                cursor.current + (event.key === "ArrowUp" ? 1 : -1),
              ),
            );
            setValue(previous[cursor.current] || "");
          }}
        />
        <button type="submit">Run</button>
      </form>
      <p className="terminal-hint">
        Ctrl + ` toggles · Esc closes · Arrow keys recall commands
      </p>
    </dialog>
  );
}
