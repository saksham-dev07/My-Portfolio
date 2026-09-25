import {
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Globe,
  Radio,
  Server,
  ShieldCheck,
} from "lucide-react";
import React, { memo, useState } from "react";
import { SectionWrapper } from "../hoc";

const NODES = [
  {
    id: "edge-client",
    name: "Edge Client Tier",
    category: "Frontend & Web Tier",
    host: "Vercel Edge Global CDN",
    specs: [
      "Next.js 14 & React 19",
      "HTTP/3 & Brotli Compression",
      "Sub-15ms Edge Routing",
    ],
    icon: Globe,
    accent: "#38bdf8",
    flow: "Streams user prompts, video frames and canvas strokes with edge hydration and optimistic state caching.",
    services: [
      {
        name: "Next.js Edge Renderer",
        purpose: "Instant SSR & micro-frontend hydration",
      },
      {
        name: "WebSocket Client",
        purpose: "Sub-20ms bidirectional delta sync",
      },
      {
        name: "Local State Cache",
        purpose: "Optimistic UI mutations & indexedDB",
      },
      {
        name: "Client-side Guard",
        purpose: "Sanitization & input boundary validation",
      },
    ],
  },
  {
    id: "api-gateway",
    name: "FastAPI Gateway",
    category: "Microservice Routing & Auth",
    host: "Linux Cloud VM / Docker",
    specs: [
      "FastAPI Async Event Loop",
      "JWT Token Inspection & RBAC",
      "Redis Sliding-Window Rate Limit",
    ],
    icon: Server,
    accent: "#34d399",
    flow: "Authenticates requests, enforces rate limits, validates RBAC tokens, and dispatches tasks to AI workers.",
    services: [
      {
        name: "Uvicorn ASGI Cluster",
        purpose: "High-throughput async request routing",
      },
      {
        name: "RBAC Security Gate",
        purpose: "Role validation (Doctor, Patient, Admin)",
      },
      {
        name: "Rate Limiting Daemon",
        purpose: "Prevents API denial of service",
      },
      {
        name: "CORS & Request Scribe",
        purpose: "Structured JSON logging & telemetry",
      },
    ],
  },
  {
    id: "inference-engine",
    name: "AI Inference Core",
    category: "Neural Computing & Forensics",
    host: "PyTorch & Gemini API Runtime",
    specs: [
      "EfficientNet-B4 Visual Classifier",
      "SyncNet Lip-Audio Alignment",
      "Grad-CAM & SHAP Heatmap Generator",
    ],
    icon: Cpu,
    accent: "#a855f7",
    flow: "Executes deep learning inference across 15 fused forensic detection signals with GPU-accelerated attributions.",
    services: [
      {
        name: "EfficientNet-B4 Core",
        purpose: "Spatial feature & artifact classifier",
      },
      {
        name: "SyncNet Analyzer",
        purpose: "Audio-visual lip-synchronization scoring",
      },
      {
        name: "Grad-CAM Engine",
        purpose: "Visual attribution heatmaps generation",
      },
      {
        name: "Gemini Compiler LLM",
        purpose: "4-stage AST synthesis & medical notes",
      },
    ],
  },
  {
    id: "database-cluster",
    name: "Data & Storage Hub",
    category: "Persistence & Object Storage",
    host: "PostgreSQL & AWS S3 & Appwrite",
    specs: [
      "PostgreSQL Relational DB",
      "AWS S3 Encrypted Storage",
      "Appwrite Real-time CDC Engine",
    ],
    icon: Database,
    accent: "#f59e0b",
    flow: "Persists immutable forensic audit trails, user records, and generated assets with ACID transactional guarantees.",
    services: [
      {
        name: "PostgreSQL Cluster",
        purpose: "ACID transactions & append-only history",
      },
      {
        name: "AWS S3 Bucket",
        purpose: "High-res media & forensic PDF reports",
      },
      {
        name: "Appwrite Realtime Engine",
        purpose: "Instant clinical consultation sync",
      },
      {
        name: "Firebase Auth Store",
        purpose: "Secure identity provider & credential tokens",
      },
    ],
  },
  {
    id: "security-sentinel",
    name: "Sentinel Watchdog",
    category: "Security Forensics & Uptime",
    host: "Automated POSIX Background Daemon",
    specs: [
      "Custom YARA Inspection Rules",
      "PE Header & Entropy Analyzer",
      "60s Synthetic Health Checks",
    ],
    icon: ShieldCheck,
    accent: "#f43f5e",
    flow: "Monitors node liveness, flags anomalous payloads, and records telemetry across all infrastructure endpoints.",
    services: [
      {
        name: "YARA Rule Matcher",
        purpose: "Heuristic binary malware detection",
      },
      {
        name: "PE Structure Inspector",
        purpose: "Section header anomaly & entropy checking",
      },
      {
        name: "Heartbeat Watchdog",
        purpose: "Automated latency checks across all nodes",
      },
      {
        name: "Alert Webhook Dispatcher",
        purpose: "Instant degradation notifications",
      },
    ],
  },
];

