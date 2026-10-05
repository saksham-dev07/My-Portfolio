import { ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";

const disciplines = {
  ai: "APPLIED AI",
  fullstack: "FULL-STACK",
  backend: "BACKEND & TOOLS",
};
export function projectTitle(name) {
  return name
    .replace(" (Generative AI)", "")
    .replace(" – Clinical Management Platform", "")
    .replace(" – Collaborative Canvas", "");
}
export default function ProjectIndex({ projects }) {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    // Client-rendered chapter targets may appear after native fragment lookup.
    const initialHash = window.location.hash;
    const frame = requestAnimationFrame(() => {
      if (
        !initialHash.startsWith("#build-") ||
        window.location.hash !== initialHash
      )
        return;
      const chapter = document.getElementById(initialHash.slice(1));
      if (!chapter) return;
      chapter.focus({ preventScroll: true });
      chapter.scrollIntoView({ behavior: "instant", block: "start" });
    });
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return (
    <nav className="project-index" aria-label="Selected project chapters">
      <div className="project-index-heading">
        <span className="mono">THE CONTACT SHEET</span>
        <p>
          Choose a chapter.
          <ArrowDownRight size={16} />
        </p>
      </div>
      <div
        className="project-index-grid"
        style={{ "--index-columns": Math.min(projects.length, 4) }}
      >
        {projects.map((project, index) => (
          <a
            key={project.id}
            href={`#build-${project.id}`}
            className="project-index-link"
            aria-label={`Jump to ${projectTitle(project.name)}`}
            aria-current={
              hash === `#build-${project.id}` ? "location" : undefined
            }
          >
            <div className={`project-index-cover preview-${project.category}`}>
              <img
                src={project.image}
                alt=""
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
              />
              <span className="project-index-number mono">0{index + 1}</span>
              <span className="project-index-arrow">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <div className="project-index-caption">
              <span className="mono">{disciplines[project.category]}</span>
              <span>{projectTitle(project.name)}</span>
            </div>
          </a>
        ))}
      </div>
    </nav>
  );
}
