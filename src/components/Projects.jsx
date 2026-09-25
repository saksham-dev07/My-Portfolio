import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  Eraser,
  ExternalLink,
  FileCode,
  Github,
  Layers,
  PenTool,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { projects } from "../constants";
import { useRole } from "../context/RoleContext";
import { SectionWrapper } from "../hoc";

// Interactive Widget for Deepfake Forensics & Explainable AI (Grad-CAM)
const DeepfakeVisual = memo(({ image }) => {
  const [mode, setMode] = useState("gradcam"); // "raw" | "gradcam" | "signals"
  const [camBlend, setCamBlend] = useState(85); // 0 to 100%
  const [selectedLayer, setSelectedLayer] = useState("conv_head"); // "conv_head" | "block6a"

  // Layer-specific spatial attribution configurations
  const layerConfig =
    selectedLayer === "conv_head"
      ? {
          cx: "50%",
          cy: "66%",
          r: "34%",
          ellipseCx: 100,
          ellipseCy: 158,
          rx: 54,
          ry: 34,
          boxX: 42,
          boxY: 132,
          boxW: 116,
          boxH: 54,
          tagX: 44,
          tagY: 134,
          tagText: "BLEND_SEAM: 0.942",
          textX: 47,
          textY: 142.5,
          target: "Target: Perioral Seam (conv_head)",
        }
      : {
          cx: "38%",
          cy: "52%",
          r: "28%",
          ellipseCx: 76,
          ellipseCy: 125,
          rx: 38,
          ry: 46,
          boxX: 46,
          boxY: 96,
          boxW: 58,
          boxH: 60,
          tagX: 48,
          tagY: 98,
          tagText: "FREQ_RES: 0.871",
          textX: 51,
          textY: 106.5,
          target: "Target: Lateral Seam (block6a)",
        };

  return (
    <div className="deepfake-card w-full flex flex-col rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-2xl">
      {/* Widget Header */}
      <div className="deepfake-header flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 text-zinc-300 font-mono min-w-0 shrink-0">
          <Activity size={14} className="text-cyan-400 shrink-0" />
          <span className="hidden sm:inline truncate">
            Forensic Inspector &bull; Live Telemetry
          </span>
          <span className="sm:hidden truncate">XAI Inspector</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMode("raw")}
            className={`deepfake-tab-btn px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "raw"
                ? "bg-white/20 text-white font-semibold deepfake-tab-active"
                : "text-zinc-400 hover:text-zinc-200 deepfake-tab-inactive"
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setMode("gradcam")}
            className={`deepfake-tab-btn px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "gradcam"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm deepfake-tab-active"
                : "text-zinc-400 hover:text-zinc-200 deepfake-tab-inactive"
            }`}
          >
            Grad-CAM
          </button>
          <button
            onClick={() => setMode("signals")}
            className={`deepfake-tab-btn px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "signals"
                ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40 shadow-sm deepfake-tab-active"
                : "text-zinc-400 hover:text-zinc-200 deepfake-tab-inactive"
            }`}
          >
            Signals
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative aspect-[1024/466] bg-zinc-900/60 overflow-hidden flex items-center justify-center p-2.5 sm:p-3">
        {mode === "raw" && (
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
            <img
              src={image}
              alt="Deep Forensics studio dashboard preview"
              className="w-full h-full object-cover object-top"
            />
          </div>
        )}

        {mode === "gradcam" && (
          <div className="deepfake-inner-card w-full h-full rounded-xl overflow-hidden border border-white/10 bg-zinc-950 p-2.5 sm:p-3 flex flex-col justify-between font-mono">
            {/* Top XAI Sample Bar */}
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] text-zinc-400">
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="text-zinc-200 font-semibold">
                  SAMPLE #0418:
                </span>
                <span className="truncate">
                  Synthesized Face-Swap (Frame 142)
                </span>
              </div>
              <span className="deepfake-anomaly-badge px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-bold shrink-0">
                88.4% ANOMALY
              </span>
            </div>

            {/* Split Inspection View: Biometric Mesh + Localized Anomaly Heatmap (Left) & Layer Telemetry (Right) */}
            <div className="grid grid-cols-12 gap-3 items-center py-1 flex-1 min-h-0">
              {/* Left Column: Biometric Saliency Viewport */}
              <div className="deepfake-face-viewport col-span-6 relative h-full flex items-center justify-center bg-zinc-900/50 rounded-lg border border-white/10 overflow-hidden">
                {/* Crosshair reticles */}
                <span className="absolute top-1 left-1.5 text-[8px] text-cyan-400/40 select-none">
                  +
                </span>
                <span className="absolute top-1 right-1.5 text-[8px] text-cyan-400/40 select-none">
                  +
                </span>
                <span className="absolute bottom-1 left-1.5 text-[8px] text-cyan-400/40 select-none">
                  +
                </span>
                <span className="absolute bottom-1 right-1.5 text-[8px] text-cyan-400/40 select-none">
                  +
                </span>

                {/* Biometric Face Wireframe & Localized Heatmap SVG */}
                <svg
                  className="w-full h-full max-h-[160px]"
                  viewBox="0 0 200 240"
                  fill="none"
                >
                  <defs>
                    <radialGradient
                      id="infernoGrad"
                      cx={layerConfig.cx}
                      cy={layerConfig.cy}
                      r={layerConfig.r}
                    >
                      <stop
                        offset="0%"
                        stopColor="#fef08a"
                        stopOpacity={0.94 * (camBlend / 100)}
                      />
                      <stop
                        offset="30%"
                        stopColor="#f97316"
                        stopOpacity={0.84 * (camBlend / 100)}
                      />
                      <stop
                        offset="60%"
                        stopColor="#c026d3"
                        stopOpacity={0.62 * (camBlend / 100)}
                      />
                      <stop
                        offset="85%"
                        stopColor="#3b0764"
                        stopOpacity={0.32 * (camBlend / 100)}
                      />
                      <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Facial Contour & Landmarks */}
                  <ellipse
                    cx="100"
                    cy="115"
                    rx="54"
                    ry="74"
                    stroke="#27272a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 65 84 Q 80 80 92 85"
                    stroke="#3f3f46"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 108 85 Q 120 80 135 84"
                    stroke="#3f3f46"
                    strokeWidth="1.5"
                  />

                  {/* Eyes & Gaze Tracking */}
                  <ellipse
                    cx="78"
                    cy="95"
                    rx="10"
                    ry="5"
                    stroke="#52525b"
                    strokeWidth="1.2"
                  />
                  <circle cx="78" cy="95" r="2.5" fill="#22d3ee" />
                  <ellipse
                    cx="122"
                    cy="95"
                    rx="10"
                    ry="5"
                    stroke="#52525b"
                    strokeWidth="1.2"
                  />
                  <circle cx="122" cy="95" r="2.5" fill="#22d3ee" />

                  {/* Nose Bridge */}
                  <path
                    d="M 100 95 L 98 122 L 94 127 L 106 127 L 102 122"
                    stroke="#52525b"
                    strokeWidth="1.2"
                  />

                  {/* Synthesized Mouth & Jaw Region */}
                  <path
                    d="M 76 150 Q 100 144 124 150 Q 100 162 76 150 Z"
                    stroke="#71717a"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="76"
                    y1="150"
                    x2="124"
                    y2="150"
                    stroke="#71717a"
                    strokeWidth="1"
                  />
                  <path
                    d="M 50 115 Q 60 170 100 188 Q 140 170 150 115"
                    stroke="#3f3f46"
                    strokeWidth="1.5"
                  />

                  {/* Triangulation Mesh */}
                  <path
                    d="M 78 95 L 100 127 L 122 95 M 94 127 L 76 150 M 106 127 L 124 150 M 76 150 L 100 188 L 124 150"
                    stroke="#3f3f46"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                    opacity="0.6"
                  />

                  {/* Key Tracking Points */}
                  <circle
                    cx="65"
                    cy="84"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />
                  <circle
                    cx="135"
                    cy="84"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />
                  <circle
                    cx="100"
                    cy="127"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />
                  <circle
                    cx="76"
                    cy="150"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />
                  <circle
                    cx="124"
                    cy="150"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />
                  <circle
                    cx="100"
                    cy="188"
                    r="1.5"
                    fill="#22d3ee"
                    opacity="0.7"
                  />

                  {/* Localized Grad-CAM Inferno Heatmap dynamically placed by layer */}
                  <ellipse
                    cx={layerConfig.ellipseCx}
                    cy={layerConfig.ellipseCy}
                    rx={layerConfig.rx}
                    ry={layerConfig.ry}
                    fill="url(#infernoGrad)"
                    className="deepfake-heatmap-ellipse"
                  />

                  {/* Anomaly Detection Bounding Box dynamically placed */}
                  <rect
                    x={layerConfig.boxX}
                    y={layerConfig.boxY}
                    width={layerConfig.boxW}
                    height={layerConfig.boxH}
                    rx="4"
                    fill="rgba(239, 68, 68, 0.08)"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                  <rect
                    x={layerConfig.tagX}
                    y={layerConfig.tagY}
                    width={layerConfig.boxW - 4}
                    height="12"
                    rx="2"
                    fill="#ef4444"
                  />
                  <text
                    x={layerConfig.textX}
                    y={layerConfig.textY}
                    fill="#09090b"
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {layerConfig.tagText}
                  </text>
                </svg>

                {/* Subtitle tag */}
                <div className="deepfake-target-label absolute bottom-1 left-2 text-[8px] text-zinc-500 font-mono">
                  {layerConfig.target}
                </div>
              </div>

              {/* Right Column: Layer Attribution & Telemetry Controls */}
              <div className="col-span-6 flex flex-col justify-between h-full space-y-1.5 text-[11px]">
                {/* Layer Selector */}
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Conv Layer Focus:</span>
                    <span className="text-cyan-400 font-bold">
                      {selectedLayer === "conv_head"
                        ? "512 × 7 × 7"
                        : "192 × 14 × 14"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedLayer("conv_head")}
                      className={`deepfake-layer-btn px-1.5 py-1 rounded text-[10px] border transition-colors cursor-pointer truncate ${
                        selectedLayer === "conv_head"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold active"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200"
                      }`}
                    >
                      conv_head
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLayer("block6a")}
                      className={`deepfake-layer-btn px-1.5 py-1 rounded text-[10px] border transition-colors cursor-pointer truncate ${
                        selectedLayer === "block6a"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold active"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200"
                      }`}
                    >
                      block6a_se
                    </button>
                  </div>
                </div>

                {/* Attribution Metrics */}
                <div className="deepfake-metrics-box space-y-1 text-[10px] bg-zinc-900/60 p-1.5 rounded-lg border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      &part;Y_fake / &part;A_k:
                    </span>
                    <span className="text-amber-400 font-bold">
                      {selectedLayer === "conv_head" ? "+0.942" : "+0.871"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Artifact Type:</span>
                    <span className="text-red-400 font-bold">
                      {selectedLayer === "conv_head"
                        ? "Perioral Seam"
                        : "Freq Residual"}
                    </span>
                  </div>
                </div>

                {/* Heatmap Blend Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Heatmap Opacity:</span>
                    <span className="text-cyan-300 font-bold">{camBlend}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    value={camBlend}
                    onChange={(e) => setCamBlend(Number(e.target.value))}
                    className="deepfake-opacity-slider w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    aria-label="Adjust Grad-CAM Heatmap Opacity"
                  />
                </div>

                {/* Colormap Legend */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[8px] text-zinc-500 shrink-0">
                    0.0 (Authentic)
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-zinc-900 via-purple-700 via-red-500 to-yellow-300 border border-white/10" />
                  <span className="text-[8px] text-amber-400 font-bold shrink-0">
                    1.0 (Anomaly)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "signals" && (
          <div className="w-full h-full flex flex-col justify-center p-4 bg-zinc-950 font-mono text-xs space-y-2.5">
            <div className="flex justify-between text-zinc-400 whitespace-nowrap gap-2">
              <span className="truncate">
                EfficientNet-B4 Spatial Confidence:
              </span>
              <span className="text-emerald-400 font-semibold shrink-0">
                96.8% Authenticated
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[96.8%]" />
            </div>

            <div className="flex justify-between text-zinc-400 pt-1 whitespace-nowrap gap-2">
              <span className="truncate">SyncNet Lip-Audio Synchrony:</span>
              <span className="text-cyan-400 font-semibold shrink-0">
                0.984 Cosine Sim
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-[98.4%]" />
            </div>

            <div className="flex justify-between text-zinc-400 pt-1 whitespace-nowrap gap-2">
              <span className="truncate">FFT High-Frequency Residuals:</span>
              <span className="text-purple-400 font-semibold shrink-0">
                &lt; 0.012 (No GAN Grid)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full w-[94%]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
DeepfakeVisual.displayName = "DeepfakeVisual";

// Interactive Widget for NL App Compiler (Generative AI Pipeline)
const COMPILER_PRESETS = [
  {
    id: "invoicing",
    name: "SaaS Invoicing",
    prompt:
      "Invoice tracker with client management, Prisma models, and React cards",
    stages: [
      {
        stage: 1,
        name: "1. Intent AST",
        desc: "Lexical & Semantic AST Token Extraction",
        content: `// Stage 1: Parsed Intent AST from Natural Language Prompt
{
  "entity": "InvoiceManagementApp",
  "auth": { "roles": ["admin", "client"], "provider": "NextAuth" },
  "models": ["Client", "Invoice", "PaymentRecord"],
  "relations": { 
    "Client.hasMany": "Invoice",
    "Invoice.hasOne": "PaymentRecord"
  },
  "telemetry": { "auditLog": true, "realtimeSync": true }
}`,
      },
      {
        stage: 2,
        name: "2. Schema Gen",
        desc: "Relational Schema & Migration Synthesis",
        content: `// Stage 2: Synthesized PostgreSQL / Prisma Relational Schema
model Client {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  invoices  Invoice[]
  createdAt DateTime  @default(now())
}

model Invoice {
  id        String        @id @default(cuid())
  client    Client        @relation(fields: [clientId], references: [id])
  clientId  String
  amount    Float
  status    InvoiceStatus @default(PENDING)
  createdAt DateTime      @default(now())
}`,
      },
      {
        stage: 3,
        name: "3. UI Tree",
        desc: "Type-Safe Component Hierarchy Generator",
        content: `// Stage 3: Synthesized React 19 / TypeScript Component Tree
export const InvoiceFeed = ({ invoices, onPay }: InvoiceFeedProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {invoices.map((inv) => (
        <InvoiceCard 
          key={inv.id} 
          invoice={inv} 
          onPay={() => onPay(inv.id)} 
        />
      ))}
    </div>
  );
};`,
      },
      {
        stage: 4,
        name: "4. Verified Output",
        desc: "Multi-Pass AST Verification & Emit",
        content: `// Stage 4: Cross-Layer Verification & AST Emit
