import { ArrowUp, ArrowUpRight, Gamepad2 } from "lucide-react";
import ExeEntry from "./ExeEntry";
import { DiscoverFragment } from "./interactive/DiscoveryTools";
export default function Footer({ onEnterExe }) {
  return (
    <footer className="site-footer" id="footer">
      <div className="shell">
        <ExeEntry onEnter={onEnterExe} />
        <DiscoverFragment id="footer" />
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
            <a href="/lab">
              The Laboratory <ArrowUpRight size={13} />
            </a>
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
          <a href="#playground">
            <Gamepad2 size={15} />
            Make something unexpected
            <ArrowUpRight size={14} />
          </a>
          <span className="mono">DESIGNED &amp; BUILT WITH INTENTION</span>
        </div>
      </div>
    </footer>
  );
}
