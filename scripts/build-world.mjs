import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const world = fileURLToPath(
  new URL("../experiments/saksham-driving-world/", import.meta.url),
);
const output = fileURLToPath(
  new URL("../public/driving-world/", import.meta.url),
);
// Source assets live only in the world project. Publish a fresh, reproducible
// build for the iframe before starting or building the React portfolio.
if (!existsSync(join(world, "node_modules", "vite"))) {
  const install = spawnSync(
    process.execPath,
    ["install", "--frozen-lockfile"],
    { cwd: world, stdio: "inherit" },
  );
  if (install.status !== 0) process.exit(install.status || 1);
}
const build = spawnSync(process.execPath, ["run", "build"], {
  cwd: world,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);
// This target is a fixed generated directory inside this repository.
rmSync(output, { recursive: true, force: true });
cpSync(join(world, "dist"), output, { recursive: true });
// The inherited runtime retains its MIT notice in the distributed files.
copyFileSync(join(world, "license.md"), join(output, "license.md"));
copyFileSync(
  join(root, "public", "resume.pdf"),
  join(output, "saksham", "resume.pdf"),
);
console.log(
  "Driving world published to public/driving-world (generated, Git-ignored).",
);