[✓] TypeScript Strict: 0 Type Errors
[✓] Schema Consistency: Client.id <-> Invoice.clientId Validated
[✓] Target Framework: Next.js 14 App Router + Tailwind CSS
[✓] Generated Artifacts:
    ├── app/invoices/page.tsx (React 19 Server Component)
    ├── prisma/schema.prisma (PostgreSQL Engine)
    └── app/api/invoices/route.ts (Edge API Handler)
// Total Compilation Time: 420ms • AST Depth: 4 • 0 Syntax Errors`,
      },
    ],
  },
  {
    id: "canvas",
    name: "CRDT Whiteboard",
    prompt:
      "Collaborative whiteboard with CRDT sync, WebSocket bus, and peer presence",
    stages: [
      {
        stage: 1,
        name: "1. Intent AST",
        desc: "Lexical & Semantic AST Token Extraction",
        content: `// Stage 1: Parsed Intent AST from Natural Language Prompt
{
  "entity": "NexusCanvasApp",
  "engine": { "protocol": "CRDT-LWW", "transport": "WebSocket" },
  "models": ["CanvasBoard", "StrokeDelta", "PeerCursor"],
  "sync": { "conflictResolution": "LastWriteWins", "batchMs": 15 },
  "security": { "roomIsolation": true, "maxPeers": 32 }
}`,
      },
      {
        stage: 2,
        name: "2. Schema Gen",
        desc: "Relational Schema & Migration Synthesis",
        content: `// Stage 2: Synthesized PostgreSQL / Prisma Relational Schema
model CanvasBoard {
  id          String        @id @default(uuid())
  title       String
  crdtState   Bytes         // Binary LWW-Element-Set vector
  version     Int           @default(1)
  strokes     StrokeDelta[]
  updatedAt   DateTime      @updatedAt
}

model StrokeDelta {
  id          String       @id @default(uuid())
  boardId     String
  peerId      String
  lamportClock BigInt
  payloadJson Json
}`,
      },
      {
        stage: 3,
        name: "3. UI Tree",
        desc: "Type-Safe Component Hierarchy Generator",
        content: `// Stage 3: Synthesized React 19 / TypeScript Component Tree
export const CollaborativeCanvas = ({ boardId, peers }: CanvasProps) => {
  const { strokes, emitStroke } = useCRDTSync(boardId);
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <CanvasViewport strokes={strokes} onDraw={emitStroke} />
      {peers.map((peer) => (
        <PeerCursor key={peer.id} x={peer.x} y={peer.y} name={peer.name} />
      ))}
    </div>
  );
};`,
      },
      {
        stage: 4,
        name: "4. Verified Output",
        desc: "Multi-Pass AST Verification & Emit",
        content: `// Stage 4: Cross-Layer Verification & AST Emit
[✓] CRDT Convergence: Commutative & Idempotent Delta verified
[✓] WebSocket Wire Contract: Typed binary message protocol (Protobuf)
[✓] Latency Target: Sub-20ms broadcast verified across 3 regional nodes
[✓] Generated Artifacts:
    ├── hooks/useCRDTSync.ts (LWW-Element-Set Hook)
    ├── server/ws-gateway.ts (High-Throughput Node WS Handler)
    └── components/CanvasViewport.tsx (HTML5 Canvas Engine)
// Total Compilation Time: 380ms • AST Depth: 3 • 0 Convergence Conflicts`,
      },
    ],
  },
  {
    id: "scribe",
    name: "Clinical Scribe",
    prompt:
      "Doctor consultation scribe with ambient audio speech-to-SOAP and HIPAA encryption",
    stages: [
      {
        stage: 1,
        name: "1. Intent AST",
        desc: "Lexical & Semantic AST Token Extraction",
        content: `// Stage 1: Parsed Intent AST from Natural Language Prompt
{
  "entity": "DocPilotConsultation",
  "audioStream": { "sampleRate": 16000, "codec": "Opus", "vad": true },
  "nlpExtractor": { "model": "Gemini-Medical-Scribe", "schema": "SOAP" },
  "compliance": { "hipaaPhiMasking": true, "encryption": "AES-256" }
}`,
      },
      {
        stage: 2,
        name: "2. Schema Gen",
        desc: "Relational Schema & Migration Synthesis",
        content: `// Stage 2: Synthesized PostgreSQL / Prisma Relational Schema
model Consultation {
  id            String    @id @default(cuid())
  doctorId      String
  patientId     String
  audioHash     String
  soapSubjective String    // Encrypted PHI field
  soapObjective  String    // Encrypted PHI field
  soapAssessment String
  soapPlan       String
  verifiedAt    DateTime?
}`,
      },
      {
        stage: 3,
        name: "3. UI Tree",
        desc: "Type-Safe Component Hierarchy Generator",
        content: `// Stage 3: Synthesized React 19 / TypeScript Component Tree
export const ScribeSession = ({ consultId }: ScribeProps) => {
  const { soapNote, audioActive } = useMedicalScribe(consultId);
  return (
    <div className="grid grid-cols-12 gap-4">
      <AudioTelemetryPanel isActive={audioActive} sampleRate="16kHz" />
      <SOAPNoteEditor note={soapNote} onDoctorSign={handleSign} />
    </div>
  );
};`,
      },
      {
        stage: 4,
        name: "4. Verified Output",
        desc: "Multi-Pass AST Verification & Emit",
        content: `// Stage 4: Cross-Layer Verification & AST Emit
[✓] HIPAA PHI Masking: 100% Identifiers tokenized before LLM inference
[✓] ICD-10 Coding Consistency: Validated against WHO standard library
[✓] Encryption at Rest: AES-256-GCM cipher verification passed
[✓] Generated Artifacts:
    ├── app/consultations/[id]/soap/page.tsx (Clinical Interface)
    ├── lib/gemini-scribe.ts (Ambient AI Scribe Pipeline)
    └── prisma/migrations/2026_hipaa_phi_vault.sql
// Total Compilation Time: 495ms • AST Depth: 5 • 0 PHI Leaks`,
      },
    ],
  },
];

