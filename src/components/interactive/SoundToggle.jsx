import { motion as Motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import React, { memo } from "react";
import { useSound } from "../../context/SoundContext";

const SoundToggle = memo(({ isMobile = false }) => {
  const { isMuted, toggleMute } = useSound();

  return (
    <Motion.button
      type="button"
      data-sound-toggle="true"
      onClick={toggleMute}
      whileTap={{ scale: 0.88 }}
      className={`sound-toggle-btn relative flex items-center justify-center ${
        isMobile ? "w-6 h-6" : "w-8 h-8"
      } rounded-full border transition-all duration-250 cursor-pointer shrink-0 ${
        isMuted
          ? "bg-zinc-900/80 border-white/10 text-zinc-500 hover:text-zinc-200 hover:border-white/20"
          : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
      }`}
      aria-label={isMuted ? "Enable Sound Effects" : "Mute Sound Effects"}
      aria-pressed={!isMuted}
    >
      {isMuted ? (
        <VolumeX size={isMobile ? 12 : 15} className="shrink-0" />
      ) : (
        <>
          <Volume2 size={isMobile ? 12 : 15} className="shrink-0" />
          {/* Subtle live audio ripple rings */}
          <span
            className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping pointer-events-none"
            style={{ animationDuration: "2s" }}
          />
        </>
      )}
    </Motion.button>
  );
});

SoundToggle.displayName = "SoundToggle";
export default SoundToggle;
