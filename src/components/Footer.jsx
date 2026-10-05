import { ArrowUp, ArrowUpRight, Gamepad2 } from "lucide-react";
import { useArcade } from "../context/ArcadeContext";
export default function Footer() {
  const { openSignalRun } = useArcade();
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <a className="brand-mark" href="#home" aria-label="Back to home">
            sa<span>.</span>
          </a>
          <p>
            Thoughtful software.
            <br />
            <em>Built with curiosity.</em>
          </p>
          <a href="#home" className="back-top">
            Back to top <ArrowUp size={16} />
          </a>
        </div>
        <div className="footer-directory">
          <span className="mono">TAKE A CLOSER LOOK</span>
          <nav aria-label="Portfolio directory">
            {[
              { id: "projects", label: "Work" },
              { id: "systems-lab", label: "Approach" },
              { id: "skills", label: "Toolkit" },
              { id: "education", label: "About" },
              { id: "credentials", label: "Credentials" },
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
            <a href="/resume.pdf" target="_blank" rel="noreferrer">
              Résumé
              <ArrowUpRight size={13} />
            </a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Saksham Agarwal</span>
          <button type="button" onClick={openSignalRun}>
            <Gamepad2 size={15} />A little extra: Signal Run
            <ArrowUpRight size={14} />
          </button>
          <span className="mono">DESIGNED &amp; BUILT WITH INTENTION</span>
        </div>
      </div>
    </footer>
  );
}
