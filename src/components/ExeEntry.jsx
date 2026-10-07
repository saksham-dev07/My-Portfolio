import { ArrowUpRight, Compass } from "lucide-react";

export default function ExeEntry({ onEnter }) {
  return (
    <section className="exe-entry" aria-labelledby="exe-entry-title">
      <div>
        <span className="mono">
          <Compass size={13} aria-hidden="true" /> SYSTEM://DRIVING_WORLD
        </span>
        <h2 id="exe-entry-title">
          You've reached the end.
          <br />
          <em>Or another beginning.</em>
        </h2>
        <p>
          Take the wheel. Drive through my projects, technical skills, and
          journey in an interactive 3D miniature world adapted from Bruno Simon.
        </p>
      </div>
      <div className="exe-entry-action">
        <span className="mono">
          12 projects · 4 landmarks · optional driving
        </span>
        <a id="exe-entry-link" href="/world" onClick={onEnter}>
          ENTER THE DRIVING WORLD
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <span className="mono">INTERACTIVE 3D EXPERIENCE</span>
      </div>
    </section>
  );
}
