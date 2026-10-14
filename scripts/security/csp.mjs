import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function inlineScriptHashes(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs, content]) => !/\bsrc\s*=/.test(attrs) && content.trim())
    .map(
      ([, , content]) =>
        `'sha256-${createHash("sha256").update(content).digest("base64")}'`,
    );
}

export function verifyCsp(root = new URL("../../", import.meta.url)) {
  const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
  const policy = config.headers
    .find((rule) => rule.source === "/(.*)")
    ?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
  if (!policy?.includes("frame-ancestors 'self'"))
    throw new Error(
      "An enforced CSP preserving same-origin world framing is required.",
    );
  const script = policy
    .split(";")
    .find((part) => part.trim().startsWith("script-src "));
  if (!script || /'unsafe-inline'|'unsafe-eval'/.test(script))
    throw new Error(
      "The script policy must not permit arbitrary inline JS or eval.",
    );
  for (const file of ["dist/index.html", "dist/driving-world/index.html"])
    for (const hash of inlineScriptHashes(
      readFileSync(new URL(file, root), "utf8"),
    ))
      if (!script.includes(hash))
        throw new Error(
          `CSP hash missing for ${file}; regenerate the policy before shipping.`,
        );
  return policy;
}

if (import.meta.main) {
  verifyCsp();
  console.log(
    "Enforced CSP covers the built portfolio and world inline scripts.",
  );
}
