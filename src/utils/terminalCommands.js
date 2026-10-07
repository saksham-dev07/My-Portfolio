const commands = [
  "help",
  "whoami",
  "projects",
  "skills",
  "experience",
  "contact",
  "resume",
  "lab",
  "clear",
  "matrix",
  "coffee",
  "date",
  "about",
  "exit",
];
// This is a command dictionary, never a shell, interpreter or evaluator.
export function terminalCommand(
  input,
  { projects = [], skills = [], now = new Date() } = {},
) {
  const command = input.trim().toLowerCase().replace(/\s+/g, " ");
  const result = (text, action) => ({ text, action });
  switch (command) {
    case "help":
      return result(`${commands.join(" · ")}\nTry: sudo hire saksham`);
    case "whoami":
    case "about":
      return result(
        "Saksham Agarwal · CSE at VIT Bhopal, class of 2027.\nBuilding explainable AI, full-stack applications and collaborative tools.",
      );
    case "projects":
      return result(
        projects
          .map((project) => `${project.name} — ${project.source_code_link}`)
          .join("\n"),
      );
    case "skills":
      return result(skills.map((skill) => skill.name).join(" · "));
    case "experience":
      return result(
        "Explore my education, leadership and credentials.",
        "/#education",
      );
    case "contact":
      return result("Opening the contact interface.", "/#contact");
    case "resume":
      return result("Opening the résumé.", "/resume.pdf");
    case "lab":
      return result("Curiosity wins. Opening the laboratory.", "/lab");
    case "clear":
    case "exit":
      return result("", command);
    case "matrix":
      return result("Data rain enabled briefly. Follow the signal.", "matrix");
    case "coffee":
      return result("CAFFEINE CORE: 87%.\nEnough to debug one more thing.");
    case "date":
      return result(now.toLocaleString());
    case "sudo hire saksham":
      return result(
        "Checking recruiter permissions…\n[################] 100%\nACCESS GRANTED\nOpening contact interface…",
        "/#contact",
      );
    case "rm -rf portfolio":
      return result(
        "Deleting portfolio…\n[########........]\nERROR: Saksham has backups.\nNice try.",
        "glitch",
      );
    default:
      return result(
        `Command not found: ${input.slice(0, 120)}\nType help. Only the listed commands are supported.`,
      );
  }
}
