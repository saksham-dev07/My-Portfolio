import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
if (!existsSync(output)) throw new Error("Run bun run build first.");

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? filesIn(path)
      : [{ path, bytes: statSync(path).size }];
  });
}

const files = filesIn(output);
const unexpected = files.filter(({ path }) =>
  /(?:\.map|\.gz|\.br|\.log)$|(?:^|[\\/])(?:\.env(?:\..*)?|AGENTS\.md|GEMINI\.md|SKILL\.md)$/i.test(
    path,
  ),
);
if (unexpected.length)
  throw new Error(
    `Unexpected deployment files: ${unexpected.map(({ path }) => relative(root, path)).join(", ")}`,
  );

for (const path of [
  "index.html",
  "404.html",
  "resume.pdf",
  "driving-world/index.html",
])
  if (!existsSync(join(output, path)))
    throw new Error(`Missing deployment entry: ${path}`);

const largest = [...files].sort((a, b) => b.bytes - a.bytes)[0];
if (largest.bytes >= 100 * 1024 * 1024)
  throw new Error(`Oversized static file: ${relative(output, largest.path)}`);

const mib = (bytes) => (bytes / 1024 / 1024).toFixed(2);
console.log(
  `Deployment: ${files.length} files, ${mib(files.reduce((sum, file) => sum + file.bytes, 0))} MiB.`,
);
console.log(
  `Largest asset: ${relative(output, largest.path)} (${mib(largest.bytes)} MiB).`,
);
console.log(
  "No source maps, compression duplicates, environment files, or local instruction files in dist.",
);
