import { ArrowUpRight, BrainCircuit, Cloud, Code2, Server } from "lucide-react";
import { projects, technologies } from "../constants";
import SectionHeading from "./SectionHeading";

const groups = [
  {
    title: "Intelligence",
    icon: BrainCircuit,
    body: "Models, vision, and explainability.",
    categories: ["AI & ML"],
    extra: ["Python"],
  },
  {
    title: "Interfaces",
    icon: Code2,
    body: "From typed components to canvas experiences.",
    categories: ["Frontend"],
    extra: ["TypeScript", "JavaScript"],
  },
  {
    title: "Systems",
    icon: Server,
    body: "APIs, application data, and reliable boundaries.",
    categories: ["Backend"],
    extra: ["PostgreSQL", "MongoDB", "Firebase", "Appwrite"],
  },
  {
    title: "Delivery",
    icon: Cloud,
    body: "The tools that take a build from local to live.",
    categories: ["DevOps & Tools"],
    extra: ["AWS", "Google Cloud"],
  },
];
export default function Tech() {
  return (
    <section
      id="skills"
      className="shell section-block"
      aria-labelledby="skills-title"
    >
      <SectionHeading
        number="03"
        label="The toolkit"
        title={
          <span id="skills-title">
            Different tools.
            <br />
            <em>One builder’s mindset.</em>
          </span>
        }
        description="The languages, frameworks, and platforms I reach for. Tap a tool to see where it fits."
      />
      <div className="skills-grid">
        {groups.map((group, index) => (
          <article className="skill-card" key={group.title}>
            <div className="skill-top">
              <group.icon size={24} />
              <span className="mono">0{index + 1}</span>
            </div>
            <h3>{group.title}</h3>
            <p>{group.body}</p>
            <ul>
              {technologies
                .filter(
                  (t) =>
                    group.categories.includes(t.category) ||
                    group.extra.includes(t.name),
                )
                .map((tool) => (
                  <li key={tool.name}>
                    <details className="skill-disclosure">
                      <summary>
                        <tool.icon size={17} />
                        <span>{tool.name}</span>
                      </summary>
                      <div className="skill-description">{tool.desc}</div>
                      {projects
                        .filter((project) =>
                          project.tags.some(
                            (tag) =>
                              tag.name === tool.name ||
                              (tool.name === "React.js" &&
                                tag.name.startsWith("React")),
                          ),
                        )
                        .slice(0, 3)
                        .map((project, index) => (
                          <a
                            className="skill-build-link"
                            key={project.id}
                            href={project.source_code_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="mono">0{index + 1}</span>
                            {
                              project.name
                                .replace(" (Generative AI)", "")
                                .split(" – ")[0]
                            }
                            <ArrowUpRight size={12} />
                          </a>
                        ))}
                    </details>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