const FLOWS = [
  {
    id: "inference",
    label: "Model Inference",
    tag: "Multi-Modal AI Pipeline",
    desc: "Frame vectors streamed from Edge Client -> Authenticated at FastAPI Gateway -> Ingested by PyTorch EfficientNet-B4 & SyncNet for multi-signal fusion.",
    color: "text-purple-400",
    nodes: ["edge-client", "api-gateway", "inference-engine"],
    packetMetric: "42ms roundtrip • 45 fps",
    steps: [
      {
        from: "Edge Client",
        to: "FastAPI Gateway",
        protocol: "HTTP/3 • TLS 1.3",
      },
      {
        from: "FastAPI Gateway",
        to: "AI Inference Core",
        protocol: "Async gRPC (CUDA Worker)",
      },
    ],
  },
  {
    id: "websockets",
    label: "WebSocket Sync",
    tag: "Real-Time Canvas Bus",
    desc: "Bidirectional binary Protobuf CRDT delta broadcast between connected collaborative peers with sub-15ms reconciliation.",
    color: "text-cyan-400",
    nodes: ["edge-client", "api-gateway"],
    packetMetric: "14ms broadcast • 0 conflicts",
    steps: [
      {
        from: "Client Canvas",
        to: "WebSocket Gateway",
        protocol: "WSS Protobuf (Redis PubSub)",
      },
    ],
  },
  {
    id: "database",
    label: "State Persistence",
    tag: "ACID Storage Mesh",
    desc: "Relational mutations committed to PostgreSQL with pooled transactions; media binaries piped to encrypted AWS S3 buckets.",
    color: "text-amber-400",
    nodes: ["api-gateway", "database-cluster"],
    packetMetric: "3.2ms write lock • ACID verified",
    steps: [
      {
        from: "FastAPI Gateway",
        to: "Database Hub",
        protocol: "TCP Pool (PostgreSQL & S3)",
      },
    ],
  },
  {
    id: "telemetry",
    label: "Sentinel Watch",
    tag: "Automated POSIX Daemon",
    desc: "Autonomous background agent executes 60-second heuristic YARA scans, entropy checks, and synthetic ping sweeps across all nodes.",
    color: "text-rose-400",
    nodes: [
      "security-sentinel",
      "edge-client",
      "api-gateway",
      "inference-engine",
      "database-cluster",
    ],
    packetMetric: "60s sweep • 100% clean",
    steps: [
      {
        from: "Sentinel Daemon",
        to: "Active Nodes",
        protocol: "POSIX IPC Ping",
      },
    ],
  },
];

