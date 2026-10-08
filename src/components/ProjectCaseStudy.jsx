import { ArrowUpRight, Github, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { motionAllowed } from "../utils/studioMotion";
import ResponsiveImage from "./ResponsiveImage";

export default function ProjectCaseStudy({ project, note, onClose, opener }) {
  const dialogRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const closeRef = useRef(onClose);
  const returnTransform = useRef("translateY(18px) scale(.94)");
  closeRef.current = onClose;
  const requestClose = () => {
    if (closingRef.current) return;
    const dialog = dialogRef.current;
    if (!motionAllowed() || !dialog.animate) {
      closeRef.current();
      return;
    }
    closingRef.current = true;
    dialog.dataset.closing = "true";
    animationRef.current?.cancel();
    const animation = dialog.animate(
      [
        { opacity: 1, transform: "translate(0,0) scale(1)" },
        { opacity: 0, transform: returnTransform.current },
      ],
      { duration: 200, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    animation.onfinish = () => closeRef.current();
    animationRef.current = animation;
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    const source = opener
      ?.closest(".project-card")
      ?.querySelector(".preview-image")
      ?.getBoundingClientRect();
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    if (motionAllowed() && dialog.animate) {
      const bounds = dialog.getBoundingClientRect();
      const x = source
        ? source.left + source.width / 2 - (bounds.left + bounds.width / 2)
        : 0;
      const y = source
        ? source.top + source.height / 2 - (bounds.top + bounds.height / 2)
        : 24;
      const scale = source
        ? Math.max(0.7, Math.min(0.88, source.width / bounds.width))
        : 0.94;
      returnTransform.current = `translate(${x * 0.25}px,${y * 0.25}px) scale(.88)`;
      animationRef.current = dialog.animate(
        [
          {
            opacity: 0,
            transform: `translate(${x}px,${y}px) scale(${scale})`,
          },
          { opacity: 1, transform: "translate(0,0) scale(1)" },
        ],
        { duration: 440, easing: "cubic-bezier(.22,1,.36,1)" },
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
      opener?.focus({ preventScroll: true });
    };
  }, [opener]);
  return (
    <dialog
      className="case-dialog"
      ref={dialogRef}
      aria-labelledby="case-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          requestClose();
      }}
    >
      <div className="case-dialog-header">
        <span className="mono">BUILD NOTES / {project.role}</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Close project story"
          onClick={requestClose}
        >
          <X size={18} />
        </button>
      </div>
      <ResponsiveImage
        sizes="(max-width: 800px) 90vw, 850px"
        loading="eager"
        className="case-dialog-image"
        src={project.image}
        alt={`Interface of ${project.name}`}
        width={1200}
        height={675}
      />
      <div className="case-dialog-content">
        <h2 id="case-title">{project.name}</h2>
        <p>{note?.description || project.description}</p>
        <div className="tag-list">
          {project.tags.map((tag) => (
            <span key={tag.name}>{tag.name}</span>
          ))}
        </div>
        {project.metrics && (
          <dl className="case-metrics">
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.id === "deepfake-forensics" && (
          <p className="case-benchmark-note">
            Dataset-specific reported results. Generalization to unseen datasets
            remains a limitation; these figures do not describe all real-world
            inputs.
          </p>
        )}
        {note && (
          <div className="case-notes">
            <h3>{note.title}</h3>
            <ul>
              {note.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="case-dialog-links">
          <a
            className="button button-secondary"
            href={project.source_code_link}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} />
            Explore the source <ArrowUpRight size={15} />
          </a>
          {project.live_demo && (
            <a
              className="button button-primary"
              href={project.live_demo}
              target="_blank"
              rel="noreferrer"
            >
              Open live project <ArrowUpRight size={15} />
            </a>
          )}
        </div>
        <span className="case-disclaimer">
          Project details are based on my résumé and repository documentation.
          Architecture notes explain the build; they are not live system
          telemetry.
        </span>
      </div>
    </dialog>
  );
}
