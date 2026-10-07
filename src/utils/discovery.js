export const fragments = {
  blueprint: "Evidence beats a confident black box.",
  notebook: "The interesting part is how people use it together.",
  lab: "Curiosity is allowed to ship small.",
  footer: "There is always another layer to explore.",
};
const key = "saksham-discovery-v1";
let memory = { fragments: [], achievements: [] };
export function readDiscovery() {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (value)
      memory = {
        fragments: [
          ...new Set(
            (Array.isArray(value.fragments) ? value.fragments : []).filter(
              (id) => Object.hasOwn(fragments, id),
            ),
          ),
        ],
        achievements: [
          ...new Set(
            (Array.isArray(value.achievements)
              ? value.achievements
              : []
            ).filter((id) => id === "button-presser"),
          ),
        ],
      };
  } catch {
    /* Private browsing still has session progress. */
  }
  return memory;
}
export function discover(id, kind = "fragments") {
  const current = readDiscovery();
  if (kind !== "fragments" && kind !== "achievements") return current;
  if (
    kind === "fragments"
      ? !Object.hasOwn(fragments, id)
      : id !== "button-presser"
  )
    return current;
  memory = { ...current, [kind]: [...new Set([...current[kind], id])] };
  try {
    localStorage.setItem(key, JSON.stringify(memory));
  } catch {
    /* Session only. */
  }
  window.dispatchEvent(new Event("portfolio-discovery"));
  return memory;
}