const NLCompilerVisual = memo(() => {
  const [activePreset, setActivePreset] = useState("invoicing");
  const [activeStage, setActiveStage] = useState(1);

  const preset =
    COMPILER_PRESETS.find((p) => p.id === activePreset) || COMPILER_PRESETS[0];
  const currentStage =
    preset.stages.find((s) => s.stage === activeStage) || preset.stages[0];

  return (
    <div className="nl-compiler-card w-full flex flex-col rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="nl-compiler-header flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs gap-2">
        <div className="flex items-center gap-2 text-zinc-300 font-mono min-w-0">
          <Cpu size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate">LLM Compiler &bull; 4-Pass Pipeline</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto">
          {preset.stages.map((s) => (
            <button
              key={s.stage}
              onClick={() => setActiveStage(s.stage)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeStage === s.stage
                  ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm nl-tab-active"
                  : "text-zinc-400 hover:text-zinc-200 nl-tab-inactive"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Selector Banner */}
      <div className="nl-compiler-subbar px-3.5 sm:px-4 py-2 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase">
            Input Prompt:
          </span>
          {COMPILER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                activePreset === p.id
                  ? "bg-emerald-400 text-zinc-950 font-bold shadow-sm nl-prompt-active"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5 nl-prompt-inactive"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <span className="nl-syntax-pill text-[10px] font-mono text-emerald-400 hidden md:inline">
          &bull; 0 Syntax Errors
        </span>
      </div>

      {/* Input Prompt Display */}
      <div className="nl-compiler-synthesis px-3.5 sm:px-4 py-1.5 bg-zinc-900/40 border-b border-white/5 text-[10px] font-mono text-zinc-400 truncate">
        <strong className="nl-synthesis-label text-emerald-300">
          SYNTHESIS:
        </strong>{" "}
        &ldquo;{preset.prompt}&rdquo;
      </div>

      {/* Code Inspector */}
      <div className="nl-compiler-code-box p-3.5 sm:p-4 bg-zinc-950 overflow-x-auto text-xs font-mono leading-relaxed max-h-56">
        <pre className="text-zinc-300 m-0 p-0 bg-transparent">
          <code>{currentStage.content}</code>
        </pre>
      </div>
    </div>
  );
});
NLCompilerVisual.displayName = "NLCompilerVisual";

// Interactive Widget for DocPilot (Clinical Platform & Gemini Medical Scribe)
const ENCOUNTERS = {
  eleanor: {
    patient: "Eleanor Vance (#PT-8821)",
    encounter: "#4092",
    doctor: "Dr. Aris Thorne, MD",
    audioQuality: "16kHz • 98.6% SNR",
    soap: {
      s: "34yo reports 4-day rhinorrhea, sneezing, allergic rhinitis. Denies fever or cough.",
      o: "BP: 118/76 | HR: 68 | SpO2: 99% | Oropharynx: clear. Turbinates swollen.",
      a: "Acute seasonal allergic rhinitis (ICD-10: J30.9). Stable.",
      p: "Cetirizine 10mg PO qPM prn; saline nasal rinse. Follow-up 14d.",
    },
    patientSummary:
      "You were evaluated for seasonal allergies. Your vitals are healthy. Start Cetirizine 10mg once daily in the evening.",
    rx: "Cetirizine 10mg (30-day supply)",
  },
  marcus: {
    patient: "Marcus Chen (#PT-5519)",
    encounter: "#4093",
    doctor: "Dr. Aris Thorne, MD",
    audioQuality: "16kHz • 99.1% SNR",
    soap: {
      s: "52yo routine review. Occasional tension headaches; compliance with DASH diet.",
      o: "BP: 138/88 (elevated) | HR: 74 | BMI: 27.2 | Labs: eGFR > 90, K+ normal.",
      a: "Essential Primary Hypertension, Stage 1 (ICD-10: I10).",
      p: "Initiate Amlodipine 5mg PO daily. Home BP log twice daily. Repeat chem panel in 4w.",
    },
    patientSummary:
      "Blood pressure is mildly elevated at 138/88. Starting low-dose Amlodipine 5mg once daily. Track BP at home twice a day.",
    rx: "Amlodipine 5mg (90-day supply with refills)",
  },
};

const DocPilotVisual = memo(() => {
  const [activeTab, setActiveTab] = useState("doctor"); // "doctor" | "patient" | "security"
  const [activePatient, setActivePatient] = useState("eleanor");
  const [isDictating, setIsDictating] = useState(true);

  const enc = ENCOUNTERS[activePatient];

  return (
    <div className="w-full flex flex-col rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs gap-2">
        <div className="flex items-center gap-2 text-zinc-300 font-mono min-w-0">
          <ShieldCheck size={14} className="text-blue-400 shrink-0" />
          <span className="truncate">
            DocPilot &bull; Role-Based Healthcare
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("doctor")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "doctor"
                ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Doctor Scribe
          </button>
          <button
            onClick={() => setActiveTab("patient")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "patient"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "security"
                ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            RBAC &amp; HIPAA
          </button>
        </div>
      </div>

      {/* Patient Selector Sub-header */}
      <div className="px-3.5 sm:px-4 py-1.5 bg-zinc-900/70 border-b border-white/5 flex items-center justify-between text-[10px] font-mono gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Case:</span>
          <button
            onClick={() => setActivePatient("eleanor")}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              activePatient === "eleanor"
                ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Eleanor (Rhinitis)
          </button>
          <button
            onClick={() => setActivePatient("marcus")}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              activePatient === "marcus"
                ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Marcus (Hypertension)
          </button>
        </div>

        <button
          onClick={() => setIsDictating(!isDictating)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer ${
            isDictating
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-zinc-500"
          }`}
          title="Toggle Ambient Audio Dictation Simulator"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isDictating ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}
          />
          <span>
            {isDictating ? "Ambient Stream: Active" : "Stream: Paused"}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3.5 sm:p-4 bg-zinc-950 font-mono text-xs leading-relaxed space-y-3">
        {activeTab === "doctor" && (
          <div className="space-y-2.5">
            {/* Encounter Metadata Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-zinc-400">
              <span className="truncate">
                Patient: {enc.patient} &bull; Encounter {enc.encounter}
              </span>
              <span className="text-cyan-400 font-mono shrink-0">
                {enc.audioQuality}
              </span>
            </div>

            {/* Structured SOAP Note */}
            <div className="space-y-1.5 text-zinc-300 text-[11px]">
              <div>
                <strong className="text-blue-400">[Subjective]:</strong>{" "}
                {enc.soap.s}
              </div>
              <div>
                <strong className="text-blue-400">[Objective]:</strong>{" "}
                {enc.soap.o}
              </div>
              <div>
                <strong className="text-blue-400">[Assessment]:</strong>{" "}
                {enc.soap.a}
              </div>
              <div>
                <strong className="text-blue-400">[Plan &amp; Rx]:</strong>{" "}
                {enc.soap.p}
              </div>
            </div>

            {/* Validation Badge */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5">
              <span>Gemini Medical Scribe Engine</span>
              <span className="text-cyan-400 font-semibold">
                98.6% Synthesis Confidence
              </span>
            </div>
          </div>
        )}

        {activeTab === "patient" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-zinc-400">
              <span>Care Team: {enc.doctor}</span>
              <span className="text-emerald-400 font-semibold">
                Visit Verified
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/10 space-y-1.5 text-[11px] text-zinc-300">
              <div className="text-emerald-300 font-semibold text-xs">
                Summary for Patient:
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                {enc.patientSummary}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Rx: {enc.rx}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] text-zinc-400">
              <span>Firebase Security Rules &amp; Appwrite RBAC</span>
              <span className="text-purple-400">AES-256 &bull; TLS 1.3</span>
            </div>
            <pre className="text-zinc-300 text-[10px] bg-zinc-900/60 p-2.5 rounded-lg border border-white/10 overflow-x-auto">
              <code>{`match /consultations/{consultId} {
  // Strict PHI boundary: Doctor or Patient only
  allow read: if request.auth.uid in [resource.data.doctorId, resource.data.patientId];
  allow update: if hasRole('doctor') && request.resource.data.diff(resource.data)
      .affectedKeys().hasOnly(['clinicalNotes', 'prescriptions']);
}`}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});
DocPilotVisual.displayName = "DocPilotVisual";

// Interactive Widget for NexusBoard (Collaborative Infinite Canvas Sandbox)
const NexusBoardVisual = memo(() => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#22d3ee"); // cyan
  const [activeTool, setActiveTool] = useState("pen"); // "pen" | "eraser"
  const [peers] = useState(3);
  const [latency] = useState(14);
  const [peer1Pos, setPeer1Pos] = useState({ x: 22, y: 24 });
  const [peer2Pos, setPeer2Pos] = useState({ x: 72, y: 36 });
  const [lamportClock, setLamportClock] = useState(148);
  const [lastOp, setLastOp] = useState("PEER_ACK(clock: 147, source: 'Alex')");

  // Floating peer animation simulating real-time multi-user cursor telemetry
  // Constrained to upper 50% of the canvas to avoid overlapping with bottom toolbar
  useEffect(() => {
    let frameId;
    let t = 0;
    const animatePeers = () => {
      t += 0.02;
      setPeer1Pos({
        x: Math.round(22 + Math.sin(t) * 10 + Math.cos(t * 0.5) * 5),
        y: Math.round(24 + Math.cos(t * 0.8) * 8 + Math.sin(t * 0.3) * 4),
      });
      setPeer2Pos({
        x: Math.round(72 + Math.cos(t * 0.7) * 8 + Math.sin(t * 0.4) * 4),
        y: Math.round(36 + Math.sin(t * 0.9) * 8 + Math.cos(t * 0.2) * 4),
      });
      frameId = requestAnimationFrame(animatePeers);
    };
    frameId = requestAnimationFrame(animatePeers);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Pre-drawn collaborative diagram
  const drawSampleDiagram = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Helper to draw rounded rect
    const drawNode = (x, y, w, h, label, sub, color) => {
      ctx.save();
      ctx.fillStyle = "rgba(18, 18, 24, 0.95)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, 8);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, y + 18);

      // Sub
      ctx.fillStyle = color;
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(sub, x + w / 2, y + 32);
      ctx.restore();
    };

    // Responsive 3-node distribution
    const nodeW = Math.min(115, Math.max(80, width * 0.26));
    const nodeH = 44;
    const yMid = height / 2 - 24;

    const spacing = (width - nodeW * 3) / 4;
    const x1 = Math.max(12, spacing);
    const x2 = spacing * 2 + nodeW;
    const x3 = width - nodeW - Math.max(12, spacing);

    drawNode(x1, yMid, nodeW, nodeH, "Client Node", "CRDT State v4", "#22d3ee");
    drawNode(
      x2,
      yMid,
      nodeW,
      nodeH,
      "WebSocket Bus",
      "sub-15ms sync",
      "#c084fc",
    );
    drawNode(
      x3,
      yMid,
      nodeW,
      nodeH,
      "Peer Reconcile",
      "State In Sync",
      "#34d399",
    );

    // Connect with smooth dashed arrows
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Arrow 1 -> 2
    ctx.beginPath();
    ctx.moveTo(x1 + nodeW, yMid + nodeH / 2);
    ctx.lineTo(x2, yMid + nodeH / 2);
    ctx.stroke();

    // Arrow 2 -> 3
    ctx.beginPath();
    ctx.moveTo(x2 + nodeW, yMid + nodeH / 2);
    ctx.lineTo(x3, yMid + nodeH / 2);
    ctx.stroke();

    ctx.restore();
    setLastOp("SNAPSHOT_RECONCILE(nodes: 3, status: 'CONVERGED')");
  }, []);

  // Handle canvas sizing with ResizeObserver for crisp Retina display & robust layout settlement
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawSampleDiagram();
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          updateSize();
        }
      }
    });

    ro.observe(container);
    updateSize();

    return () => ro.disconnect();
  }, [drawSampleDiagram]);

  // Pointer drawing handlers with accurate screen-to-canvas coordinate transformation
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { x, y } = getCoordinates(e);

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 18;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 2.5;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);

    setLamportClock((c) => {
      const next = c + 1;
      setLastOp(`INSERT_STROKE(clock: ${next}, tool: '${activeTool}')`);
      return next;
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    setLamportClock((c) => {
      const next = c + 1;
      setLastOp(`CLEAR_CANVAS_TOMBSTONE(clock: ${next})`);
      return next;
    });
  };

  const COLORS = [
    { id: "cyan", hex: "#22d3ee", label: "Cyan" },
    { id: "purple", hex: "#c084fc", label: "Purple" },
    { id: "emerald", hex: "#34d399", label: "Emerald" },
    { id: "amber", hex: "#fbbf24", label: "Amber" },
    { id: "white", hex: "#ffffff", label: "White" },
  ];

  return (
    <div className="w-full flex flex-col rounded-2xl bg-zinc-950/95 border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Telemetry & Control Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-zinc-900/90 border-b border-white/10 text-xs backdrop-blur-md gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white truncate text-xs sm:text-sm">
            CRDT Sandbox
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 whitespace-nowrap shrink-0">
            <Radio size={10} className="animate-pulse shrink-0" />
            <span>
              {latency}ms &bull; {peers} Peers
            </span>
          </span>
          <button
            type="button"
            onClick={drawSampleDiagram}
            className="px-2 py-1 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="Reset Architecture Diagram"
            aria-label="Reset Architecture Diagram"
          >
            <RotateCcw size={11} className="shrink-0" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-red-300 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-400/30 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="Clear Canvas"
            aria-label="Clear Canvas"
          >
            <Trash2 size={11} className="shrink-0" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area with Engineering Dot Grid */}
      <div
        ref={containerRef}
        className="nexusboard-canvas-viewport relative w-full h-56 sm:h-64 cursor-crosshair overflow-hidden select-none bg-zinc-950"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full touch-none block"
        />

        {/* Simulated Peer Cursor 1 (Alex - Frontend) */}
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out z-10 flex flex-col items-start"
          style={{ left: `${peer1Pos.x}%`, top: `${peer1Pos.y}%` }}
        >
          <svg
            className="w-4 h-4 text-cyan-400 drop-shadow"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/90 text-zinc-950 shadow-md -mt-1 ml-3 whitespace-nowrap">
            Alex (UI)
          </span>
        </div>

        {/* Simulated Peer Cursor 2 (Elena - CRDT Engine) */}
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out z-10 flex flex-col items-start"
          style={{ left: `${peer2Pos.x}%`, top: `${peer2Pos.y}%` }}
        >
          <svg
            className="w-4 h-4 text-purple-400 drop-shadow"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/90 text-zinc-950 shadow-md -mt-1 ml-3 whitespace-nowrap">
            Elena (CRDT)
          </span>
        </div>

        {/* Floating Interactive Toolbar at Bottom (Centered Figma-style) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center pointer-events-auto z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-white/15 backdrop-blur-md shadow-2xl">
            {/* Tool Toggles */}
            <button
              type="button"
              onClick={() => setActiveTool("pen")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === "pen"
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Pen Tool"
              aria-label="Pen Tool"
            >
              <PenTool size={13} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("eraser")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === "eraser"
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Eraser Tool"
              aria-label="Eraser Tool"
            >
              <Eraser size={13} />
            </button>

            <span className="w-[1px] h-4 bg-white/15 mx-1" />

            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.hex);
                    setActiveTool("pen");
                  }}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    selectedColor === c.hex && activeTool === "pen"
                      ? "scale-125 ring-2 ring-white/80 shadow-sm"
                      : "hover:scale-110 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                  aria-label={`Select ${c.label} color`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live CRDT Vector Clock & Delta Telemetry Ticker */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-zinc-950 border-t border-white/10 text-[10px] font-mono text-zinc-400 gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-zinc-200 font-semibold">Lamport Clock:</span>
          <span className="text-cyan-400 font-bold">L-{lamportClock}</span>
          <span className="text-zinc-500 hidden sm:inline">
            &bull; LWW-Element-Set
          </span>
        </div>
        <div className="truncate text-zinc-400">
          <span className="text-zinc-500">CRDT Delta: </span>
          <span className="text-purple-300 font-mono">{lastOp}</span>
        </div>
      </div>
    </div>
  );
});
NexusBoardVisual.displayName = "NexusBoardVisual";

// Stacked Case Study Panel (abhyudaytomar.com inspiration)
const CaseStudyPanel = memo(({ project }) => {
  const {
    name,
    role,
    period,
    description,
    metrics,
    tags,
    live_demo,
    source_code_link,
    image,
    id,
  } = project;

  // Render appropriate interactive visual
  const renderVisual = () => {
    switch (id) {
      case "deepfake-forensics":
        return <DeepfakeVisual image={image} />;
      case "nl-app-compiler":
        return <NLCompilerVisual />;
      case "docpilot":
        return <DocPilotVisual />;
      case "nexusboard":
        return <NexusBoardVisual />;
      default:
        return (
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
            <img
              src={image}
              alt={name}
              className="w-full h-auto object-cover"
            />
          </div>
        );
    }
  };

  return (
    <article
      className="group relative rounded-3xl bg-zinc-900/60 border border-white/10 hover:border-white/20 p-4 sm:p-8 lg:p-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300"
      aria-labelledby={`project-${id}`}
    >
      {/* Top subtle specular reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Copy, Metadata & Metrics */}
        <div className="lg:col-span-6 flex flex-col space-y-5">
          {/* Metadata Tag */}
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-semibold">{role}</span>
            <span>&bull;</span>
            <span>{period}</span>
          </div>

          {/* Project Title */}
          <h3
            id={`project-${id}`}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight"
          >
            {name}
          </h3>

          {/* Summary */}
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            {description}
          </p>

          {/* Quantitative Metrics (abhyudaytomar.com signature element) */}
          {metrics && metrics.length > 0 && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-white/10">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex flex-col">
                  <dt className="text-[11px] font-mono uppercase text-zinc-400 leading-tight">
                    {m.label}
                  </dt>
                  <dd className="text-base sm:text-xl font-bold text-white tracking-tight mt-1">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* Technology Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/10 text-zinc-300"
              >
                {t.name}
              </span>
            ))}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-4 pt-2">
            {live_demo && (
              <a
                href={live_demo}
                target="_blank"
                rel="noopener noreferrer"
                className="project-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <span>Live Demo</span>
                <ExternalLink size={13} />
              </a>
            )}
            {source_code_link && (
              <a
                href={source_code_link}
                target="_blank"
                rel="noopener noreferrer"
                className="project-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-white/15 text-white font-semibold text-xs transition-colors"
              >
                <Github size={13} />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column: High-Craft Interactive Visual */}
        <div className="lg:col-span-6 w-full">{renderVisual()}</div>
      </div>
    </article>
  );
});
CaseStudyPanel.displayName = "CaseStudyPanel";

// Main Works Component
const Projects = () => {
  const { activeRole } = useRole();

  // Filter top featured projects
  const featuredProjects = useMemo(() => {
    const list = projects.filter((p) => p.featured);
    if (activeRole === "all") return list;
    return list.filter(
      (p) => p.category === activeRole || activeRole === "all",
    );
  }, [activeRole]);

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">01</span>
            <span>&bull;</span>
            <span>Selected Work &amp; Case Studies</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Featured Engineering
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Deep-dive architecture case studies across multi-modal AI forensics,
            generative LLM compilers, and real-time distributed platforms.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{featuredProjects.length} Flagship Case Studies</span>
          </span>
        </div>
      </div>

      {/* Stack of Featured Panels */}
      <div className="flex flex-col space-y-8 sm:space-y-10">
        {featuredProjects.map((project, index) => (
          <CaseStudyPanel key={project.id} project={project} index={index} />
        ))}
      </div>
    </div>
  );
};

const WrappedProjects = SectionWrapper(memo(Projects), "projects");
export default WrappedProjects;