const NODE_METRICS = {
  "edge-client": {
    status: "Healthy • Edge CDN",
    cpu: 14,
    cpuLabel: "14% Edge Compute",
    memory: "184 MB / Vercel Edge",
    traffic: "2.8k req/min",
    ttfb: "14ms TTFB",
    conns: "340 concurrent",
  },
  "api-gateway": {
    status: "Healthy • Uvicorn ASGI",
    cpu: 28,
    cpuLabel: "28% Worker Pool",
    memory: "512 MB / Linux VM",
    traffic: "1,420 req/s",
    ttfb: "8.2ms p99",
    conns: "120 active pools",
  },
  "inference-engine": {
    status: "Operational • PyTorch CUDA",
    cpu: 64,
    cpuLabel: "64% GPU (RTX 4090)",
    memory: "6.4 GB / 24 GB VRAM",
    traffic: "45 frames/s",
    ttfb: "38ms inference",
    conns: "PyTorch 2.4.0 Core",
  },
  "database-cluster": {
    status: "Synchronized • PostgreSQL",
    cpu: 18,
    cpuLabel: "18% I/O Wait",
    memory: "2.1 GB / Buffer Cache",
    traffic: "840 queries/s",
    ttfb: "2.4ms query lock",
    conns: "18/50 pool limit",
  },
  "security-sentinel": {
    status: "Monitoring • Zero Threats",
    cpu: 6,
    cpuLabel: "6% POSIX Daemon",
    memory: "96 MB / Resident",
    traffic: "12 YARA rules active",
    ttfb: "1ms latency ping",
    conns: "0 Flagged Anomalies",
  },
};

