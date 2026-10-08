import { projectStoryHref, projectWorldHref } from "./worldNavigation";

const commands = [
  "help",
  "whoami",
  "projects",
  "skills",
  "experience",
  "contact",
  "resume",
  "lab",
  "world",
  "surprise",
  "clear",
  "matrix",
  "coffee",
  "gravity",
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
  const [verb, projectId, ...extra] = command.split(" ");
  if (["world", "story"].includes(verb) && projectId && !extra.length) {
    const project = projects.find((item) => item.id === projectId);
    if (project)
      return result(
        `Opening ${project.name} ${verb === "world" ? "in the driving world" : "in the portfolio"}.`,
        verb === "world"
          ? projectWorldHref(project.id)
          : projectStoryHref(project.id),
      );
  }
  switch (command) {
    case "help":
      return result(
        `${commands.join(" · ")}\nworld [project-id] · story [project-id]\n${projects
          .filter((project) => project.featured)
          .map((project) => project.id)
          .join(" · ")}\nTry: sudo hire saksham`,
      );
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
    case "world":
      return result("Take the wheel. Opening my driving world.", "/world");
    case "surprise":
      return result(
        "A small detour. Try throwing a framework around.",
        "/lab#gravity",
      );
    case "gravity":
      return result(
        "Releasing the skill stack.\nPlease keep all frameworks inside the experiment.",
        "/lab#gravity",
      );
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
