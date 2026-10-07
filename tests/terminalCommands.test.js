import { describe, expect, test } from "bun:test";
import { terminalCommand } from "../src/utils/terminalCommands";

describe("portfolio terminal allowlist", () => {
  test("normalizes only known commands and navigates to fixed portfolio targets", () => {
    expect(terminalCommand("  SUDO   hire Saksham ").action).toBe("/#contact");
    expect(terminalCommand("resume").action).toBe("/resume.pdf");
    expect(terminalCommand("lab").action).toBe("/lab");
  });
  test("never interprets shell syntax, script markup or external URLs", () => {
    for (const input of [
      "help; rm -rf /",
      "$(whoami)",
      "<script>alert(1)</script>",
      "https://evil.example",
      "sudo hire saksham && curl example.com",
      "__proto__",
      "constructor",
    ]) {
      const result = terminalCommand(input);
      expect(result.action).toBeUndefined();
      expect(result.text).toStartWith("Command not found:");
    }
    expect(terminalCommand("rm -rf portfolio").action).toBe("glitch");
  });
  test("uses supplied project data without invented metrics", () => {
    expect(
      terminalCommand("projects", {
        projects: [
          {
            name: "A build",
            source_code_link: "https://github.com/example/build",
          },
        ],
      }).text,
    ).toBe("A build — https://github.com/example/build");
    expect(
      terminalCommand("skills", { skills: [{ name: "Python" }] }).text,
    ).toBe("Python");
  });
});
