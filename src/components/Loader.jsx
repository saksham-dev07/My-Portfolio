import React from "react";
import { Html, useProgress } from "@react-three/drei";

const CanvasLoader = () => {
  const { progress } = useProgress();

  return (
    <Html
      as="div"
      center
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        pointerEvents: "none",
      }}
    >
      <div className="relative flex flex-col items-center justify-center p-6 bg-zinc-950/85 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl min-w-[190px] overflow-hidden">
        {/* Top specular line */}
        <div className="specular-line" />

        {/* Animated spinner ring */}
        <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
          <span className="text-sm font-bold text-white tracking-wider font-mono">
            {progress.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar indicator */}
        <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-2 border border-white/10 p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-200 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Loading 3D Setup...
        </p>
      </div>
    </Html>
  );
};

export default CanvasLoader;