import {
  ArrowUpRight,
  Fingerprint,
  GitBranch,
  GraduationCap,
  ScanEye,
} from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { education, projects } from "../constants";
import { useRole } from "../context/RoleContext";
import { transitionView } from "../utils/studioMotion";
import { DiscoverFragment } from "./interactive/DiscoveryTools";
import ResponsiveImage from "./ResponsiveImage";

const notes = [
  {
    title: "A place to start. Room to explore.",
    label: "The foundation",
    date: "2023",
    icon: GraduationCap,
    body: "Computer Science at VIT Bhopal is the foundation. The projects that follow show where my curiosity takes it: shared interfaces, generative workflows, and explainable AI.",
    project: "My résumé",
    href: "/resume.pdf",
    image: education[0].profilePic,
    alt: "VIT Bhopal University",
    annotation: "Class of 2027. Still building.",
  },
  {
    title: "Make room for other people.",
    label: "Connection",
    id: "nexusboard",
    icon: Fingerprint,
    body: "Software gets interesting when people use it together. NexusBoard explores that through a shared canvas and real-time collaboration.",
    project: "NexusBoard",
    href: "#build-nexusboard",
    annotation: "One canvas. More perspectives.",
  },
  {
    title: "Give an idea some structure.",
    label: "Curiosity",
    id: "nl-app-compiler",
    icon: GitBranch,
    body: "An open-ended prompt becomes more useful when it moves through deliberate stages. The NL App Compiler turns that idea into a generation workflow.",
    project: "NL App Compiler",
    href: "#build-nl-app-compiler",
    annotation: "A question becomes a system.",
  },
  {
    title: "Make the reasoning visible.",
    label: "Clarity",
    id: "deepfake-forensics",
    icon: ScanEye,
    body: "A prediction is more useful when you can inspect what informed it. That question runs through my work on explainable deepfake forensics.",
    project: "Deepfake Forensics",
    href: "#build-deepfake-forensics",
    annotation: "Evidence beside the answer.",
  },
].map((note) => {
  const project = projects.find((item) => item.id === note.id);
  return {
    ...note,
    date: note.date || project.period,
    image: note.image || project.image,
    alt: note.alt || `${note.project} interface preview`,
  };
});
export default function FieldNotes() {
  const [selected, setSelected] = useState(0);
  const { setActiveRole } = useRole();
  const note = notes[selected];
  return (
    <div className="field-notes personal-journey" id="personal-journey">
      <DiscoverFragment id="notebook" />
      <div
        className="field-notes-tabs"
        role="group"
        aria-label="Explore my building journey"
      >
        <span className="mono">FROM THE NOTEBOOK / THE ROAD SO FAR</span>
        {notes.map((item, i) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={selected === i}
            aria-controls="journey-artifact"
            onClick={() => {
              if (selected !== i) transitionView(() => setSelected(i));
            }}
          >
            <time>{item.date}</time>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="field-note-sheet" id="journey-artifact" key={selected}>
        <figure className="journey-artifact">
          <ResponsiveImage
            src={note.image}
            alt={note.alt}
            sizes="(max-width: 650px) 85vw, 440px"
            loading="lazy"
          />
          <figcaption>
            <note.icon size={16} aria-hidden="true" />
            <span className="mono">
              {note.date} / {note.project}
            </span>
          </figcaption>
        </figure>
        <div className="field-note-copy">
          <span className="mono">
            0{selected + 1} / A PRINCIPLE IN PRACTICE
          </span>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
          <a
            className="text-link"
            href={note.href}
            target={note.id ? undefined : "_blank"}
            rel={note.id ? undefined : "noreferrer"}
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
            {note.id
              ? `See it in ${note.project}`
              : "See the foundation in my résumé"}
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
