import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motionAllowed } from "../../utils/studioMotion";

export default function PlayfulPeriod() {
  const clicks = useRef({ count: 0, time: 0 });
  const flight = useRef(null);
  const timeout = useRef(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const stop = () => {
      flight.current?.animation.cancel();
      flight.current?.dot.remove();
      flight.current = null;
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("portfolio-motion-change", stop);
    document.addEventListener("visibilitychange", stop);
    reduced.addEventListener("change", stop);
    return () => {
      stop();
      clearTimeout(timeout.current);
      window.removeEventListener("portfolio-motion-change", stop);
      document.removeEventListener("visibilitychange", stop);
      reduced.removeEventListener("change", stop);
    };
  }, []);
  const poke = (event) => {
    const now = performance.now();
    clicks.current.count =
      now - clicks.current.time < 2000 ? clicks.current.count + 1 : 1;
    clicks.current.time = now;
    clearTimeout(timeout.current);
    if (clicks.current.count < 3) {
      setMessage(
        clicks.current.count === 1
          ? "A full stop with unfinished business. Try again."
          : "One more poke. What could go wrong?",
      );
    } else {
      clicks.current.count = 0;
      setMessage(
        "The full stop is taking a short break. More questionable physics in the Lab.",
      );
      if (motionAllowed() && !flight.current && !document.hidden) {
        const rect = event.currentTarget.getBoundingClientRect();
        const dot = document.createElement("span");
        dot.className = "escaped-period";
        dot.setAttribute("aria-hidden", "true");
        Object.assign(dot.style, {
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.bottom - 18}px`,
        });
        document.body.append(dot);
        const floor = Math.max(
          0,
          Math.min(200, innerHeight - rect.bottom - 30),
        );
        const travel = Math.min(100, innerWidth - rect.right - 24);
        let y = 0,
          velocity = 0;
        const frames = Array.from({ length: 121 }, (_, index) => {
          velocity += 1400 / 60;
          y += velocity / 60;
          if (y >= floor) {
            y = floor;
            velocity *= -0.42;
          }
          return {
            transform: `translate(${(travel * index) / 120}px,${y}px)`,
            opacity: index < 105 ? 1 : (120 - index) / 15,
            offset: index / 120,
          };
        });
        const animation = dot.animate(frames, {
          duration: 2000,
          easing: "linear",
        });
        flight.current = { dot, animation };
        animation.onfinish = () => {
          dot.remove();
          flight.current = null;
        };
      }
    }
    timeout.current = setTimeout(() => {
      if (!document.activeElement?.closest(".period-note")) setMessage("");
    }, 5000);
  };
  return (
    <>
      <button
        type="button"
        className="name-period playful-period"
        aria-label="Poke the full stop"
        title="A full stop with unfinished business"
        onClick={poke}
      >
        .
      </button>
      {message &&
        createPortal(
          <div className="period-note">
            <p role="status">{message}</p>
            <a href="/lab#gravity">Investigate gravity</a>
          </div>,
          document.body,
        )}
    </>
  );
}
