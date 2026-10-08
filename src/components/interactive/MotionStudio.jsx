import { ArrowDownRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { canStackProjects } from "../../utils/projectStack";
import { motionAllowed } from "../../utils/studioMotion";
import { installTactileMotion } from "../../utils/tactileMotion";

const chapterNames = {
  home: "Back to the studio",
  projects: "Selected work",
  playground: "A little creative chaos",
  "systems-lab": "Inside the system",
  skills: "The toolkit",
  education: "The person behind the work",
  credentials: "Always learning",
  contact: "Start a conversation",
};

export default function MotionStudio() {
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem("portfolio-motion") === "off";
    } catch {
      return false;
    }
  });
  const [chapter, setChapter] = useState("");
  const cursorRef = useRef(null);
  const threadRef = useRef(null);
  const chapterTimer = useRef(null);

  useEffect(() => installTactileMotion(), []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "off" : "on";
    try {
      localStorage.setItem("portfolio-motion", paused ? "off" : "on");
    } catch {
      // The motion control also works when browser storage is unavailable.
    }
    window.dispatchEvent(new Event("portfolio-motion-change"));
  }, [paused]);

  useEffect(() => {
    const root = document.documentElement;
    const observed = new WeakSet();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const grid = document.querySelector(".project-grid");
    let cards = [];
    let threadLayout = null;
    const thread = threadRef.current;
    const threadGroup = thread?.querySelector("g");
    const threadPaths = thread?.querySelectorAll("path");
    const threadDot = thread?.querySelector("circle");
    const bridge = document.querySelector(".chapter-bridge");
    const signalLines = [...document.querySelectorAll("[data-signal-line]")];
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    const scan = () => {
      const items = document.querySelectorAll(
        ".section-heading, .project-card, .archive-header, .architecture-card, .skill-card, .credential-card, .playground-intro, .playground-panel, .about-story, .education-card, .leadership-card, .contact-copy, .contact-form, .chapter-bridge",
      );
      items.forEach((item, index) => {
        if (observed.has(item)) return;
        observed.add(item);
        item.classList.add("reveal-target");
        if (root.dataset.transition === "work" && item.closest("#projects"))
          item.classList.add("is-visible");
        item.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
        observer.observe(item);
      });
      cards = [...document.querySelectorAll(".project-card")];
      if (!frame) frame = requestAnimationFrame(() => measure());
    };
    scan();
    root.classList.add("motion-ready");
    const mutations = new MutationObserver(scan);
    const main = document.getElementById("main-content");
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const measure = () => {
      frame = 0;
      const range = root.scrollHeight - window.innerHeight;
      const animate = motionAllowed();
      if (thread && window.innerWidth >= 1200) {
        const width = window.innerWidth;
        if (
          !threadLayout ||
          threadLayout.height !== root.scrollHeight ||
          threadLayout.width !== width
        ) {
          const chapters = [
            ...document.querySelectorAll("main > section[id], footer"),
          ];
          const points = chapters.map((section) => ({
            y: section.getBoundingClientRect().top + window.scrollY + 70,
          }));
          const x = width - 28;
          let d = `M${x} ${points[0]?.y || 100}`;
          for (let i = 1; i < points.length; i++) {
            const previous = points[i - 1].y;
            const y = points[i].y;
            const sway = i % 2 ? -24 : 10;
            d += ` C${x + sway} ${previous + (y - previous) * 0.35},${x - sway} ${previous + (y - previous) * 0.65},${x} ${y}`;
          }
          threadPaths.forEach((path) => {
            path.setAttribute("d", d);
          });
          threadLayout = {
            width,
            height: root.scrollHeight,
            start: points[0]?.y || 100,
            end: points.at(-1)?.y || root.scrollHeight,
            length: threadPaths[0].getTotalLength(),
          };
        }
        thread.setAttribute("viewBox", `0 0 ${width} ${window.innerHeight}`);
        threadGroup.setAttribute(
          "transform",
          `translate(0 ${-window.scrollY})`,
        );
        const progress = Math.max(
          0,
          Math.min(
            1,
            (window.scrollY + window.innerHeight * 0.68 - threadLayout.start) /
              (threadLayout.end - threadLayout.start),
          ),
        );
        threadPaths[1].style.strokeDasharray = `${threadLayout.length}`;
        threadPaths[1].style.strokeDashoffset = `${threadLayout.length * (1 - progress)}`;
        const point = threadPaths[0].getPointAtLength(
          threadLayout.length * progress,
        );
        threadDot.setAttribute("cx", point.x);
        threadDot.setAttribute("cy", point.y);
        thread.dataset.active = String(animate);
      }
      // Read all geometry before writing transforms; one frame handles the stack.
      const bounds = cards.map((card) => card.getBoundingClientRect());
      const stack =
        animate &&
        canStackProjects(
          window.innerWidth,
          window.innerHeight,
          cards.map((card) => card.offsetHeight),
        );
      const bridgeBounds = bridge?.getBoundingClientRect();
      const values = bounds.map((rect, index) => {
        const next = bounds[index + 1];
        const progress =
          stack && next
            ? Math.max(
                0,
                Math.min(
                  1,
                  1 -
                    (next.top - (105 + index * 9)) /
                      Math.min(window.innerHeight * 0.65, 580),
                ),
              )
            : 0;
        const drift =
          animate && window.innerWidth >= 900
            ? Math.max(
                -18,
                Math.min(
                  18,
                  (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.045,
                ),
              )
            : 0;
        return { progress, drift };
      });
      if (grid) grid.dataset.stack = String(stack);
      root.style.setProperty(
        "--page-progress",
        range > 0 ? window.scrollY / range : 0,
      );
      if (bridgeBounds) {
        const position =
          (window.innerHeight / 2 -
            bridgeBounds.top -
            bridgeBounds.height / 2) /
          window.innerHeight;
        const bend = animate ? Math.max(-1, Math.min(1, position * 2)) * 65 : 0;
        signalLines.forEach((line, index) => {
          const y = 36 + index * 14;
          const curve = bend * (1 - index * 0.2);
          line.setAttribute(
            "d",
            `M0 ${y} C300 ${y + curve} 900 ${y - curve} 1200 ${y}`,
          );
        });
      }
      cards.forEach((card, index) => {
        const { progress, drift } = values[index];
        card.style.setProperty("--stack-scale", 1 - progress * 0.065);
        card.style.setProperty("--stack-shade", progress * 0.38);
        card.style.setProperty("--image-drift", `${drift}px`);
      });
      root.style.setProperty(
        "--hero-shift",
        `${Math.min(window.scrollY * 0.13, 100)}px`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("portfolio-motion-change", onScroll);
    reduced.addEventListener("change", onScroll);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("motion-ready");
      if (grid) delete grid.dataset.stack;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("portfolio-motion-change", onScroll);
      reduced.removeEventListener("change", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let magnetic = null;
    let magnetBounds = null;
    let frame = 0;
    let previousTime = 0;
    let positioned = false;
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    let cursorWidth = 110;
    let cursorHeight = 36;
    const moveCursor = (time) => {
      frame = 0;
      const cursor = cursorRef.current;
      if (!cursor) return;
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
      previousTime = time;
      const response = 1 - Math.exp(-elapsed / 55);
      cursorX += (targetX - cursorX) * response;
      cursorY += (targetY - cursorY) * response;
      const settled = Math.hypot(targetX - cursorX, targetY - cursorY) < 0.25;
      if (settled) {
        cursorX = targetX;
        cursorY = targetY;
        previousTime = 0;
      }
      cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
      if (!settled) frame = requestAnimationFrame(moveCursor);
    };
    const resetMagnet = () => {
      magnetic?.style.setProperty("--mag-x", "0px");
      magnetic?.style.setProperty("--mag-y", "0px");
      magnetic = null;
      magnetBounds = null;
    };
    const onMove = (event) => {
      if (
        event.pointerType !== "mouse" ||
        paused ||
        !motionAllowed() ||
        !fine.matches
      )
        return;
      const target = event.target.closest?.("[data-cursor], .project-preview");
      const cursor = cursorRef.current;
      if (cursor) {
        const label = target?.dataset.cursor || (target ? "Explore" : "");
        if (cursor.textContent !== label) {
          cursor.textContent = label;
          cursorWidth = cursor.offsetWidth;
          cursorHeight = cursor.offsetHeight;
        }
        targetX = Math.min(
          event.clientX + 18,
          window.innerWidth - cursorWidth - 8,
        );
        targetY = Math.min(
          event.clientY + 18,
          window.innerHeight - cursorHeight - 8,
        );
        if (!positioned) {
          cursorX = targetX;
          cursorY = targetY;
          positioned = true;
        }
        cursor.dataset.visible = target ? "true" : "false";
        if (target && !frame) frame = requestAnimationFrame(moveCursor);
        else if (!target) {
          cancelAnimationFrame(frame);
          frame = 0;
          previousTime = 0;
          positioned = false;
        }
      }
      const button = event.target.closest?.(".magnetic");
      if (button !== magnetic) resetMagnet();
      if (button) {
        if (!magnetBounds) {
          const rect = button.getBoundingClientRect();
          const shift = getComputedStyle(button)
            .translate.split(" ")
            .map(parseFloat);
          magnetBounds = {
            x: rect.left + rect.width / 2 - (shift[0] || 0),
            y: rect.top + rect.height / 2 - (shift[1] || 0),
          };
        }
        magnetic = button;
        button.style.setProperty(
          "--mag-x",
          `${Math.max(-12, Math.min(12, (event.clientX - magnetBounds.x) * 0.12))}px`,
        );
        button.style.setProperty(
          "--mag-y",
          `${Math.max(-8, Math.min(8, (event.clientY - magnetBounds.y) * 0.15))}px`,
        );
      }
    };
    const onLeave = () => {
      resetMagnet();
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      positioned = false;
      if (cursorRef.current) cursorRef.current.dataset.visible = "false";
    };
    const onNavigate = (event) => {
      const anchor = event.target.closest?.('a[href^="#"]');
      const title = chapterNames[anchor?.getAttribute("href")?.slice(1)];
      if (!title || paused || reduced.matches) return;
      setChapter(title);
      clearTimeout(chapterTimer.current);
      chapterTimer.current = setTimeout(() => setChapter(""), 1150);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("click", onNavigate);
    document.addEventListener("visibilitychange", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onLeave, { passive: true });
    window.addEventListener("resize", onLeave);
    window.addEventListener("portfolio-motion-change", onLeave);
    reduced.addEventListener("change", onLeave);
    fine.addEventListener("change", onLeave);
    return () => {
      onLeave();
      clearTimeout(chapterTimer.current);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onNavigate);
      document.removeEventListener("visibilitychange", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onLeave);
      window.removeEventListener("resize", onLeave);
      window.removeEventListener("portfolio-motion-change", onLeave);
      reduced.removeEventListener("change", onLeave);
      fine.removeEventListener("change", onLeave);
    };
  }, [paused]);

  return (
    <>
      <div className="reading-progress" aria-hidden="true" />
      <svg
        className="studio-thread"
        ref={threadRef}
        aria-hidden="true"
        focusable="false"
      >
        <g>
          <path className="thread-track" />
          <path className="thread-ink" />
          <circle r="4" />
        </g>
      </svg>
      <div className="studio-cursor" ref={cursorRef} aria-hidden="true" />
      <button
        type="button"
        className="motion-toggle"
        aria-pressed={paused || systemReduced}
        disabled={systemReduced}
        aria-label={
          systemReduced
            ? "Reduced motion preference is active"
            : paused
              ? "Enable decorative motion"
              : "Pause decorative motion"
        }
        onClick={() => setPaused((value) => !value)}
      >
        {paused || systemReduced ? <Play size={12} /> : <Pause size={12} />}
        <span>Motion {systemReduced ? "reduced" : paused ? "off" : "on"}</span>
      </button>
      {chapter && (
        <div className="chapter-toast" key={chapter} aria-hidden="true">
          <ArrowDownRight size={20} />
          <span>{chapter}</span>
        </div>
      )}
    </>
  );
}
