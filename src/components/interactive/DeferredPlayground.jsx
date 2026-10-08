import { lazy, Suspense, useEffect, useRef, useState } from "react";

const BuildPlayground = lazy(() => import("./BuildPlayground"));

export default function DeferredPlayground() {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const introduction = (
    <div className="deferred-playground">
      <span className="eyebrow">NOT A SPECTATOR SPORT</span>
      <h2 id="playground-title">
        Less scrolling.
        <br />
        <em>More experimenting.</em>
      </h2>
      <p>Draw something. Step through a compiler. Throw my skills around.</p>
      <button
        className="button button-secondary"
        type="button"
        onClick={() => setReady(true)}
      >
        Open the playground
      </button>
    </div>
  );
  return (
    <section
      id="playground"
      className="shell playground-section"
      ref={ref}
      aria-labelledby="playground-title"
    >
      {ready ? (
        <Suspense fallback={introduction}>
          <BuildPlayground embedded />
        </Suspense>
      ) : (
        introduction
      )}
    </section>
  );
}
