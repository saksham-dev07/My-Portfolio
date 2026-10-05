import { flushSync } from "react-dom";

export function motionAllowed() {
  return (
    document.documentElement.dataset.motion !== "off" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let activeTransition;
let pendingUpdate;
let requestVersion = 0;
let activeRipple;

function themeRipple(update, origin) {
  activeRipple?.();
  flushSync(update);
  if (!motionAllowed() || document.hidden) return;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const ripple = document.createElement("div");
  ripple.className = "theme-ripple";
  ripple.setAttribute("aria-hidden", "true");
  Object.assign(ripple.style, {
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    left: `${x - radius}px`,
    top: `${y - radius}px`,
  });
  document.body.append(ripple);
  const animation = ripple.animate(
    [
      { transform: "scale(0)", opacity: 0.2 },
      { transform: "scale(.7)", opacity: 0.08, offset: 0.65 },
      { transform: "scale(1)", opacity: 0 },
    ],
    { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" },
  );
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanup = () => {
    animation.onfinish = null;
    animation.cancel();
    ripple.remove();
    reduced.removeEventListener("change", settle);
    window.removeEventListener("portfolio-motion-change", settle);
    if (activeRipple === cleanup) activeRipple = undefined;
  };
  const settle = () => {
    if (!motionAllowed()) cleanup();
  };
  activeRipple = cleanup;
  animation.onfinish = cleanup;
  reduced.addEventListener("change", settle);
  window.addEventListener("portfolio-motion-change", settle);
}

/** Native snapshots keep the interface usable in browsers without this API. */
export function transitionView(update, { kind = "work", origin } = {}) {
  const version = ++requestVersion;
  // A second action wins immediately, even while a previous snapshot is pending.
  if (activeTransition) {
    activeTransition.skipTransition();
    activeTransition = undefined;
    delete document.documentElement.dataset.transition;
    const commitPrevious = pendingUpdate;
    pendingUpdate = undefined;
    flushSync(() => {
      commitPrevious?.();
      update();
    });
    return;
  }
  if (kind === "theme") {
    themeRipple(update, origin);
    return;
  }
  if (
    !motionAllowed() ||
    !document.startViewTransition ||
    document.hidden ||
    activeRipple
  ) {
    update();
    return;
  }
  const root = document.documentElement;
  root.dataset.transition = kind;
  let updated = false;
  const commit = () => {
    if (updated) return;
    updated = true;
    update();
  };
  let transition;
  try {
    transition = document.startViewTransition(() => {
      if (version !== requestVersion) return;
      flushSync(commit);
    });
  } catch {
    delete root.dataset.transition;
    if (!updated) update();
    return;
  }
  activeTransition = transition;
  pendingUpdate = commit;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const settle = () => {
    if (motionAllowed()) return;
    transition.skipTransition();
  };
  reduced.addEventListener("change", settle);
  window.addEventListener("portfolio-motion-change", settle);
  transition.ready.catch(() => {
    // Skipped snapshots still commit their update; animation is optional.
  });
  transition.finished
    .catch(() => {})
    .finally(() => {
      reduced.removeEventListener("change", settle);
      window.removeEventListener("portfolio-motion-change", settle);
      if (activeTransition === transition) {
        activeTransition = undefined;
        pendingUpdate = undefined;
        delete root.dataset.transition;
      }
    });
}
