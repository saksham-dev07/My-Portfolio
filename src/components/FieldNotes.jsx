import { ArrowUpRight, Fingerprint, GitBranch, ScanEye } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { useRole } from "../context/RoleContext";
import { DiscoverFragment } from "./interactive/DiscoveryTools";

const notes = [
  {
    title: "Make the reasoning visible.",
    label: "Clarity",
    icon: ScanEye,
    body: "A prediction is more useful when you can inspect what informed it. That question runs through my work on explainable deepfake forensics.",
    project: "Deepfake Forensics",
    href: "#build-deepfake-forensics",
    annotation: "Evidence beside the answer.",
  },
  {
    title: "Make room for other people.",
    label: "Connection",
    icon: Fingerprint,
    body: "Software gets interesting when people use it together. NexusBoard explores that through a shared canvas and real-time collaboration.",
    project: "NexusBoard",
    href: "#build-nexusboard",
    annotation: "One canvas. More perspectives.",
  },
  {
    title: "Give an idea some structure.",
    label: "Curiosity",
    icon: GitBranch,
    body: "An open-ended prompt becomes more useful when it moves through deliberate stages. The NL App Compiler turns that idea into a generation workflow.",
    project: "NL App Compiler",
    href: "#build-nl-app-compiler",
    annotation: "A question becomes a system.",
  },
];
export default function FieldNotes() {
  const [selected, setSelected] = useState(0);
  const { setActiveRole } = useRole();
  const note = notes[selected];
  return (
    <div className="field-notes">
      <DiscoverFragment id="notebook" />
      <div
        className="field-notes-tabs"
        role="group"
        aria-label="Explore my field notes"
      >
        <span className="mono">FROM THE NOTEBOOK</span>
        {notes.map((item, i) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>0{i + 1}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div className="field-note-sheet" key={selected}>
        <div className="field-note-mark" aria-hidden="true">
          <note.icon size={64} strokeWidth={1} />
          <span className="mono">NOTE / 0{selected + 1}</span>
        </div>
        <div className="field-note-copy">
          <span className="mono">A PRINCIPLE IN PRACTICE</span>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
          <a
            className="text-link"
            href={note.href}
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              )
                flushSync(() => setActiveRole("all"));
            }}
          >
            See it in {note.project}
            <ArrowUpRight size={15} />
          </a>
        </div>
        <span className="field-note-scribble" aria-hidden="true">
          {note.annotation}
        </span>
      </div>
    </div>
  );
}
