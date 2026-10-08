import { motionAllowed } from "./studioMotion";

// Analytic spring samples for a finite WAAPI release; no idle animation loop.
function releaseFrames() {
  const stiffness = 200;
  const damping = 20;
  const frequency = Math.sqrt(stiffness - (damping / 2) ** 2);
  return Array.from({ length: 37 }, (_, index) => {
    const time = (index / 36) * 0.6;
    const displacement =
      Math.exp((-damping / 2) * time) *
      (Math.cos(frequency * time) +
        (damping / (2 * frequency)) * Math.sin(frequency * time));
    return {
      scale:
        index === 36
          ? "1 1"
          : `${1 - 0.035 * displacement} ${1 - 0.07 * displacement}`,
      offset: index / 36,
    };
  });
}
const release = releaseFrames();
const clickables =
  ".button, .icon-button, .idea-signal-launch, .project-lens button, .project-open-story, .margin-fragment button, .discovery-launchers button";

/** Delegated interactions: preview tilt never owns the card's stack transform. */
export function installTactileMotion() {
  const animations = new Map();
  const springs = new Map();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(pointer: fine) and (min-width: 900px)");
  let held;
  let hovering;
  let frame = 0;
  let lastTime = 0;

  const play = (element, keyframes, options) => {
    animations.get(element)?.cancel();
    const animation = element.animate(keyframes, options);
    animations.set(element, animation);
    animation.onfinish = () => {
      if (animations.get(element) === animation) animations.delete(element);
      animation.cancel();
    };
  };
  const up = () => {
    if (!held) return;
    const element = held;
    held = undefined;
    if (!motionAllowed()) {
      animations.get(element)?.cancel();
      animations.delete(element);
      return;
    }
    play(element, release, { duration: 600, easing: "linear" });
  };
  const down = (event) => {
    if (event.button !== 0 || !motionAllowed()) return;
    const element = event.target.closest?.(clickables);
    if (!element || element.matches(":disabled, [aria-disabled='true']"))
      return;
    up();
    held = element;
    play(element, [{ scale: "1 1" }, { scale: ".965 .93" }], {
      duration: 70,
      easing: "ease-out",
      fill: "forwards",
    });
    // Keep the pressed frame until release rather than canceling on finish.
    animations.get(element).onfinish = null;
  };
  const tick = (time) => {
    frame = 0;
    const elapsed = Math.min((time - lastTime) / 1000 || 1 / 60, 0.032);
    lastTime = time;
    for (const [element, spring] of springs) {
      if (!element.isConnected) {
        springs.delete(element);
        continue;
      }
      const steps = Math.ceil(elapsed * 120);
      const dt = elapsed / steps;
      for (let step = 0; step < steps; step++) {
        for (const axis of ["x", "y"]) {
          const velocity = `${axis}Velocity`;
          spring[velocity] +=
            (180 * (spring[`${axis}Target`] - spring[axis]) -
              24 * spring[velocity]) *
            dt;
          spring[axis] += spring[velocity] * dt;
        }
      }
      const settled = ["x", "y"].every(
        (axis) =>
          Math.abs(spring[axis] - spring[`${axis}Target`]) < 0.005 &&
          Math.abs(spring[`${axis}Velocity`]) < 0.02,
      );
      if (settled) {
        spring.x = spring.xTarget;
        spring.y = spring.yTarget;
        springs.delete(element);
      }
      element.style.setProperty("--preview-rx", `${spring.y}deg`);
      element.style.setProperty("--preview-ry", `${spring.x}deg`);
    }
    if (springs.size) frame = requestAnimationFrame(tick);
  };
  const target = (element, x, y) => {
    if (!element) return;
    const spring = springs.get(element) || {
      x: Number.parseFloat(element.style.getPropertyValue("--preview-ry")) || 0,
      y: Number.parseFloat(element.style.getPropertyValue("--preview-rx")) || 0,
      xVelocity: 0,
      yVelocity: 0,
    };
    Object.assign(spring, { xTarget: x, yTarget: y });
    springs.set(element, spring);
    if (!frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const move = (event) => {
    if (event.pointerType !== "mouse" || !motionAllowed() || !fine.matches)
      return;
    const preview = event.target.closest?.(".project-preview");
    const image = preview?.querySelector(".preview-image");
    if (image !== hovering) target(hovering, 0, 0);
    hovering = image;
    if (!image) return;
    const bounds = preview.getBoundingClientRect();
    const clamp = (value) => Math.max(-3, Math.min(3, value));
    target(
      image,
      clamp(
        ((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 6,
      ),
      clamp(
        (-(event.clientY - bounds.top - bounds.height / 2) / bounds.height) * 6,
      ),
    );
  };
  const nudgeLetter = (event) => {
    if (event.pointerType !== "mouse" || !motionAllowed() || !fine.matches)
      return;
    const letter = event.target.closest?.(".name-character");
    if (!letter || letter.contains(event.relatedTarget)) return;
    for (const [element, distance] of [
      [letter.previousElementSibling, -1],
      [letter, 0],
      [letter.nextElementSibling, 1],
    ]) {
      if (!element?.matches(".name-character")) continue;
      const strength = distance === 0 ? 1 : 0.4;
      const rotation = (distance || 1) * 4 * strength;
      play(
        element,
        [
          { translate: "0 0", rotate: "0deg" },
          {
            translate: `0 ${5 * strength}px`,
            rotate: `${rotation}deg`,
            offset: 0.2,
          },
          {
            translate: `0 ${-strength}px`,
            rotate: `${-rotation * 0.4}deg`,
            offset: 0.55,
          },
          { translate: "0 0", rotate: "0deg" },
        ],
        {
          duration: 580,
          easing: "cubic-bezier(.22,1,.36,1)",
          delay: Math.abs(distance) * 35,
        },
      );
    }
  };
  const reset = () => {
    held = undefined;
    hovering = undefined;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    for (const element of springs.keys()) {
      element.style.setProperty("--preview-rx", "0deg");
      element.style.setProperty("--preview-ry", "0deg");
    }
    springs.clear();
    document.querySelectorAll(".preview-image").forEach((element) => {
      element.style.removeProperty("--preview-rx");
      element.style.removeProperty("--preview-ry");
    });
  };
  const leave = () => {
    target(hovering, 0, 0);
    hovering = undefined;
    up();
  };
  const key = (event) => {
    if (event.repeat || !["Enter", " "].includes(event.key)) return;
    if (event.target.matches?.(clickables) && motionAllowed()) {
      play(
        event.target,
        [{ scale: "1" }, { scale: ".96", offset: 0.25 }, { scale: "1" }],
        { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
  };
  document.addEventListener("pointerdown", down);
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", nudgeLetter, { passive: true });
  document.addEventListener("pointerleave", leave);
  document.addEventListener("keydown", key);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", reset);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  window.addEventListener("portfolio-motion-change", reset);
  reduced.addEventListener("change", reset);
  fine.addEventListener("change", reset);
  return () => {
    reset();
    document.removeEventListener("pointerdown", down);
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", nudgeLetter);
    document.removeEventListener("pointerleave", leave);
    document.removeEventListener("keydown", key);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", reset);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", reset);
    window.removeEventListener("portfolio-motion-change", reset);
    reduced.removeEventListener("change", reset);
    fine.removeEventListener("change", reset);
  };
}
