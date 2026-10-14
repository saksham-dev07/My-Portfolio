import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const root = new URL("../../", import.meta.url);
const require = createRequire(new URL("package.json", root));
export const BRACES_ADVISORY = "GHSA-vfj7-8cjw-p6xm";

export function verifyBracesMitigation() {
  const manifest = JSON.parse(
    readFileSync(new URL("package.json", root), "utf8"),
  );
  if (
    manifest.patchedDependencies?.["braces@3.0.3"] !==
    "patches/braces@3.0.3.patch"
  )
    throw new Error("The registered braces security patch is missing.");
  const patch = readFileSync(
    new URL("patches/braces@3.0.3.patch", root),
    "utf8",
  );
  const digest = createHash("sha256")
    .update(patch.replace(/\r\n/g, "\n"))
    .digest("hex");
  if (
    digest !==
    "d55a062eb2da1dc422cc19931d80bf620e21af90336d218151da373f4497b385"
  )
    throw new Error(
      "Braces patch changed; review and update its integrity check.",
    );
  const braces = require("braces");
  const deep = `${"{".repeat(2000)}a,b${"}".repeat(2000)}`;
  for (const action of ["parse", "compile", "expand", "stringify"]) {
    let blocked = false;
    try {
      braces[action](deep);
    } catch (error) {
      blocked = error.message === "brace AST nesting exceeds safety limit";
    }
    if (!blocked)
      throw new Error(`Braces ${action} did not enforce the depth guard.`);
  }
  if (
    JSON.stringify(braces.expand("file-{a,b}.js")) !==
    '["file-a.js","file-b.js"]'
  )
    throw new Error("The braces mitigation changed ordinary expansion.");
  return true;
}

if (import.meta.main) {
  let unresolved = 0;
  for (const project of [
    root,
    new URL("experiments/saksham-driving-world/", root),
  ]) {
    const result = spawnSync(process.execPath, ["audit", "--json"], {
      cwd: project,
      encoding: "utf8",
    });
    if (![0, 1].includes(result.status))
      throw new Error("Dependency audit failed to run.");
    let advisories;
    try {
      advisories = JSON.parse(result.stdout);
    } catch {
      throw new Error("Dependency advisory service did not return valid JSON.");
    }
    for (const [name, records] of Object.entries(advisories)) {
      if (!Array.isArray(records))
        throw new Error("Unexpected advisory response.");
      for (const advisory of records) {
        const id = advisory.url?.split("/").at(-1);
        if (project === root && name === "braces" && id === BRACES_ADVISORY) {
          verifyBracesMitigation();
          console.log(
            `${name}: ${id} mitigated by integrity-checked local depth patch; upstream advisory remains.`,
          );
        } else {
          unresolved++;
          console.error(
            `${name}: ${advisory.severity} ${id} ${advisory.title}`,
          );
        }
      }
    }
  }
  if (unresolved) process.exitCode = 1;
  else console.log("No unmitigated dependency advisories in either lockfile.");
}
