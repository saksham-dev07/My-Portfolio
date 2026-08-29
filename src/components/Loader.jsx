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
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl min-w-[180px]">
        {/* Animated spinner ring */}
        <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <span className="text-sm font-bold text-white tracking-wider">
            {progress.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar indicator */}
        <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-accent transition-all duration-200 rounded-full"
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