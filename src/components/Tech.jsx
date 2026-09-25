import { motion as Motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Cpu,
  Database,
  Globe,
  Layers,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import React, { memo, useState } from "react";
import {
  AppwriteIcon,
  AwsIcon,
  CIcon,
  CppIcon,
  DockerIcon,
  ExpressIcon,
  FastapiIcon,
  FirebaseIcon,
  FlaskIcon,
  GcpIcon,
  GitIcon,
  JavaIcon,
  JsIcon,
  LinuxIcon,
  MongoIcon,
  MysqlIcon,
  NextIcon,
  NodeIcon,
  OpencvIcon,
  PostgresIcon,
  PostmanIcon,
  PythonIcon,
  PytorchIcon,
  ReactIcon,
  ReduxIcon,
  ScikitlearnIcon,
  TailwindIcon,
  TensorflowIcon,
  ThreeIcon,
  TsIcon,
  VercelIcon,
} from "../assets/techIcons";
import { SectionWrapper } from "../hoc";
import PhysicsSandbox from "./interactive/PhysicsSandbox";

const BENTO_GROUPS = [
  {
    id: "ai",
    title: "Applied AI & Machine Learning",
    description:
      "Multi-modal forensic neural nets, computer vision and LLM compiler pipelines.",
    accent: "text-purple-400",
    borderGlow:
      "hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    icon: BrainCircuit,
    gridClass: "col-span-12 lg:col-span-6",
    tools: [
      { name: "PyTorch", icon: PytorchIcon },
      { name: "TensorFlow", icon: TensorflowIcon },
      { name: "OpenCV", icon: OpencvIcon },
      { name: "scikit-learn", icon: ScikitlearnIcon },
      { name: "Gemini API", icon: Sparkles },
      { name: "Python", icon: PythonIcon },
      { name: "Grad-CAM & XAI", icon: Cpu },
      { name: "Tesseract OCR", icon: Terminal },
    ],
  },
  {
    id: "backend",
    title: "Backend & Distributed Systems",
    description:
      "High-throughput async APIs, relational schemas, auth and persistent queues.",
    accent: "text-emerald-400",
    borderGlow:
      "hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]",
    icon: Server,
    gridClass: "col-span-12 lg:col-span-6",
    tools: [
      { name: "FastAPI", icon: FastapiIcon },
      { name: "Python", icon: PythonIcon },
      { name: "Node.js", icon: NodeIcon },
      { name: "Express.js", icon: ExpressIcon },
      { name: "Flask", icon: FlaskIcon },
      { name: "PostgreSQL", icon: PostgresIcon },
      { name: "MongoDB", icon: MongoIcon },
      { name: "Appwrite", icon: AppwriteIcon },
      { name: "Firebase", icon: FirebaseIcon },
      { name: "WebSockets", icon: Activity },
    ],
  },
  {
    id: "frontend",
    title: "Frontend & Creative Web",
    description:
      "Reactive component architecture, WebGL 3D graphics and canvas engines.",
    accent: "text-cyan-400",
    borderGlow:
      "hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    icon: Globe,
    gridClass: "col-span-12 lg:col-span-6",
    tools: [
      { name: "React.js", icon: ReactIcon },
      { name: "Next.js", icon: NextIcon },
      { name: "TypeScript", icon: TsIcon },
      { name: "JavaScript", icon: JsIcon },
      { name: "Tailwind CSS", icon: TailwindIcon },
      { name: "Three.js", icon: ThreeIcon },
      { name: "Canvas API", icon: Layers },
      { name: "Redux Toolkit", icon: ReduxIcon },
    ],
  },
  {
    id: "cloud-devops",
    title: "Cloud Architecture & Security",
    description:
      "AWS certified foundations, containerized workflows and PE forensics.",
    accent: "text-amber-400",
    borderGlow:
      "hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    icon: ShieldCheck,
    gridClass: "col-span-12 lg:col-span-6",
    tools: [
      { name: "AWS Certified AI", icon: AwsIcon },
      { name: "AWS Certified Cloud", icon: AwsIcon },
      { name: "Docker", icon: DockerIcon },
      { name: "Linux / POSIX", icon: LinuxIcon },
      { name: "Google Cloud", icon: GcpIcon },
      { name: "Git & GitHub", icon: GitIcon },
      { name: "Vercel", icon: VercelIcon },
      { name: "Postman", icon: PostmanIcon },
      { name: "YARA Forensics", icon: ShieldCheck },
    ],
  },
];

const Tech = memo(() => {
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  return (
    <div className="space-y-10" id="skills">
      {/* Section Header (abhyudaytomar.com Bento inspiration) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">04</span>
            <span>&bull;</span>
            <span>Technical Toolkit</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            What I Work With
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Core programming languages, machine learning frameworks, async web
            backends, and cloud tools I use to build scalable systems.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsSandboxOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Launch interactive physics sandbox for tech badges"
          >
            <Zap
              size={12}
              className="text-cyan-400 group-hover:scale-110 transition-transform"
            />
            <span>Break Gravity</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
            <Sparkles size={12} />
            <span className="hidden sm:inline">
              35+ Production Technologies
            </span>
            <span className="sm:hidden">35+ Tech</span>
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {BENTO_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <article
              key={group.id}
              className={`${group.gridClass} p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-white/10 ${group.borderGlow} backdrop-blur-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
            >
              {/* Top specular reflection */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              <div>
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-xl bg-white/[0.04] border border-white/10 ${group.accent}`}
                  >
                    <GroupIcon size={18} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {group.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 mb-6 font-normal">
                  {group.description}
                </p>

                {/* Tool Pills */}
                <ul className="flex flex-wrap gap-2.5 list-none">
                  {group.tools.map((tool, idx) => {
                    const Icon = tool.icon;
                    return (
                      <li
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-default"
                      >
                        <span className="w-3.5 h-3.5 flex items-center justify-center opacity-85">
                          {typeof Icon === "function" ? (
                            <Icon className="w-full h-full object-contain" />
                          ) : (
                            <Icon size={14} />
                          )}
                        </span>
                        <span>{tool.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      {/* Coursework & Systems Fundamentals note (abhyudaytomar.com inspiration) */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/10 text-xs font-mono text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400 shrink-0" />
          <span>
            Core Coursework: Data Structures &amp; Algorithms (Java), C/C++,
            Database Systems (DBMS), Operating Systems &amp; Computer Networks.
          </span>
        </div>
        <span className="text-zinc-500 text-[11px] whitespace-nowrap">
          VIT Bhopal University
        </span>
      </div>

      {/* Interactive Physics Sandbox Modal */}
      <PhysicsSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
});

const WrappedTech = SectionWrapper(memo(Tech), "skills");
export default WrappedTech;
