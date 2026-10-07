import { ArrowLeft, FlaskConical } from "lucide-react";
import { useEffect } from "react";
export default function NotFound() {
  useEffect(() => {
    const title = document.title;
    document.title = "404 — Uncharted territory | Saksham Agarwal";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, follow";
    document.head.append(robots);
    return () => {
      document.title = title;
      robots.remove();
    };
  }, []);
  return (
    <main className="uncharted-page">
      <span className="mono">COORDINATES / UNKNOWN</span>
      <div className="uncharted-map" aria-hidden="true">
        404
        <span />
      </div>
      <h1>A little too far off the map.</h1>
      <p>This page doesn't exist. Curiosity is welcome, though.</p>
      <div>
        <a href="/">
          <ArrowLeft size={16} /> Return to portfolio
        </a>
        <a href="/lab">
          <FlaskConical size={16} /> Try the Lab
        </a>
      </div>
    </main>
  );
}
