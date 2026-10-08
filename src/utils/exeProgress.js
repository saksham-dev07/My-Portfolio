export function saveExeReturn(focusId = "exe-entry-link") {
  try {
    sessionStorage.setItem(
      "saksham-exe-return",
      JSON.stringify({
        url: `${location.pathname}${location.search}${location.hash}`,
        y: window.scrollY,
        focusId,
      }),
    );
  } catch {
    /* Exit still returns to the footer. */
  }
}
export function readExeReturn() {
  try {
    const data = JSON.parse(
      sessionStorage.getItem("saksham-exe-return") || "null",
    );
    // The experience returns only to this portfolio's root, never a supplied URL.
    if (data && /^\/(?:\?|#|$)/.test(data.url) && Number.isFinite(data.y))
      return {
        url: data.url,
        y: Math.max(0, data.y),
        focusId:
          /^(exe-entry-link|hero-world-link|developer-terminal-launcher|world-[a-z0-9-]+)$/.test(
            data.focusId,
          )
            ? data.focusId
            : "exe-entry-link",
      };
  } catch {
    /* Corrupt or unavailable storage. */
  }
  return { url: "/#footer", y: null };
}
