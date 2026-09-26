import { ArrowUpRight, Github } from "lucide-react";
import { memo } from "react";
import { projects } from "../constants";
import { useRole } from "../context/RoleContext";
import { SectionWrapper } from "../hoc";

const BuildRow = memo(({ project }) => {
  const { name, role, period, description, tags, source_code_link, live_demo } =
    project;

  const targetLink = live_demo || source_code_link;

  return (
    <li className="build-row-item group relative border-b border-white/10 last:border-b-0 transition-colors duration-200">
      <a
        href={targetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="build-row-link flex flex-col lg:flex-row lg:items-center justify-between py-5 px-3 sm:px-4 rounded-xl hover:bg-white/[0.03] transition-all gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label={`${name} - ${role} (opens in a new tab)`}
      >
        {/* Left: Meta + Title */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 min-w-0 sm:min-w-[280px]">
          <span className="text-xs font-mono text-zinc-500 sm:min-w-[110px]">
            {period}
          </span>
          <span className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
            <span>{name}</span>
            <ArrowUpRight
              size={15}
              className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-cyan-400"
            />
          </span>
        </div>

        {/* Center: Summary */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md line-clamp-2 lg:line-clamp-1 font-normal">
          {description}
        </p>

        {/* Right: Tech Stack Pills & Action */}
        <div className="flex items-center gap-2 flex-wrap lg:justify-end">
          {tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="build-row-tag px-2 py-0.5 text-[11px] font-mono rounded bg-white/[0.04] border border-white/10 text-zinc-400"
            >
              {tag.name}
            </span>
          ))}

          {live_demo && (
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 ml-2 font-semibold">
              Live
            </span>
          )}
          {!live_demo && source_code_link && (
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1 ml-2">
              <Github size={12} />
              Code
            </span>
          )}
        </div>
      </a>
    </li>
  );
});
BuildRow.displayName = "BuildRow";

const SmallerBuilds = () => {
  const { activeRole } = useRole();

  // Non-featured projects
  const smallerProjects = projects.filter((p) => !p.featured);

  const filteredProjects =
    activeRole === "all"
      ? smallerProjects
      : smallerProjects.filter((p) => p.category === activeRole);

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">02</span>
            <span>&bull;</span>
            <span>Additional Projects</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Smaller Builds &amp; Experiments
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Specialized engineering utilities, automated scrapers, and
            open-source explorations built with React, FastAPI, and TypeScript.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300">
            <span>Showing {filteredProjects.length} builds</span>
          </span>
        </div>
      </div>

      {/* Row List */}
      <ul className="list-none divide-y divide-white/5 border-t border-white/5">
        {filteredProjects.map((project) => (
          <BuildRow key={project.id} project={project} />
        ))}
      </ul>
    </div>
  );
};

const WrappedSmallerBuilds = SectionWrapper(
  memo(SmallerBuilds),
  "smaller-builds",
);
export default WrappedSmallerBuilds;
