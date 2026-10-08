import { ArrowUpRight, ChevronDown, Github, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { projects } from "../constants";
import { useRole } from "../context/RoleContext";
import { motionAllowed } from "../utils/studioMotion";
import ResponsiveImage from "./ResponsiveImage";
export default function SmallerBuilds() {
  const { activeRole } = useRole();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const previewPosition = useRef({ x: 0, y: 0 });
  const previewFrame = useRef(0);
  const previewRow = useRef(null);
  const keyboardPreview = useRef(false);
  const hidePreview = useCallback(() => {
    previewRow.current = null;
    keyboardPreview.current = false;
    setPreview(null);
  }, []);
  const placePreview = useCallback((x, y) => {
    previewPosition.current = {
      x: Math.max(16, Math.min(x + 26, window.innerWidth - 326)),
      y: Math.max(96, Math.min(y - 110, window.innerHeight - 236)),
    };
    if (previewFrame.current) return;
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = 0;
      const position = previewPosition.current;
      previewRef.current?.style.setProperty("--preview-x", `${position.x}px`);
      previewRef.current?.style.setProperty("--preview-y", `${position.y}px`);
    });
  }, []);
  const revealPreview = (project, event, keyboard = false) => {
    if (
      !motionAllowed() ||
      !window.matchMedia("(pointer: fine) and (min-width: 900px)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    previewRow.current = event.currentTarget;
    keyboardPreview.current = keyboard;
    placePreview(
      event.clientX ?? bounds.right - 360,
      event.clientY ?? bounds.top + bounds.height / 2,
    );
    setPreview(project);
  };
  useEffect(() => {
    const onScroll = () => {
      const row = previewRow.current;
      if (
        keyboardPreview.current &&
        row === document.activeElement &&
        motionAllowed()
      ) {
        const bounds = row.getBoundingClientRect();
        placePreview(bounds.right - 360, bounds.top + bounds.height / 2);
      } else hidePreview();
    };
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("portfolio-motion-change", hidePreview);
    query.addEventListener("change", hidePreview);
    return () => {
      cancelAnimationFrame(previewFrame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("portfolio-motion-change", hidePreview);
      query.removeEventListener("change", hidePreview);
    };
  }, [hidePreview, placePreview]);
  const matches = projects.filter(
    (p) =>
      !p.featured &&
      !(
        activeRole === "backend" && ["lastmile", "scrapeverse"].includes(p.id)
      ) &&
      (activeRole === "all" || p.category === activeRole) &&
      `${p.name} ${p.description} ${p.tags.map((t) => t.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const visible = expanded || query ? matches : matches.slice(0, 4);
  return (
    <section
      id="smaller-builds"
      className="shell archive-section"
      aria-labelledby="archive-title"
    >
      <div className="archive-header">
        <div>
          <p className="eyebrow">The ongoing collection</p>
          <h2 id="archive-title">
            More things I’ve built
            <span className="count-badge">{matches.length}</span>
          </h2>
        </div>
        <div className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search additional projects"
            placeholder="Search projects or technologies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="sr-only" role="status">
        {matches.length} additional projects found
      </div>
      <ul className="build-list">
        {visible.map((project, index) => (
          <li key={project.id}>
            <a
              href={project.live_demo || project.source_code_link}
              target="_blank"
              rel="noreferrer"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse")
                  revealPreview(
                    project,
                    event,
                    event.currentTarget === document.activeElement,
                  );
              }}
              onPointerMove={(event) => {
                if (preview && event.pointerType === "mouse")
                  placePreview(event.clientX, event.clientY);
              }}
              onPointerLeave={(event) => {
                if (
                  !keyboardPreview.current ||
                  event.currentTarget !== document.activeElement
                )
                  hidePreview();
              }}
              onFocus={(event) => revealPreview(project, event, true)}
              onBlur={hidePreview}
              onKeyDown={(event) => {
                if (event.key === "Escape") hidePreview();
              }}
            >
              <span className="build-index mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="build-name">
                <h3>{project.name}</h3>
                <p>{project.role}</p>
              </div>
              <div className="tag-list">
                {project.tags.slice(0, 2).map((t) => (
                  <span key={t.name}>{t.name}</span>
                ))}
              </div>
              <span className="build-destination">
                {project.live_demo ? (
                  "Explore"
                ) : (
                  <>
                    <Github size={14} /> Code
                  </>
                )}
                <ArrowUpRight size={18} />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <div
        className="archive-image-preview"
        ref={previewRef}
        data-visible={Boolean(preview)}
        aria-hidden="true"
      >
        {preview && (
          <div className="archive-preview-content" key={preview.id}>
            <ResponsiveImage
              sizes="360px"
              loading="eager"
              src={preview.image}
              alt=""
              width={1200}
              height={675}
            />
            <div>
              <span className="mono">A CLOSER LOOK</span>
              <span>{preview.name}</span>
              <ArrowUpRight size={17} />
            </div>
          </div>
        )}
      </div>
      {matches.length === 0 && (
        <div className="empty-state">
          <Search size={24} />
          <p>No projects match this search.</p>
          <button
            type="button"
            className="text-link"
            onClick={() => setQuery("")}
          >
            Clear the search
          </button>
        </div>
      )}
      {!query && matches.length > 4 && (
        <button
          type="button"
          className="archive-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show less"
            : `Explore all ${matches.length} additional builds`}
          <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
        </button>
      )}
    </section>
  );
}
