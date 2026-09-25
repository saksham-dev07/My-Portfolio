import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Gamepad2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useArcade } from "../../../context/ArcadeContext";
import { useSound } from "../../../context/SoundContext";
import { buildSignalRunTrack } from "./signalRunData";

const SignalRunModal = memo(() => {
  const { isSignalRunOpen, closeSignalRun } = useArcade();
  const { playJump, playCoin, playVictory, playDodge, isMuted, toggleMute } =
    useSound();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // High-level game state
  const [gameState, setGameState] = useState("READY"); // "READY" | "RUNNING" | "PAUSED" | "FINISHED"
  const [signalsCount, setSignalsCount] = useState(0);
  const [activeZone, setActiveZone] = useState(null);
  const [activeToast, setActiveToast] = useState(null);
  const [zoneBanner, setZoneBanner] = useState(null);
  const [runTime, setRunTime] = useState(0);
  const [stumblesCount, setStumblesCount] = useState(0);

  // Mutable game simulation refs (avoids React re-render overhead inside RAF loop)
  const trackDataRef = useRef(null);
  const worldXRef = useRef(0);
  const runnerYRef = useRef(0);
  const runnerVyRef = useRef(0);
  const isGroundedRef = useRef(true);
  const lastTimeRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const gameStateRef = useRef("READY");
  const stumblesRef = useRef(0);
  const toastTimeoutRef = useRef(null);
  const bannerTimeoutRef = useRef(null);
  const particlesRef = useRef([]);
  const shakeTimeRef = useRef(0);

  // Motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Initialize track data on fresh mount / restart
  const initFreshRun = useCallback(() => {
    const data = buildSignalRunTrack();
    trackDataRef.current = data;
    worldXRef.current = 0;
    runnerYRef.current = 0;
    runnerVyRef.current = 0;
    isGroundedRef.current = true;
    stumblesRef.current = 0;
    particlesRef.current = [];
    shakeTimeRef.current = 0;
    gameStateRef.current = "READY";

    setGameState("READY");
    setSignalsCount(0);
    setRunTime(0);
    setStumblesCount(0);
    setActiveToast(null);
    setZoneBanner(null);

    if (data.zones.length > 0) {
      setActiveZone(data.zones[0]);
    }
  }, []);

  // Prevent background scroll and coordinate with Lenis
  useEffect(() => {
    if (!isSignalRunOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    // Pause Lenis smooth scroll while game modal is active
    if (window.lenis) window.lenis.stop();

    initFreshRun();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
      // Resume Lenis smooth scroll
      if (window.lenis) window.lenis.start();
    };
  }, [isSignalRunOpen, initFreshRun]);

  // Jump trigger action
  const handleJump = useCallback(() => {
    if (gameStateRef.current === "READY") {
      gameStateRef.current = "RUNNING";
      setGameState("RUNNING");
      lastTimeRef.current = performance.now();
      playJump();
      runnerVyRef.current = -660; // initial jump impulse
      isGroundedRef.current = false;
      return;
    }

    if (gameStateRef.current === "PAUSED") {
      gameStateRef.current = "RUNNING";
      setGameState("RUNNING");
      lastTimeRef.current = performance.now();
      return;
    }

    if (gameStateRef.current === "RUNNING") {
      // Allow jump if grounded or small coyote buffer
      if (isGroundedRef.current || runnerYRef.current > -18) {
        runnerVyRef.current = -660;
        isGroundedRef.current = false;
        playJump();

        // Spawn runner jump particle puffs
        const canvas = canvasRef.current;
        if (canvas) {
          const width = canvas.width / (window.devicePixelRatio || 1);
          const height = canvas.height / (window.devicePixelRatio || 1);
          const groundY = height * 0.72;
          const screenX = width * 0.16;

          for (let i = 0; i < 6; i++) {
            particlesRef.current.push({
              x: screenX - 6 + (Math.random() - 0.5) * 12,
              y: groundY,
              vx: -60 - Math.random() * 80,
              vy: (Math.random() - 0.5) * 30,
              size: Math.random() * 3 + 2,
              color: "#38bdf8",
              alpha: 0.8,
              decay: 0.04,
            });
          }
        }
      }
    }
  }, [playJump]);

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (gameStateRef.current === "RUNNING") {
      gameStateRef.current = "PAUSED";
      setGameState("PAUSED");
    } else if (gameStateRef.current === "PAUSED") {
      gameStateRef.current = "RUNNING";
      setGameState("RUNNING");
      lastTimeRef.current = performance.now();
    }
  }, []);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isSignalRunOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space" || e.key === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault(); // Stop window scroll
        handleJump();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        initFreshRun();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSignalRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSignalRunOpen, handleJump, togglePause, initFreshRun, closeSignalRun]);

  // Handle tab visibility change & blur to avoid burning CPU or quantum jumping
  useEffect(() => {
    if (!isSignalRunOpen) return;

    const handleVisibility = () => {
      if (document.hidden && gameStateRef.current === "RUNNING") {
        gameStateRef.current = "PAUSED";
        setGameState("PAUSED");
      }
    };

    const handleBlur = () => {
      if (gameStateRef.current === "RUNNING") {
        gameStateRef.current = "PAUSED";
        setGameState("PAUSED");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isSignalRunOpen]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (!isSignalRunOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isSubscribed = true;
    lastTimeRef.current = performance.now();

    const loop = (currentTime) => {
      if (!isSubscribed) return;

      // Delta time in seconds (clamped to max 40ms to avoid physics glitching)
      let dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      if (dt > 0.04) dt = 0.04;
      if (dt < 0) dt = 0;

      // Dynamic canvas resize calculation for high-DPI
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const logicalWidth = rect.width;
      const logicalHeight = rect.height;

      if (
        canvas.width !== Math.floor(logicalWidth * dpr) ||
        canvas.height !== Math.floor(logicalHeight * dpr)
      ) {
        canvas.width = Math.floor(logicalWidth * dpr);
        canvas.height = Math.floor(logicalHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Camera screen shake on stumble
      if (shakeTimeRef.current > 0 && !prefersReducedMotion) {
        shakeTimeRef.current -= dt;
        const shakeMag = shakeTimeRef.current * 8;
        ctx.translate(
          (Math.random() - 0.5) * shakeMag,
          (Math.random() - 0.5) * shakeMag,
        );
      }

      const groundY = logicalHeight * 0.72;
      const screenRunnerX = logicalWidth * 0.16;

      const track = trackDataRef.current;
      if (track) {
        // Find current zone based on worldX
        const currentZone =
          track.zones.find(
            (z) => worldXRef.current >= z.startX && worldXRef.current < z.endX,
          ) || track.zones[track.zones.length - 1];

        // Trigger zone banner on first entry
        if (
          currentZone &&
          !currentZone.bannerShown &&
          gameStateRef.current === "RUNNING"
        ) {
          currentZone.bannerShown = true;
          setActiveZone(currentZone);
          setZoneBanner({
            number: currentZone.number,
            name: currentZone.name,
            subtitle: currentZone.subtitle,
            color: currentZone.accentColor,
          });

          if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
          bannerTimeoutRef.current = setTimeout(() => {
            setZoneBanner(null);
          }, 2800);
        }

        // --- UPDATE SIMULATION IF RUNNING ---
        if (gameStateRef.current === "RUNNING") {
          setRunTime((prev) => prev + dt);

          // Dynamic speed ramp
          const currentSpeed = currentZone ? currentZone.speed : 280;
          worldXRef.current += currentSpeed * dt;

          // Runner gravity & jump physics
          const gravity = 1700;
          runnerVyRef.current += gravity * dt;
          runnerYRef.current += runnerVyRef.current * dt;

          if (runnerYRef.current >= 0) {
            runnerYRef.current = 0;
            runnerVyRef.current = 0;
            isGroundedRef.current = true;
          } else {
            isGroundedRef.current = false;
          }

          // Runner trail particles
          if (Math.random() < 0.6) {
            particlesRef.current.push({
              x: screenRunnerX - 8,
              y: groundY + runnerYRef.current - 10 + (Math.random() - 0.5) * 8,
              vx: -120 - Math.random() * 80,
              vy: (Math.random() - 0.5) * 20,
              size: Math.random() * 3 + 1.5,
              color: currentZone?.accentColor || "#06b6d4",
              alpha: 0.85,
              decay: 0.05,
            });
          }

          // Check Collectibles collision
          const runnerRadius = 12;
          const runnerCenterY = groundY + runnerYRef.current - 12;

          track.collectibles.forEach((col) => {
            if (col.collected) return;

            const colScreenX = col.worldX - worldXRef.current + screenRunnerX;
            const colScreenY = groundY + col.offsetY;

            // Bounding distance check
            const dx = screenRunnerX - colScreenX;
            const dy = runnerCenterY - colScreenY;
            const dist = Math.hypot(dx, dy);

            if (dist < runnerRadius + col.radius + 6) {
              // Collected!
              col.collected = true;
              playCoin();
              setSignalsCount((c) => c + 1);

              // Spawn collectible burst particles
              for (let i = 0; i < 14; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 120 + 40;
                particlesRef.current.push({
                  x: colScreenX,
                  y: colScreenY,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  size: Math.random() * 4 + 2,
                  color: col.color,
                  alpha: 1,
                  decay: 0.03,
                });
              }

              // Trigger resume toast
              setActiveToast({
                tag: col.fact.tag,
                headline: col.fact.headline,
                detail: col.fact.detail,
                color: col.color,
              });

              if (toastTimeoutRef.current)
                clearTimeout(toastTimeoutRef.current);
              toastTimeoutRef.current = setTimeout(() => {
                setActiveToast(null);
              }, 4800);
            }
          });

          // Check Obstacle collision (Gentle & Forgiving)
          track.obstacles.forEach((obs) => {
            const obsScreenX = obs.worldX - worldXRef.current + screenRunnerX;
            const obsScreenY = groundY + obs.offsetY;

            // Inset hitbox by 4px for forgiving collision forgiveness
            const obsLeft = obsScreenX + 4;
            const obsRight = obsScreenX + obs.w - 4;
            const obsTop = obsScreenY + 4;
            const obsBottom = obsScreenY + obs.h;

            const runnerLeft = screenRunnerX - runnerRadius + 3;
            const runnerRight = screenRunnerX + runnerRadius - 3;
            const runnerTop = runnerCenterY - runnerRadius + 3;
            const runnerBottom = runnerCenterY + runnerRadius - 2;

            const hasCollided =
              runnerRight > obsLeft &&
              runnerLeft < obsRight &&
              runnerBottom > obsTop &&
              runnerTop < obsBottom;

            if (hasCollided) {
              // STUMBLE: Resets position to current zone start. Never erases collected signals!
              playDodge();
              stumblesRef.current += 1;
              setStumblesCount(stumblesRef.current);
              shakeTimeRef.current = 0.35;

              // Reset to beginning of current zone + safe offset
              worldXRef.current = Math.max(0, currentZone.startX + 60);
              runnerYRef.current = 0;
              runnerVyRef.current = 0;
              isGroundedRef.current = true;

              // Spawn stumble glitch sparks
              for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                particlesRef.current.push({
                  x: screenRunnerX,
                  y: groundY - 14,
                  vx: Math.cos(angle) * (Math.random() * 150 + 50),
                  vy: Math.sin(angle) * (Math.random() * 150 + 50),
                  size: Math.random() * 4 + 2,
                  color: "#ef4444",
                  alpha: 1,
                  decay: 0.04,
                });
              }
            }
          });

          // Check Finish line portal crossing
          const finishZone = track.zones.find((z) => z.id === "finish");
          if (finishZone && worldXRef.current >= finishZone.portalX) {
            gameStateRef.current = "FINISHED";
            setGameState("FINISHED");
            playVictory();

            // Save best score to localStorage
            try {
              const prevBest = localStorage.getItem(
                "portfolio_signal_run_best",
              );
              const currentTotal = track.totalCollectiblesCount;
              const currentCollected = track.collectibles.filter(
                (c) => c.collected,
              ).length;
              if (
                !prevBest ||
                currentCollected > JSON.parse(prevBest).signals
              ) {
                localStorage.setItem(
                  "portfolio_signal_run_best",
                  JSON.stringify({
                    signals: currentCollected,
                    total: currentTotal,
                    date: new Date().toISOString(),
                  }),
                );
              }
            } catch {
              // Ignore localStorage quota errors
            }
          }
        }

        // --- DRAW CANVAS SCENE ---
        // 1. Deep Space Dark Background with subtle radial ambient glow
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Zone-tinted ambient background haze
        const zoneColor = currentZone?.accentColor || "#06b6d4";
        const bgGlow = ctx.createRadialGradient(
          logicalWidth * 0.5,
          logicalHeight * 0.4,
          20,
          logicalWidth * 0.5,
          logicalHeight * 0.4,
          logicalWidth * 0.6,
        );
        bgGlow.addColorStop(0, `${zoneColor}18`);
        bgGlow.addColorStop(1, "transparent");
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 2. Parallax Cyber Starfield / Horizon Matrix
        const starSpeed = prefersReducedMotion ? 0 : 0.15;
        const starOffset = (worldXRef.current * starSpeed) % logicalWidth;
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        for (let i = 0; i < 40; i++) {
          const sx = (i * 47 - starOffset + logicalWidth) % logicalWidth;
          const sy = (i * 29) % (groundY * 0.7);
          const sRad = i % 3 === 0 ? 1.5 : 1;
          ctx.beginPath();
          ctx.arc(sx, sy, sRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Distant Cyber Grid Lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        const gridOffset = (worldXRef.current * 0.4) % 60;
        for (let gx = -gridOffset; gx < logicalWidth; gx += 60) {
          ctx.beginPath();
          ctx.moveTo(gx, groundY - 80);
          ctx.lineTo(gx - 30, groundY);
          ctx.stroke();
        }

        // Horizon Line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.moveTo(0, groundY - 80);
        ctx.lineTo(logicalWidth, groundY - 80);
        ctx.stroke();

        // 3. Neon Circuit Track at groundY
        // Dual Rail Glow
        ctx.strokeStyle = zoneColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = zoneColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(logicalWidth, groundY);
        ctx.stroke();

        // Secondary guide rail
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 4);
        ctx.lineTo(logicalWidth, groundY + 4);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Circuit moving ticks along track
        const trackTickOffset = (worldXRef.current * 1.0) % 40;
        ctx.fillStyle = zoneColor;
        for (let tx = -trackTickOffset; tx < logicalWidth; tx += 40) {
          ctx.fillRect(tx, groundY + 8, 16, 2);
        }

        // Below track dark gradient fill
        const subTrackGrad = ctx.createLinearGradient(
          0,
          groundY,
          0,
          logicalHeight,
        );
        subTrackGrad.addColorStop(0, "rgba(9, 9, 11, 0.95)");
        subTrackGrad.addColorStop(1, "#050508");
        ctx.fillStyle = subTrackGrad;
        ctx.fillRect(0, groundY + 5, logicalWidth, logicalHeight - groundY);

        // 4. Draw Collectibles in viewport
        track.collectibles.forEach((col) => {
          const colScreenX = col.worldX - worldXRef.current + screenRunnerX;
          if (colScreenX < -40 || colScreenX > logicalWidth + 40) return;

          const colScreenY = groundY + col.offsetY;

          if (!col.collected) {
            // Hovering pulse bob
            const bob = Math.sin(currentTime * 0.005 + col.worldX) * 4;
            const curY = colScreenY + bob;

            // Outer pulse wave
            ctx.strokeStyle = col.color;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = col.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(colScreenX, curY, col.radius + 3, 0, Math.PI * 2);
            ctx.stroke();

            // Core glowing orb
            const orbGrad = ctx.createRadialGradient(
              colScreenX,
              curY,
              2,
              colScreenX,
              curY,
              col.radius,
            );
            orbGrad.addColorStop(0, "#ffffff");
            orbGrad.addColorStop(0.4, col.color);
            orbGrad.addColorStop(1, "rgba(0, 0, 0, 0.6)");
            ctx.fillStyle = orbGrad;
            ctx.beginPath();
            ctx.arc(colScreenX, curY, col.radius, 0, Math.PI * 2);
            ctx.fill();

            // Orbiting holographic signal ring
            ctx.save();
            ctx.translate(colScreenX, curY);
            ctx.rotate(currentTime * 0.003);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1;
            ctx.strokeRect(-col.radius * 1.2, -3, col.radius * 2.4, 6);
            ctx.restore();
            ctx.shadowBlur = 0;
          }
        });

        // 5. Draw Obstacles in viewport
        track.obstacles.forEach((obs) => {
          const obsScreenX = obs.worldX - worldXRef.current + screenRunnerX;
          if (obsScreenX < -60 || obsScreenX > logicalWidth + 60) return;

          const obsScreenY = groundY + obs.offsetY;

          if (obs.type === "glitch_block") {
            // High-tech angular glitch block
            ctx.shadowColor = obs.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#18181b";
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(obsScreenX, obsScreenY + obs.h);
            ctx.lineTo(obsScreenX, obsScreenY + 8);
            ctx.lineTo(obsScreenX + 8, obsScreenY);
            ctx.lineTo(obsScreenX + obs.w, obsScreenY);
            ctx.lineTo(obsScreenX + obs.w, obsScreenY + obs.h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Hazard stripes on obstacle
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(obsScreenX + 6, obsScreenY + obs.h - 6);
            ctx.lineTo(obsScreenX + obs.w - 6, obsScreenY + 8);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Energy Gate Pylon
            ctx.shadowColor = obs.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = 2.5;

            // Gate beam arch
            ctx.beginPath();
            ctx.arc(
              obsScreenX + obs.w / 2,
              obsScreenY + 12,
              obs.w / 2,
              Math.PI,
              0,
            );
            ctx.lineTo(obsScreenX + obs.w, obsScreenY + obs.h);
            ctx.lineTo(obsScreenX, obsScreenY + obs.h);
            ctx.closePath();
            ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
            ctx.fill();
            ctx.stroke();

            // Pulsing core beacon
            const beaconAlpha = 0.5 + Math.sin(currentTime * 0.01) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${beaconAlpha})`;
            ctx.beginPath();
            ctx.arc(obsScreenX + obs.w / 2, obsScreenY + 12, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // 6. Draw Finish Line Quantum Gateway Portal
        const finishZone = track.zones.find((z) => z.id === "finish");
        if (finishZone) {
          const portalScreenX =
            finishZone.portalX - worldXRef.current + screenRunnerX;
          if (portalScreenX > -100 && portalScreenX < logicalWidth + 200) {
            const portalY = groundY - 70;
            const pRadius = 55;

            // Multi-ring glowing portal vortex
            ctx.save();
            ctx.shadowColor = "#ec4899";
            ctx.shadowBlur = 30;

            // Outer Archway
            ctx.strokeStyle = "#ec4899";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(portalScreenX, portalY, pRadius, Math.PI, 0);
            ctx.lineTo(portalScreenX + pRadius, groundY);
            ctx.lineTo(portalScreenX - pRadius, groundY);
            ctx.closePath();
            ctx.stroke();

            // Inner rotating energy vortex
            ctx.translate(portalScreenX, portalY);
            ctx.rotate(currentTime * 0.002);
            const portalGrad = ctx.createRadialGradient(
              0,
              0,
              5,
              0,
              0,
              pRadius * 0.85,
            );
            portalGrad.addColorStop(0, "#ffffff");
            portalGrad.addColorStop(0.3, "#ec4899");
            portalGrad.addColorStop(0.7, "#8b5cf6");
            portalGrad.addColorStop(1, "transparent");
            ctx.fillStyle = portalGrad;
            ctx.beginPath();
            ctx.arc(0, 0, pRadius * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Finish banner text above gateway
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px 'Fira Code', monospace";
            ctx.textAlign = "center";
            ctx.fillText(
              "GATEWAY // 2027",
              portalScreenX,
              portalY - pRadius - 12,
            );
            ctx.shadowBlur = 0;
          }
        }

        // 7. Update & Draw Particles (Trail, Sparkles, Bursts)
        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha -= p.decay;

          if (p.alpha <= 0) return false;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        });

        // 8. Draw Runner Character Node
        const runnerRadius = 12;
        const runnerCenterY = groundY + runnerYRef.current - 12;

        ctx.save();
        ctx.shadowColor = zoneColor;
        ctx.shadowBlur = 18;

        // Outer Aura
        const pulse = Math.sin(currentTime * 0.008) * 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(
          screenRunnerX,
          runnerCenterY,
          runnerRadius + pulse,
          0,
          Math.PI * 2,
        );
        ctx.stroke();

        // Runner Core Nucleus
        const coreGrad = ctx.createRadialGradient(
          screenRunnerX - 3,
          runnerCenterY - 3,
          2,
          screenRunnerX,
          runnerCenterY,
          runnerRadius,
        );
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.3, "#38bdf8");
        coreGrad.addColorStop(0.8, zoneColor);
        coreGrad.addColorStop(1, "#0284c7");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(screenRunnerX, runnerCenterY, runnerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ground contact shadow if jumping
        if (runnerYRef.current < -5) {
          const shadowScale = Math.max(0.2, 1 + runnerYRef.current / 150);
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.ellipse(
            screenRunnerX,
            groundY + 2,
            runnerRadius * shadowScale,
            3 * shadowScale,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();

      if (isSubscribed) {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [isSignalRunOpen, playCoin, playDodge, playVictory, prefersReducedMotion]);

  if (!isSignalRunOpen) return null;

  const totalDenom = trackDataRef.current?.totalCollectiblesCount || 13;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl select-none">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl h-[92vh] max-h-[720px] rounded-2xl sm:rounded-3xl bg-zinc-950 border-2 border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col font-mono"
      >
        {/* === ARCADE TITLEBAR === */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-zinc-900/90 border-b border-white/10 select-none shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Retro LED Indicator lights */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            </div>

            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-cyan-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                SIGNAL RUN
                <span className="hidden sm:inline text-zinc-400">
                  {" "}
                  // TIMELINE
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Zone Pill */}
            {activeZone && (
              <span
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                style={{
                  backgroundColor: `${activeZone.accentColor}15`,
                  borderColor: `${activeZone.accentColor}40`,
                  color: activeZone.accentColor,
                }}
              >
                <Radio size={11} className="animate-pulse" />
                <span>ZONE {activeZone.number}</span>
              </span>
            )}

            {/* Run Timer */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <Clock size={12} className="text-cyan-400" />
              <span>{runTime.toFixed(1)}s</span>
            </div>

            {/* Signals Collected Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
              <Zap size={12} />
              <span>
                {signalsCount} / {totalDenom}
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
              aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? (
                <VolumeX size={15} />
              ) : (
                <Volume2 size={15} className="text-cyan-400" />
              )}
            </button>

            {/* Restart Button */}
            <button
              type="button"
              onClick={initFreshRun}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Restart Run [R]"
              aria-label="Restart Run"
            >
              <RotateCcw size={15} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeSignalRun}
              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
              title="Close [Esc]"
              aria-label="Close Game"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* === VIEWPORT CONTAINER === */}
        <div
          ref={containerRef}
          onClick={handleJump}
          className="relative flex-1 w-full bg-zinc-950 overflow-hidden cursor-pointer touch-none"
        >
          {/* Main 2D Canvas */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Screen Reader Live Region */}
          <div className="sr-only" role="status" aria-live="polite">
            {activeToast
              ? `${activeToast.headline}: ${activeToast.detail}`
              : ""}
            {zoneBanner
              ? `Entered ${zoneBanner.name}: ${zoneBanner.subtitle}`
              : ""}
          </div>

          {/* In-Game Fact Toast Overlay */}
          <AnimatePresence>
            {activeToast && gameState !== "FINISHED" && (
              <Motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md p-3 sm:p-3.5 rounded-xl bg-zinc-950/95 border backdrop-blur-xl shadow-2xl pointer-events-none"
                style={{
                  borderColor: `${activeToast.color}60`,
                  boxShadow: `0 0 24px ${activeToast.color}35`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="p-1.5 rounded-lg shrink-0 mt-0.5"
                    style={{ backgroundColor: `${activeToast.color}25` }}
                  >
                    <Sparkles size={14} style={{ color: activeToast.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[10px] font-bold tracking-wider uppercase block"
                      style={{ color: activeToast.color }}
                    >
                      {activeToast.tag}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                      {activeToast.headline}
                    </h4>
                    <p className="text-[11px] text-zinc-300 font-sans mt-0.5 leading-snug">
                      {activeToast.detail}
                    </p>
                  </div>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Zone Start Announcement Banner */}
          <AnimatePresence>
            {zoneBanner && gameState !== "FINISHED" && (
              <Motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none px-4"
              >
                <div
                  className="px-4 py-2 rounded-2xl bg-zinc-950/90 border backdrop-blur-xl shadow-xl text-center"
                  style={{
                    borderColor: `${zoneBanner.color}50`,
                    boxShadow: `0 0 30px ${zoneBanner.color}30`,
                  }}
                >
                  <span
                    className="text-xs sm:text-sm font-black tracking-widest uppercase block"
                    style={{ color: zoneBanner.color }}
                  >
                    ZONE {zoneBanner.number} — {zoneBanner.name}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-sans">
                    {zoneBanner.subtitle}
                  </span>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Start Run Prompt Overlay */}
          {gameState === "READY" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px] pointer-events-none">
              <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3 max-w-md p-6 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <Gamepad2 size={24} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  SIGNAL RUN: THE RESUME RUNNER
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Guide the signal node through Saksham's timeline. Collect
                  glowing signals to unlock verified achievements from education
                  to featured projects.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold text-xs shadow-lg animate-pulse">
                    <span>Press Space or Tap to Jump</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Motion.div>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState === "PAUSED" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md pointer-events-auto">
              <div className="text-center space-y-4 max-w-sm p-6 rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Pause size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">RUN PAUSED</h3>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-cyan-300 transition-colors"
                  >
                    <Play size={14} />
                    <span>Resume [P]</span>
                  </button>
                  <button
                    type="button"
                    onClick={initFreshRun}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    <RotateCcw size={14} />
                    <span>Restart [R]</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Victory Summary Screen */}
          {gameState === "FINISHED" && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-3 sm:p-6 bg-zinc-950/95 backdrop-blur-xl overflow-y-auto"
            >
              <div className="w-full max-w-lg p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-zinc-900 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] space-y-5 text-center">
                {/* Trophy Header */}
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                  <Trophy size={28} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    Quantum Gateway Reached
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    SIGNAL RUN COMPLETED
                  </h3>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 rounded-2xl bg-zinc-950 border border-white/10 text-left font-mono">
                  <div className="p-2 sm:p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase">
                      Signals
                    </span>
                    <span className="text-base sm:text-lg font-bold text-cyan-300">
                      {signalsCount} / {totalDenom}
                    </span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase">
                      Time
                    </span>
                    <span className="text-base sm:text-lg font-bold text-emerald-300">
                      {runTime.toFixed(1)}s
                    </span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase">
                      Stumbles
                    </span>
                    <span className="text-base sm:text-lg font-bold text-amber-300">
                      {stumblesCount}
                    </span>
                  </div>
                </div>

                {/* One-Line Run Report Built Only From Actual Run Data */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 font-mono text-center">
                  RUN REPORT: 5/5 Zones Cleared • {signalsCount} of {totalDenom}{" "}
                  Signals Synchronized • {runTime.toFixed(1)}s Duration
                </div>

                {/* Call to Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      closeSignalRun();
                      const target = document.getElementById("contact");
                      if (target) {
                        if (window.lenis) {
                          window.lenis.scrollTo(target, { duration: 1.2 });
                        } else {
                          target.scrollIntoView({ behavior: "smooth" });
                        }
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    <span>Hiring a 2027 Graduate?</span>
                    <ArrowRight size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={initFreshRun}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Play Again [R]</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeSignalRun}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X size={14} />
                    <span>Close [Esc]</span>
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </div>

        {/* === ACCESSIBILITY & CONTROLS FOOTER === */}
        <div className="px-3 sm:px-6 py-2 bg-zinc-900/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span>[Space/↑/Tap] Jump</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">[P] Pause</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">[R] Restart</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>[Esc] Close</span>
          </div>

          {/* Plain-text Resume Affordance */}
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span>Prefer plain text?</span>
            <a
              href="#education"
              onClick={() => closeSignalRun()}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Education
            </a>
            <span>&bull;</span>
            <a
              href="#projects"
              onClick={() => closeSignalRun()}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Projects
            </a>
            <span>&bull;</span>
            <a
              href="#credentials"
              onClick={() => closeSignalRun()}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Credentials
            </a>
            <span>&bull;</span>
            <a
              href="#leadership"
              onClick={() => closeSignalRun()}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Leadership
            </a>
          </div>
        </div>
      </Motion.div>
    </div>
  );
});

SignalRunModal.displayName = "SignalRunModal";
export default SignalRunModal;
