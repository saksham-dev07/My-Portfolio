import {
  ArrowDownRight,
  ArrowUpRight,
  Asterisk,
  FileText,
  Github,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deepfake, profileStudio } from "../assets";
import { motionAllowed } from "../utils/studioMotion";

const chapters = {
  projects: {
    title: "Things made real.",
    note: "APPLIED AI / FULL-STACK / TOOLS",
    description: "Explore the interfaces, then go inside the build.",
  },
  playground: {
    title: "Follow your curiosity.",
    note: "DRAW / EXPERIMENT / DISCOVER",
    description: "A small playground for ideas that like to move.",
  },
  "systems-lab": {
    title: "Look beneath the surface.",
    note: "INTENT / STRUCTURE / EXPERIENCE",
    description: "The thinking that connects a problem to a working system.",
  },
  education: {
    title: "Meet the builder.",
    note: "SAKSHAM AGARWAL / CLASS OF 2027",
    description: "Curiosity, a growing toolkit, and a reason to keep building.",
  },
  contact: {
    title: "What could we build?",
    note: "A CONVERSATION IS A GOOD START",
    description: "Internships, collaborations, or an interesting idea.",
  },
};

function ChapterVisual({ id }) {
  if (id === "projects")
    return (
      <img
        className="index-work-image"
        src={deepfake}
        alt="Deepfake Forensics project interface"
        width={1200}
        height={675}
      />
    );
  if (id === "education")
    return (
      <img
        className="index-person-image"
        src={profileStudio}
        alt="Saksham Agarwal"
        width={1024}
        height={1536}
      />
    );
  if (id === "playground")
    return (
      <svg className="index-sketch" viewBox="0 0 460 330" aria-hidden="true">
        <path
          className="index-sketch-loop"
          d="M58 215 C22 108 184 68 233 137 S358 286 394 166 S312 29 288 66 S289 199 169 258 S88 125 122 122"
        />
        <circle cx="288" cy="66" r="12" />
        <circle cx="122" cy="122" r="7" />
        <path d="M73 76 L73 45 M58 60 L89 60 M336 274 L373 243 M340 243 L371 274" />
        <rect
          x="202"
          y="80"
          width="58"
          height="58"
          rx="8"
          transform="rotate(-18 231 109)"
        />
      </svg>
    );
  if (id === "systems-lab")
    return (
      <div className="index-system" aria-hidden="true">
        <span>01 / A QUESTION</span>
        <i />
        <span>02 / A SYSTEM</span>
        <i />
        <span>03 / SOMETHING USEFUL</span>
        <div className="index-system-orbit">
          <Asterisk size={85} strokeWidth={1} />
        </div>
      </div>
    );
  return (
    <div className="index-invitation" aria-hidden="true">
      <span>
        Hello<span className="index-invitation-period">.</span>
      </span>
      <ArrowDownRight size={110} strokeWidth={1} />
      <span className="mono">YOUR NEXT IDEA STARTS HERE</span>
    </div>
  );
}