const SystemsLab = memo(() => {
  const [selectedNodeId, setSelectedNodeId] = useState("inference-engine");
  const [activeFlow, setActiveFlow] = useState("inference");

  const currentNode = NODES.find((n) => n.id === selectedNodeId) || NODES[2];
  const currentFlow = FLOWS.find((f) => f.id === activeFlow) || FLOWS[0];
  const metrics =
    NODE_METRICS[selectedNodeId] || NODE_METRICS["inference-engine"];

  return (
    <div className="space-y-10" id="systems-lab">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">03</span>
            <span>&bull;</span>
            <span>Architecture &amp; Cloud Lab</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Systems &amp; Inference Lab
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Interactive topology of my distributed AI inference pipeline, async
            API gateway, and cloud storage mesh.
          </p>
        </div>

        {/* Live Operational Status Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono backdrop-blur-md self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <div className="flex flex-col">
            <span className="font-semibold text-white">
              All Systems Operational
            </span>
            <span className="text-[11px] text-emerald-300/80">
              Avg. Latency: 14ms &bull; 99.98% Uptime
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Node Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Topology Mesh (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Topology Canvas Container */}
          <div className="relative p-4 sm:p-7 rounded-3xl bg-zinc-900/70 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Ambient background grid */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#38bdf8 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Protocol Flow Control Switcher */}
            <div className="relative z-10 space-y-3 pb-5 border-b border-white/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider">
                  Active Protocol Flow:
                </span>
                <span className="text-cyan-400 font-bold">
                  {currentFlow.tag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FLOWS.map((f) => {
                  const isActive = activeFlow === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFlow(f.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer truncate ${
                        isActive
                          ? "bg-white/15 border-white/30 text-white font-bold shadow-md ring-1 ring-white/20"
                          : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className={f.color}>&bull; </span>
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Live Flow Pipeline Banner with Packet Animation */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Radio size={12} className="text-cyan-400 animate-pulse" />
                    <span className="font-semibold">Pipeline Data Stream:</span>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    {currentFlow.packetMetric}
                  </span>
                </div>

                {/* Animated Pipeline Path */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto py-1">
                  {currentFlow.nodes.map((nodeId, idx) => {
                    const node = NODES.find((n) => n.id === nodeId);
                    const isLast = idx === currentFlow.nodes.length - 1;
                    return (
                      <React.Fragment key={nodeId}>
                        <span
                          onClick={() => setSelectedNodeId(nodeId)}
                          className={`px-2 py-0.5 rounded cursor-pointer whitespace-nowrap transition-colors ${
                            selectedNodeId === nodeId
                              ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                              : "bg-white/5 text-zinc-300 hover:text-white"
                          }`}
                        >
                          Step {idx + 1}: {node?.name.split(" ")[0]}
                        </span>
                        {!isLast && (
                          <span className="text-cyan-400 animate-pulse select-none font-bold">
                            &rarr;
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pt-1 border-t border-white/5">
                  {currentFlow.desc}
                </p>
              </div>
            </div>

            {/* Interactive Node Cards Grid */}
            <div className="relative z-10 space-y-3 pt-5">
              <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Infrastructure Topology ({NODES.length} Nodes):</span>
                <span className="text-cyan-400 text-[11px]">
                  Click node for telemetry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NODES.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isParticipating = currentFlow.nodes.includes(node.id);
                  const stepIndex = currentFlow.nodes.indexOf(node.id);
                  const Icon = node.icon;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`system-node-btn group flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "system-node-selected bg-zinc-800/90 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40"
                          : isParticipating
                            ? "system-node-unselected bg-zinc-950/80 border-white/20 hover:border-white/40 shadow-sm"
                            : "system-node-unselected bg-zinc-950/40 border-white/5 opacity-45 hover:opacity-80"
                      }`}
                    >
                      {/* Active Pipeline Step Badge */}
                      {isParticipating && (
                        <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Step {stepIndex + 1}
                        </span>
                      )}

                      <div
                        className="p-2 rounded-xl border flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${node.accent}15`,
                          borderColor: `${node.accent}30`,
                          color: node.accent,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                          {node.name}
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 truncate">
                          {node.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                          {node.host}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Detailed Telemetry & Runtime Metrics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <article className="p-4 sm:p-7 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Top specular reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Node Telemetry Inspector
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                  {currentNode.name}
                </h3>
              </div>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${currentNode.accent}15`,
                  borderColor: `${currentNode.accent}40`,
                  color: currentNode.accent,
                }}
              >
                {React.createElement(currentNode.icon, { size: 20 })}
              </div>
            </div>

            {/* Live Runtime Telemetry Dials */}
            <div className="py-3 border-b border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="uppercase">Runtime Load &amp; Health:</span>
                <span className="text-emerald-400 font-bold">
                  {metrics.status}
                </span>
              </div>

              {/* Progress Meters */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Gauge size={11} className="text-cyan-400" />
                    Compute Utilization:
                  </span>
                  <span className="text-zinc-200 font-bold">
                    {metrics.cpuLabel}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.cpu}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-500 block">Memory / Heap:</span>
                  <span className="text-zinc-200 font-bold truncate block">
                    {metrics.memory}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-500 block">p99 Latency:</span>
                  <span className="text-cyan-300 font-bold block">
                    {metrics.ttfb}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-500 block">Throughput:</span>
                  <span className="text-purple-300 font-bold block">
                    {metrics.traffic}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-500 block">Connections:</span>
                  <span className="text-emerald-300 font-bold block truncate">
                    {metrics.conns}
                  </span>
                </div>
              </div>
            </div>

            {/* Node Flow Description */}
            <p className="text-xs text-zinc-300 leading-relaxed font-normal py-3 border-b border-white/10">
              {currentNode.flow}
            </p>

            {/* Hardware / Runtime Specifications */}
            <div className="py-3 border-b border-white/10 space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-zinc-400">
                Runtime Stack:
              </span>
              <ul className="space-y-1 text-xs font-mono text-zinc-300">
                {currentNode.specs.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2
                      size={12}
                      className="text-emerald-400 shrink-0"
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Services / Containers List */}
            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-mono uppercase text-zinc-400 flex items-center justify-between">
                <span>Active Daemons / Services</span>
                <span className="text-cyan-400">4 healthy</span>
              </span>
              <ul className="space-y-1.5">
                {currentNode.services.map((svc, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{svc.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {svc.purpose}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
});

SystemsLab.displayName = "SystemsLab";

const WrappedSystemsLab = SectionWrapper(memo(SystemsLab), "systems-lab");
export default WrappedSystemsLab;
