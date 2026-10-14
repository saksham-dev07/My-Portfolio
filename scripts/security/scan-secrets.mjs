import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function secretTypes(text) {
  return [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["Resend credential", /\bre_[A-Za-z0-9_-]{20,}/],
    ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["GitHub token", /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
    ["Google API key", /\bAIza[A-Za-z0-9_-]{30,}/],
  ]
    .filter(([, pattern]) => pattern.test(text))
    .map(([type]) => type);
}

if (import.meta.main) {
  const textFile =
    /\.(?:jsx?|mjs|cjs|json|md|ya?ml|html|css|txt|patch)$|(^|\/)\.env(?:\.|$)/i;
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter((file) => file && textFile.test(file));
  const findings = files.flatMap((file) =>
    secretTypes(readFileSync(file, "utf8")).map((type) => ({ file, type })),
  );
  if (process.argv.includes("--history")) {
    const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .map((line) => {
        const index = line.indexOf(" ");
        return { id: line.slice(0, index), file: line.slice(index + 1) };
      })
      .filter(({ id, file }) => id && textFile.test(file));
    const blobs = execFileSync("git", ["cat-file", "--batch"], {
      input: `${objects.map(({ id }) => id).join("\n")}\n`,
      maxBuffer: 128 * 1024 * 1024,
    });
    let offset = 0;
    for (const { id, file } of objects) {
      const end = blobs.indexOf(10, offset);
      const size = Number(blobs.subarray(offset, end).toString().split(" ")[2]);
      if (!Number.isSafeInteger(size))
        throw new Error("Cannot read Git blob metadata.");
      const body = blobs.subarray(end + 1, end + 1 + size).toString();
      offset = end + 2 + size;
      for (const type of secretTypes(body))
        findings.push({ file, blob: id.slice(0, 12), type });
    }
  }
  // Only locations/types are printed. Never include a matching secret value.
  if (findings.length) {
    console.error(JSON.stringify(findings, null, 2));
    process.exitCode = 1;
  } else
    console.log("No checked credential signatures in the scanned Git inputs.");
}