export default function StudioIndex({ links, opener, onClose }) {
  const [selected, setSelected] = useState(links[0].id);
  const dialogRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const destinationRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const chapter = chapters[selected];
  const requestClose = (destination = null) => {
    destinationRef.current = destination;
    if (closingRef.current) {
      animationRef.current?.cancel();
      closeRef.current();
      return;
    }
    const dialog = dialogRef.current;
    if (!motionAllowed() || !dialog.animate) {
      closeRef.current();
      return;
    }
    closingRef.current = true;
    const current = getComputedStyle(dialog);
    const clipPath = current.clipPath;
    const opacity = current.opacity;
    animationRef.current?.cancel();
    const animation = dialog.animate(
      [
        { clipPath, opacity },
        { clipPath: "inset(0 0 100% 0)", opacity: 0 },
      ],
      { duration: 180, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    animation.onfinish = () => closeRef.current();
    animationRef.current = animation;
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector(".index-close")?.focus();
    if (motionAllowed() && dialog.animate) {
      animationRef.current = dialog.animate(
        [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0)" }],
        { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (motionAllowed()) return;
      animationRef.current?.cancel();
      if (closingRef.current) closeRef.current();
    };
    reduced.addEventListener("change", settle);
    window.addEventListener("portfolio-motion-change", settle);
    return () => {
      if (animationRef.current) animationRef.current.onfinish = null;
      animationRef.current?.cancel();
      reduced.removeEventListener("change", settle);
      window.removeEventListener("portfolio-motion-change", settle);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const destination = destinationRef.current;
      const section = destination && document.getElementById(destination);
      if (section) {
        const focusTarget = section.querySelector("h1, h2") || section;
        focusTarget.setAttribute("tabindex", "-1");
        focusTarget.setAttribute("data-index-destination", "true");
        focusTarget.focus({ preventScroll: true });
        if (window.location.hash !== `#${destination}`)
          window.history.pushState(null, "", `#${destination}`);
        section.scrollIntoView({
          behavior: motionAllowed() ? "smooth" : "instant",
          block: "start",
        });
      } else opener?.focus({ preventScroll: true });
    };
  }, [opener]);
  return (
    <dialog
      id="studio-index"
      className="studio-index-dialog"
      ref={dialogRef}
      aria-labelledby="index-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll(
          "a[href], button:not([disabled])",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div className="shell index-shell">
        <header className="index-header">
          <span className="index-identity">
            sa<span>.</span>
            <span className="mono">THE DIGITAL STUDIO</span>
          </span>
          <button
            className="index-close"
            type="button"
            onClick={() => requestClose()}
            aria-label="Close studio index"
          >
            Close <X size={20} />
          </button>
        </header>
        <div className="index-intro">
          <h2 id="index-title" className="eyebrow">
            Find your way around.
          </h2>
          <span className="mono">FIVE CHAPTERS / ONE CURIOUS MIND</span>
        </div>
        <div className="index-layout">
          <nav aria-label="Studio chapters" className="index-chapters">
            {links.map(({ id, label, description }, index) => (
              <a
                key={id}
                href={`#${id}`}
                className="index-chapter"
                data-preview={selected === id}
                style={{ "--index-order": index }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setSelected(id);
                }}
                onFocus={() => setSelected(id)}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  )
                    return;
                  event.preventDefault();
                  requestClose(id);
                }}
              >
                <span className="mono index-chapter-number">0{index + 1}</span>
                <span className="index-chapter-copy">
                  <span>{label}</span>
                  <span>{description}</span>
                </span>
                <ArrowUpRight
                  className="index-chapter-arrow"
                  size={38}
                  strokeWidth={1.2}
                />
              </a>
            ))}
          </nav>
          <aside className="index-preview" aria-label="Chapter preview">
            <div className="index-preview-art" data-chapter={selected}>
              <span className="mono index-preview-label">
                0{links.findIndex((link) => link.id === selected) + 1} /{" "}
                {links.find((link) => link.id === selected).label.toUpperCase()}
              </span>
              <div className="index-preview-visual" key={selected}>
                <ChapterVisual id={selected} />
              </div>
              <span className="index-preview-star" aria-hidden="true">
                <Asterisk size={42} strokeWidth={1} />
              </span>
            </div>
            <div className="index-preview-caption" key={`${selected}-caption`}>
              <span className="mono">{chapter.note}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.description}</p>
            </div>
          </aside>
        </div>
        <footer className="index-footer">
          <span className="mono">OPEN TO INTERNSHIPS & COLLABORATIONS</span>
          <div>
            <a href="/resume.pdf" target="_blank" rel="noreferrer">
              <FileText size={15} />
              Résumé <ArrowUpRight size={14} />
            </a>
            <a
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={15} />
              GitHub <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
