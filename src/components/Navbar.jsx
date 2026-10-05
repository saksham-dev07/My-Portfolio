import { ArrowUpRight, Grid2X2, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useThemeMood } from "../context/ThemeMoodContext";
import { transitionView } from "../utils/studioMotion";
import StudioIndex from "./StudioIndex";

const links = [
  {
    id: "projects",
    label: "Work",
    description: "Selected builds & the thinking behind them",
  },
  {
    id: "playground",
    label: "Play",
    description: "Small experiments. Room for discovery.",
  },
  {
    id: "systems-lab",
    label: "Approach",
    description: "From a problem to a working system",
  },
  {
    id: "education",
    label: "About",
    description: "The person, the path, the curiosity",
  },
  {
    id: "contact",
    label: "Contact",
    description: "An interesting idea starts with hello",
  },
];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const toggleRef = useRef(null);
  const { mood, toggleLightDark } = useThemeMood();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    );
    for (const link of [{ id: "home" }, ...links]) {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <a
            href="#home"
            className="brand"
            aria-label="Saksham Agarwal, home"
            onClick={() => setOpen(false)}
          >
            <span className="brand-mark">
              sa<span>.</span>
            </span>
            <span className="brand-name">
              Saksham Agarwal<span>Software &amp; applied AI</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="icon-button theme-toggle"
              aria-label={`Switch to ${mood === "light" ? "dark" : "light"} theme`}
              onClick={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                transitionView(toggleLightDark, {
                  kind: "theme",
                  origin: {
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height / 2,
                  },
                });
              }}
            >
              {mood === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <a href="#contact" className="header-cta">
              Let’s talk <ArrowUpRight size={16} />
            </a>
            <button
              type="button"
              className="studio-index-toggle"
              ref={toggleRef}
              aria-expanded={open}
              aria-controls="studio-index"
              aria-haspopup="dialog"
              aria-label="Open studio index"
              onClick={() => setOpen(!open)}
            >
              <Grid2X2 size={15} />
              <span>Index</span>
            </button>
          </div>
        </div>
        {open && (
          <StudioIndex
            links={links}
            opener={toggleRef.current}
            onClose={() => setOpen(false)}
          />
        )}
      </header>
      <nav className="chapter-compass" aria-label="Chapter compass">
        {[{ id: "home", label: "Home" }, ...links].map(
          ({ id, label }, index) => (
            <a
              key={id}
              href={`#${id}`}
              aria-label={`Go to ${label} chapter`}
              aria-current={active === id ? "location" : undefined}
            >
              <span className="compass-dot" aria-hidden="true" />
              <span className="compass-caption" aria-hidden="true">
                <span className="mono">0{index}</span>
                {label}
              </span>
            </a>
          ),
        )}
      </nav>
    </>
  );
}
