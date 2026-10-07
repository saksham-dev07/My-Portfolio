import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { useRef, useState } from "react";
import { projects } from "../constants";
import { useRole } from "../context/RoleContext";
import { motionAllowed, transitionView } from "../utils/studioMotion";
import ProjectCaseStudy from "./ProjectCaseStudy";
import ProjectIndex, { projectTitle } from "./ProjectIndex";
import ProjectPreview from "./ProjectPreview";
import SectionHeading from "./SectionHeading";

const filters = [
  { id: "all", label: "All work" },
  { id: "ai", label: "Applied AI" },
  { id: "fullstack", label: "Full-stack" },
  { id: "backend", label: "Backend & tools" },
];
const notes = {
  "deepfake-forensics": {
    title: "Making AI decisions inspectable.",
    description:
      "A multi-modal forensics engine combining visual and audio signals with explainability maps and PDF evidence reports.",
    points: [
      "Combines EfficientNet-B4 visual analysis with SyncNet audio-visual alignment.",
      "Uses Grad-CAM and SHAP to surface evidence behind predictions.",
      "Connects a PyTorch inference pipeline to FastAPI and a React interface.",
    ],
  },
  "nl-app-compiler": {
    title: "From a prompt to a structured application.",
    description:
      "A four-stage LLM pipeline that turns natural-language requirements into application structure, database schemas, and generated components.",
    points: [
      "Separates intent parsing, design generation, schema synthesis, and refinement.",
      "Treats generation as a staged compiler workflow.",
      "Applies syntax verification and cross-layer checks to generated output.",
    ],
  },
  docpilot: {
    title: "Less paperwork. More room for care.",
    description:
      "A team-built healthcare platform with role-based access, real-time updates, and an AI consultation scribe.",
    points: [
      "Uses role-based access and Firebase authentication for clinical workflows.",
      "Uses Gemini to generate structured consultation notes.",
      "Uses Firestore for real-time clinical data and Appwrite for large-file storage.",
    ],
  },
  nexusboard: {
    title: "A shared space for thinking together.",
    description:
      "An infinite whiteboard with freehand drawing and live collaboration, built with React, the Canvas API, and WebSockets.",
    points: [
      "Captures freehand strokes with the HTML5 Canvas API.",
      "Synchronizes canvas updates through Socket.IO and a Node.js server.",
      "Uses a double-buffered drawing pipeline for collaborative whiteboarding.",
    ],
  },
};
export default function Projects() {
  const [selected, setSelected] = useState(null);
  const openerRef = useRef(null);
  const { activeRole, setActiveRole } = useRole();
  const featured = projects.filter((project) =>
    activeRole === "backend"
      ? project.category === "backend" &&
        ["lastmile", "scrapeverse"].includes(project.id)
      : project.featured &&
        (activeRole === "all" || project.category === activeRole),
  );
  return (
    <section
      id="projects"
      className="shell section-block"
      aria-labelledby="work-title"
    >
      <SectionHeading
        number="01"
        label="Selected work"
        title={
          <span id="work-title">
            Built with purpose.
            <br />
            <em>Made to be explored.</em>
          </span>
        }
        description="A selection of applications at the intersection of software, intelligence, and useful human experiences."
      >
        <a
          className="text-link"
          href="https://github.com/saksham-dev07"
          target="_blank"
          rel="noreferrer"
        >
          All repositories <ArrowUpRight size={17} />
        </a>
      </SectionHeading>
      <div className="work-toolbar">
        <div
          className="filter-group"
          aria-label="Filter projects by discipline"
        >
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeRole === id}
              onClick={() => {
                if (
                  id !== activeRole ||
                  document.documentElement.dataset.transition === "work"
                )
                  transitionView(() => setActiveRole(id));
              }}
            >
              {label}
              <span>
                {
                  projects.filter((p) =>
                    id === "all"
                      ? p.featured
                      : id === "backend"
                        ? p.category === id &&
                          ["lastmile", "scrapeverse"].includes(p.id)
                        : p.featured && p.category === id,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <span className="mono results-count" role="status">
          {featured.length} selected projects
        </span>
      </div>
      <ProjectIndex projects={featured} />
      <div className="project-grid">
        {featured.map((project, index) => (
          <article
            key={project.id}
            className="project-card"
            id={`build-${project.id}`}
            tabIndex={-1}
            style={{ "--project-order": index }}
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse" || !motionAllowed()) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left,
                y = event.clientY - rect.top;
              event.currentTarget.style.setProperty(
                "--tilt-x",
                `${(x / rect.width - 0.5) * 3}deg`,
              );
              event.currentTarget.style.setProperty(
                "--tilt-y",
                `${-(y / rect.height - 0.5) * 3}deg`,
              );
              event.currentTarget.style.setProperty("--spot-x", `${x}px`);
              event.currentTarget.style.setProperty("--spot-y", `${y}px`);
            }}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty("--tilt-x", "0deg");
              event.currentTarget.style.setProperty("--tilt-y", "0deg");
            }}
            aria-labelledby={`project-${project.id}`}
            data-project-id={project.id}
          >
            <ProjectPreview project={project} />
            <div className="project-copy">
              <div className="project-meta">
                <span className="mono">
                  0{index + 1} / {project.role}
                </span>
                <span className="mono">{project.period}</span>
              </div>
              <h3 id={`project-${project.id}`}>{projectTitle(project.name)}</h3>
              <p>{notes[project.id]?.description || project.description}</p>
              <div className="tag-list">
                {project.tags.map((tag) => (
                  <span key={tag.name}>{tag.name}</span>
                ))}
              </div>
              <button
                type="button"
                className="project-open-story"
                aria-label={`Read the story behind ${project.name}`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setSelected(project);
                }}
              >
                <span>
                  Inside the build <ArrowRight size={16} />
                </span>
                <span className="project-chapter-number">OPEN CHAPTER</span>
              </button>
              <div className="project-links">
                <a
                  className="text-link"
                  href={project.source_code_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={15} />
                  Source code <ArrowUpRight size={15} />
                </a>
                {project.live_demo && (
                  <a
                    className="text-link accent-link"
                    href={project.live_demo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live demo <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <ProjectCaseStudy
          project={selected}
          note={notes[selected.id]}
          onClose={() => setSelected(null)}
          opener={openerRef.current}
        />
      )}
    </section>
  );
}
