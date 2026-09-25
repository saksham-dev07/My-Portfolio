import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { useSound } from "../../context/SoundContext";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const INITIAL_HISTORY = [
  { type: "system", text: "SakshamOS Kernel v2.4.0 (x86_64-applied-ai)" },
  { type: "system", text: "Type 'help' to inspect available system commands." },
];

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "Why did the neural network cross the road? To minimize the loss function on the other side.",
  "Debugging: Being the detective in a crime movie where you are also the murderer.",
];

const SecretTerminal = memo(() => {
  const { playSecret, playClick } = useSound();
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [konamiProgress, setKonamiProgress] = useState(0);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Global Key Listener for Konami Code and `~`
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle with backtick ` or ~
      if (e.key === "`" || e.key === "~") {
        if (!["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
          e.preventDefault();
          setIsOpen((prev) => {
            const next = !prev;
            if (next) playSecret();
            return next;
          });
          return;
        }
      }

      // Check Konami Code
      if (e.key.toLowerCase() === KONAMI_CODE[konamiProgress]?.toLowerCase()) {
        const nextProgress = konamiProgress + 1;
        if (nextProgress === KONAMI_CODE.length) {
          setIsOpen(true);
          playSecret();
          setKonamiProgress(0);
          setHistory((prev) => [
            ...prev,
            {
              type: "success",
              text: "[UNLOCKED] Konami sequence verified. Welcome to the Secret Matrix Terminal.",
            },
          ]);
        } else {
          setKonamiProgress(nextProgress);
        }
      } else {
        setKonamiProgress(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [konamiProgress, playSecret]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, history]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    playClick();
    const newEntry = {
      type: "input",
      text: `guest@saksham-portfolio:~$ ${cmd}`,
    };
    const lower = cmd.toLowerCase();

    let response = [];

    switch (lower) {
      case "help":
        response = [
          { type: "output", text: "Available commands:" },
          { type: "output", text: "  help          - View this manual" },
          {
            type: "output",
            text: "  skills        - List primary engineering arsenal",
          },
          {
            type: "output",
            text: "  projects      - List flagship case studies",
          },
          {
            type: "output",
            text: "  sudo hire     - Process direct recruitment authorization",
          },
          {
            type: "output",
            text: "  joke          - Receive a developer joke",
          },
          { type: "output", text: "  clear         - Flush terminal buffer" },
          {
            type: "output",
            text: "  exit          - Terminate session and return to UI",
          },
        ];
        break;

      case "skills":
        response = [
          {
            type: "output",
            text: "Core Stack: Python, TypeScript, React 19, FastAPI, PyTorch, Docker",
          },
          {
            type: "output",
            text: "Applied AI: Grad-CAM Neural Forensics, LLM AST Compilers, OpenCV",
          },
          {
            type: "output",
            text: "Infrastructure: AWS, Redis, PostgreSQL, WebSockets, Linux Systems",
          },
        ];
        break;

      case "projects":
        response = [
          {
            type: "output",
            text: "[01] Deepfake Detection — Grad-CAM Forensics & MesoNet (94.2% Acc)",
          },
          {
            type: "output",
            text: "[02] NL to Web App — Deterministic LLM Compiler (Zero Hallucination)",
          },
          {
            type: "output",
            text: "[03] DocPilot — Clinical AI Workflow with 82% Summary Compression",
          },
          {
            type: "output",
            text: "[04] NexusBoard — Collaborative CRDT Whiteboard (< 20ms Sync)",
          },
        ];
        break;

      case "sudo hire":
      case "sudo hire saksham":
        response = [
          {
            type: "success",
            text: "═════════════════════════════════════════════════",
          },
          {
            type: "success",
            text: " [ACCESS GRANTED] OFFER VERIFIED & CONFIRMED [OK]",
          },
          {
            type: "success",
            text: " Candidate: Saksham Agarwal (B.Tech CSE '27)     ",
          },
          {
            type: "success",
            text: " Delivering confirmation email to sakmmm07@gmail.com",
          },
          {
            type: "success",
            text: "═════════════════════════════════════════════════",
          },
        ];
        break;

      case "joke":
        response = [
          {
            type: "output",
            text: JOKES[Math.floor(Math.random() * JOKES.length)],
          },
        ];
        break;

      case "clear":
        setHistory([]);
        setInputVal("");
        return;

      case "exit":
        setIsOpen(false);
        setInputVal("");
        return;

      default:
        response = [
          {
            type: "error",
            text: `Command not found: '${cmd}'. Type 'help' for instructions.`,
          },
        ];
    }

    setHistory((prev) => [...prev, newEntry, ...response]);
    setInputVal("");
  };

  return (
    <>
      {/* Hidden/Discreet Terminal Launcher trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          playSecret();
        }}
        className="hidden md:flex fixed bottom-5 left-5 z-40 w-10 h-10 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400 items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg group"
        title="Open Secret Hacker Terminal (or press `~`)"
        aria-label="Open Secret Terminal"
      >
        <TerminalIcon
          size={16}
          className="group-hover:scale-110 transition-transform"
        />
      </button>

      {/* Terminal Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="secret-terminal-modal relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden font-mono flex flex-col h-[480px] max-h-[85vh]"
            >
              {/* Terminal Titlebar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-zinc-900/90 border-b border-white/10 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shrink-0" />
                  <span className="ml-1 sm:ml-2 text-xs text-zinc-300 font-semibold flex items-center gap-1.5 truncate">
                    <TerminalIcon
                      size={13}
                      className="text-emerald-400 shrink-0"
                    />
                    <span className="hidden xs:inline">
                      bash - saksham-os v2.4 (secret mode)
                    </span>
                    <span className="xs:hidden">saksham-os</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">
                    Press `~` or type 'exit'
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded hover:bg-white/5"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Terminal Output Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-1.5 text-xs text-emerald-400/90 scrollbar-thin scrollbar-thumb-zinc-800">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      h.type === "input"
                        ? "text-zinc-200 font-semibold"
                        : h.type === "error"
                          ? "text-rose-400"
                          : h.type === "success"
                            ? "text-cyan-300 font-bold"
                            : "text-emerald-400"
                    }`}
                  >
                    {h.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Terminal Input Row */}
              <form
                onSubmit={handleCommand}
                className="flex items-center gap-2 p-3 bg-zinc-900/70 border-t border-white/10"
              >
                <span className="text-xs text-emerald-400 font-bold select-none hidden xs:inline shrink-0">
                  guest@portfolio:~$
                </span>
                <span className="text-xs text-emerald-400 font-bold select-none xs:hidden shrink-0">
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="type 'help', 'skills', 'sudo hire'..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white font-mono placeholder:text-zinc-600"
                  autoFocus
                />
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

SecretTerminal.displayName = "SecretTerminal";
export default SecretTerminal;
