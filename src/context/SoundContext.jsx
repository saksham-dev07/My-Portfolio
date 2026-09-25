import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const SoundContext = createContext({
  isMuted: true,
  toggleMute: () => {},
  playClick: () => {},
  playBlip: () => {},
  playSuccess: () => {},
  playWhoosh: () => {},
  playSecret: () => {},
  playJump: () => {},
  playDoubleJump: () => {},
  playSpring: () => {},
  playDoor: () => {},
  playCoin: () => {},
  playVictory: () => {},
  playDodge: () => {},
});

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef(null);
  const hasInteractedRef = useRef(false);

  // Initialize or resume AudioContext safely with user gesture
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined" || !hasInteractedRef.current) return null;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Unlock AudioContext on first user interaction anywhere
  useEffect(() => {
    const unlock = () => {
      hasInteractedRef.current = true;
      try {
        if (!audioCtxRef.current) {
          const AudioCtxClass =
            window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) {
            audioCtxRef.current = new AudioCtxClass();
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener("pointerdown", unlock, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Load saved sound preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_sound_muted");
      if (saved !== null) {
        setIsMuted(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  // Crisp, tactile mechanical click (warm, non-piercing)
  const playClick = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.04);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio synthesis errors
    }
  }, [isMuted, getAudioContext]);

  // Soft cyber blip (for tabs/hover) — very gentle
  const playBlip = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.05);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Success 4-chord ascending chime — gentle and melodic
  const playSuccess = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.025, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.19);
      });
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Whoosh frequency sweep — soft breeze
  const playWhoosh = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Secret 8-bit retro fanfare — soft retro charm
  const playSecret = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const melody = [330, 392, 659, 523, 587, 784];
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.08;

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.018, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Retro 8-bit platformer jump sound — subtle pop
  const playJump = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.14);

      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Retro 8-bit double jump sound (higher octave chirp) — gentle
  const playDoubleJump = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);

      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Retro spring booster boing sound — soft boing
  const playSpring = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Retro portal warp teleport sound — ethereal transition
  const playDoor = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Retro 8-bit coin pickup sound — delicate ding
  const playCoin = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.08); // G5

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Warm, melodic celestial victory chime (soft sine waves with lowpass filter, gentle envelope)
  const playVictory = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 (warm musical major chord)
      const now = ctx.currentTime;

      // Master lowpass filter to completely eliminate high-frequency harshness
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, now);
      filter.connect(ctx.destination);

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine"; // Pure round sine wave, zero sharp harmonics
        osc.frequency.setValueAtTime(freq, start);

        // Feather-light acoustic attack and lush decay (~0.015 gain)
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.015, start + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

        osc.connect(gain);
        gain.connect(filter);

        osc.start(start);
        osc.stop(start + 0.58);
      });
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Cheeky dodge whoosh/boing sound — subtle swish
  const playDodge = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }, [isMuted, getAudioContext]);

  // Master mute toggle with instant un-mute chirp feedback
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("portfolio_sound_muted", String(next));
      } catch {
        // Ignore
      }
      if (!next) {
        // Just unmuted: immediately play gentle confirmation chirp
        const ctx = getAudioContext();
        if (ctx) {
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(392, now); // G4
          osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.09); // C5

          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.13);
        }
      }
      return next;
    });
  }, [getAudioContext]);

  // Global Click Interceptor: when SFX is enabled, clicking ANY button, link, or tab plays crisp click
  useEffect(() => {
    if (isMuted) return;

    const handleGlobalClick = (e) => {
      // Don't duplicate click sound if clicking the mute toggle itself
      if (e.target.closest("[data-sound-toggle]")) return;

      const interactive = e.target.closest(
        "button, a, input[type='button'], input[type='submit'], [role='button'], [role='tab'], summary",
      );
      if (interactive) {
        playClick();
      }
    };

    document.addEventListener("click", handleGlobalClick, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("click", handleGlobalClick, {
        capture: true,
      });
    };
  }, [isMuted, playClick]);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playClick,
        playBlip,
        playSuccess,
        playWhoosh,
        playSecret,
        playJump,
        playDoubleJump,
        playSpring,
        playDoor,
        playCoin,
        playVictory,
        playDodge,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSound = () => useContext(SoundContext);
