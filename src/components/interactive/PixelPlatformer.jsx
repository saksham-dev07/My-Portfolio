import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp,
  FileText,
  Mail,
  Gamepad2,
  Volume2,
  VolumeX,
  Music,
  Clock,
  Info,
  Zap,
  Shirt,
  Search,
  ExternalLink,
  Award
} from "lucide-react";
import { useSound } from "../../context/SoundContext";
import { useArcade } from "../../context/ArcadeContext";
import { resume } from "../../assets";

// Character Skins / Outfits
const SKINS = [
  { id: "cyber", name: "Cyber Tech", tag: "Default", color: "#0284c7", visor: "#22d3ee", cape: "#0284c7" },
  { id: "grad", name: "2027 Grad", tag: "Academic", color: "#18181b", visor: "#f59e0b", cape: "#f59e0b" },
  { id: "space", name: "Cloud Cadet", tag: "DevOps", color: "#f4f4f5", visor: "#fbbf24", cape: "#3b82f6" },
  { id: "matrix", name: "Neo Hacker", tag: "Phosphor", color: "#052e16", visor: "#22c55e", cape: "#15803d" },
];

// Comprehensive Resume Stages, Platforms & Relics
const ROOMS = [
  {
    id: 1,
    title: "Room 1: The Core Lab",
    subtitle: "Core Languages & Scalable Systems",
    badge: "Core Foundations",
    color: "#06b6d4",
    bgType: "server_lab",
    items: [
      { id: "py", x: 160, y: 220, label: "Python", desc: "Applied AI, PyTorch & Distributed PySpark", tag: "AI/ML", link: "https://github.com/saksham-dev07", collected: false },
      { id: "react", x: 290, y: 150, label: "React 19", desc: "Component Architecture, Concurrent Mode & Vite", tag: "Frontend", link: "#", collected: false },
      { id: "fastapi", x: 420, y: 190, label: "FastAPI", desc: "High-throughput async microservices & OpenAPI", tag: "Backend", link: "#", collected: false },
      { id: "docker", x: 550, y: 130, label: "Docker", desc: "Containerized deployments & multi-stage CI/CD", tag: "DevOps", link: "#", collected: false },
    ],
    relic: { x: 75, y: 120, label: "Floppy Disk (2020)", desc: "Saksham's first 'Hello World' script", tag: "Secret Relic", collected: false },
    platforms: [
      { x: 0, y: 340, w: 720, h: 40 }, // Ground
      { x: 110, y: 260, w: 100, h: 14 },
      { x: 250, y: 190, w: 110, h: 14 },
      { x: 380, y: 230, w: 90, h: 14 },
      { x: 510, y: 170, w: 110, h: 14 },
      { x: 50, y: 150, w: 55, h: 12 }, // Secret high ledge for relic
    ],
    springs: [],
    infoSign: { 
      x: 45, 
      y: 295, 
      title: "Core Engineering Philosophy",
      text: "Every architecture starts with strong mathematical fundamentals, clean async backends, and zero-compromise type safety." 
    }
  },
  {
    id: 2,
    title: "Room 2: The Project Vault",
    subtitle: "Production AI & Edge Deployments",
    badge: "Flagship Work",
    color: "#8b5cf6",
    bgType: "vault_grid",
    items: [
      { id: "deepfake", x: 170, y: 190, label: "Deepfake AI", desc: "Grad-CAM Neural Forensics (94.2% Validation Accuracy)", tag: "Computer Vision", link: "https://github.com/saksham-dev07", collected: false },
      { id: "ast", x: 340, y: 100, label: "AST Compiler", desc: "Deterministic Multi-Stage LLM Parser with rollback", tag: "GenAI", link: "https://github.com/saksham-dev07", collected: false },
      { id: "systems", x: 530, y: 180, label: "Edge Lab", desc: "Sub-15ms edge inference cluster benchmarked live", tag: "Systems", link: "#", collected: false },
    ],
    relic: { x: 335, y: 65, label: "Golden Neural Core", desc: "Production Weights V1 (Loss: 0.042)", tag: "Secret Relic", collected: false },
    platforms: [
      { x: 0, y: 340, w: 720, h: 40 },
      { x: 130, y: 230, w: 110, h: 14 },
      // Smooth moving platform
      { x: 290, y: 150, w: 95, h: 14, isMoving: true, baseX: 290, range: 45, speed: 1.2 },
      { x: 470, y: 220, w: 120, h: 14 },
      { x: 300, y: 90, w: 70, h: 12 }, // Vault high shelf for secret relic
    ],
    springs: [
      { x: 240, y: 326, w: 28, h: 14, power: -11.5 }
    ],
    infoSign: { 
      x: 45, 
      y: 295, 
      title: "Production Case Studies",
      text: "From explainable AI in computer vision to AST-constrained generative models, each build is audited for production load." 
    }
  },
  {
    id: 3,
    title: "Room 3: Academic Hall",
    subtitle: "Vellore Institute of Technology (VIT Bhopal)",
    badge: "Academics",
    color: "#10b981",
    bgType: "academic_stars",
    items: [
      { id: "cgpa", x: 190, y: 210, label: "CGPA: 8.46", desc: "B.Tech Computer Science & Engineering (Class of 2027)", tag: "Honors", link: "#", collected: false },
      { id: "dsa", x: 360, y: 150, label: "OS & Systems", desc: "Deep study in concurrency, kernel memory & network sockets", tag: "Theory", link: "#", collected: false },
      { id: "lead", x: 540, y: 120, label: "Lead Organizer", desc: "Directed logistics for 4,500+ participants across central India", tag: "Leadership", link: "#", collected: false },
    ],
    relic: { x: 440, y: 110, label: "Dean's Merit Scroll", desc: "Consistently ranked in the top 5% of the CS cohort", tag: "Secret Relic", collected: false },
    platforms: [
      { x: 0, y: 340, w: 720, h: 40 },
      { x: 150, y: 250, w: 110, h: 14 },
      // Moving floating campus step
      { x: 320, y: 190, w: 100, h: 14, isMoving: true, baseX: 320, range: 40, speed: 1.0 },
      { x: 490, y: 160, w: 130, h: 14 },
      { x: 410, y: 135, w: 60, h: 12 }, // Academic archive ledge
    ],
    springs: [],
    infoSign: { 
      x: 45, 
      y: 295, 
      title: "Academic Background",
      text: "Graduating 2027 with consistent academic honors and active tech club leadership at VIT Bhopal University." 
    }
  },
  {
    id: 4,
    title: "Room 4: The Cloud Summit",
    subtitle: "Industry Credentials & Grand Victory",
    badge: "Cloud Credentials",
    color: "#f59e0b",
    bgType: "cloud_summit",
    items: [
      { id: "aws_ai", x: 190, y: 200, label: "AWS AI", desc: "AWS Certified AI Practitioner (Foundational Model Architecture)", tag: "AWS Cert", link: "#", collected: false },
      { id: "aws_cloud", x: 370, y: 130, label: "AWS Cloud", desc: "AWS Certified Cloud Practitioner (VPC, IAM & S3 Security)", tag: "AWS Cert", link: "#", collected: false },
      { id: "trophy", x: 550, y: 90, label: "Cloud Summit", desc: "All 13 career milestones unlocked! Ready for hire.", tag: "Milestone", link: "#", collected: false },
    ],
    relic: { x: 620, y: 55, label: "Golden Crown", desc: "Multi-Cloud & GenAI Certified Architect", tag: "Secret Relic", collected: false },
    platforms: [
      { x: 0, y: 340, w: 720, h: 40 },
      { x: 150, y: 240, w: 110, h: 14 },
      { x: 320, y: 170, w: 120, h: 14 },
      { x: 500, y: 130, w: 130, h: 14 },
      { x: 590, y: 80, w: 60, h: 12 }, // Summit pinnacle ledge
    ],
    springs: [
      { x: 260, y: 326, w: 28, h: 14, power: -11.8 }
    ],
    infoSign: { 
      x: 45, 
      y: 295, 
      title: "Industry Validation",
      text: "Dual AWS certifications validating modern cloud architecture, cost engineering, and production generative AI." 
    }
  },
];

const PixelPlatformer = memo(() => {
  const { isPlatformerOpen, closePlatformer } = useArcade();
  const { 
    isMuted, 
    toggleMute, 
    playJump, 
    playDoubleJump, 
    playSpring, 
    playDoor, 
    playCoin, 
    playVictory 
  } = useSound();
  
  const canvasRef = useRef(null);

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [activeStoryToast, setActiveStoryToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showStoryToast = useCallback((toastData) => {
    setActiveStoryToast(toastData);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveStoryToast(null);
    }, 2800);
  }, []);

  const showStoryToastRef = useRef(showStoryToast);
  useEffect(() => {
    showStoryToastRef.current = showStoryToast;
  }, [showStoryToast]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isReadingSign, setIsReadingSign] = useState(false);
  const [nearSign, setNearSign] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // New Features: Skin selection, BGM chiptune toggle, Inspect milestone
  const [selectedSkin, setSelectedSkin] = useState("cyber");
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [inspectItem, setInspectItem] = useState(null);
  const [dashCooldown, setDashCooldown] = useState(0);

  // Character State
  const playerRef = useRef({
    x: 40,
    y: 280,
    vx: 0,
    vy: 0,
    w: 22,
    h: 28,
    isGrounded: false,
    canDoubleJump: true,
    facing: "right",
    walkFrame: 0,
    squashX: 1,
    squashY: 1,
    lastDash: 0,
  });

  const keysRef = useRef({ left: false, right: false, up: false, shift: false });
  const roomDataRef = useRef(JSON.parse(JSON.stringify(ROOMS)));
  const particlesRef = useRef([]);
  const ringsRef = useRef([]);
  const ghostTrailsRef = useRef([]);
  const floatingTextsRef = useRef([]);

  // Mobile & Desktop Scroll / Touch Lock
  useEffect(() => {
    if (!isPlatformerOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isPlatformerOpen]);

  // Chiptune Synthesizer Engine
  useEffect(() => {
    if (!isPlatformerOpen || isMuted || !isMusicEnabled || isGameWon) return;

    let audioCtx;
    let timerId;
    let step = 0;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      // Catchy upbeat retro pentatonic arpeggio (C Major / A Minor)
      const MELODY = [
        523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 440.0,
        587.33, 698.46, 880.0, 1174.66, 880.0, 698.46, 587.33, 523.25
      ];
      const BASS = [
        130.81, 130.81, 164.81, 164.81, 196.0, 196.0, 130.81, 130.81,
        146.83, 146.83, 174.61, 174.61, 220.0, 220.0, 130.81, 130.81
      ];

      const playStep = () => {
        if (!audioCtx || audioCtx.state === "closed") return;
        const now = audioCtx.currentTime;

        // 1. Melody note (Square wave, very subtle ~0.018 gain)
        const mFreq = MELODY[step % MELODY.length];
        const mOsc = audioCtx.createOscillator();
        const mGain = audioCtx.createGain();
        mOsc.type = "square";
        mOsc.frequency.setValueAtTime(mFreq, now);
        mGain.gain.setValueAtTime(0.016, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        mOsc.connect(mGain);
        mGain.connect(audioCtx.destination);
        mOsc.start(now);
        mOsc.stop(now + 0.15);

        // 2. Bass note (Triangle wave, warm grounding ~0.024 gain)
        if (step % 2 === 0) {
          const bFreq = BASS[step % BASS.length];
          const bOsc = audioCtx.createOscillator();
          const bGain = audioCtx.createGain();
          bOsc.type = "triangle";
          bOsc.frequency.setValueAtTime(bFreq, now);
          bGain.gain.setValueAtTime(0.024, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          bOsc.connect(bGain);
          bGain.connect(audioCtx.destination);
          bOsc.start(now);
          bOsc.stop(now + 0.28);
        }

        step = (step + 1) % 16;
      };

      timerId = setInterval(playStep, 170); // ~176 BPM 8-bit tempo
    } catch {
      // AudioContext failure safety
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isPlatformerOpen, isMuted, isMusicEnabled, isGameWon]);

  // Speedrun timer
  useEffect(() => {
    if (!isPlatformerOpen || isGameWon) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlatformerOpen, isGameWon]);

  // Dash cooldown decay
  useEffect(() => {
    if (dashCooldown <= 0) return;
    const timer = setInterval(() => {
      setDashCooldown((c) => Math.max(0, c - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [dashCooldown]);

  // Reset game
  const resetGame = useCallback(() => {
    roomDataRef.current = JSON.parse(JSON.stringify(ROOMS));
    setCurrentRoomIndex(0);
    setScore(0);
    setIsGameWon(false);
    setActiveStoryToast(null);
    setIsReadingSign(false);
    setInspectItem(null);
    setTimerSeconds(0);
    particlesRef.current = [];
    ringsRef.current = [];
    ghostTrailsRef.current = [];
    floatingTextsRef.current = [];
    playerRef.current = {
      x: 40,
      y: 280,
      vx: 0,
      vy: 0,
      w: 22,
      h: 28,
      isGrounded: false,
      canDoubleJump: true,
      facing: "right",
      walkFrame: 0,
      squashX: 1,
      squashY: 1,
      lastDash: 0,
    };
  }, []);

  // Jump to specific room
  const switchRoom = useCallback((roomIdx) => {
    if (roomIdx < 0 || roomIdx >= ROOMS.length) return;
    setCurrentRoomIndex(roomIdx);
    playerRef.current.x = 40;
    playerRef.current.y = 280;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    setIsReadingSign(false);
    playDoor();
    showStoryToast({
      title: ROOMS[roomIdx].title,
      desc: ROOMS[roomIdx].subtitle,
      tag: ROOMS[roomIdx].badge,
    });
  }, [playDoor, showStoryToast]);

  // Dash boost execution
  const handleDashTrigger = useCallback(() => {
    const now = Date.now();
    const player = playerRef.current;
    if (now - player.lastDash < 1000) return; // 1s cooldown

    player.lastDash = now;
    setDashCooldown(1.0);
    const dashDistance = player.facing === "right" ? 32 : -32;

    // Leave 3 ghost afterimages
    for (let g = 0; g < 3; g++) {
      ghostTrailsRef.current.push({
        x: player.x + (dashDistance / 3) * g,
        y: player.y,
        facing: player.facing,
        alpha: 0.5 - g * 0.12,
        color: SKINS.find((s) => s.id === selectedSkin)?.visor || "#22d3ee",
      });
    }

    player.x += dashDistance;
    player.vx = player.facing === "right" ? 3.8 : -3.8;
    playDoubleJump();

    // Dash burst sparks
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: player.x + 11,
        y: player.y + 14,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        color: "#38bdf8",
        size: Math.random() * 2 + 1,
        life: 0.8,
        decay: 0.08,
      });
    }
  }, [selectedSkin, playDoubleJump]);

  // Jump Trigger helper with double jump
  const handleJumpTrigger = useCallback(() => {
    const player = playerRef.current;
    if (player.isGrounded) {
      player.vy = -8.5;
      player.isGrounded = false;
      player.canDoubleJump = true;
      player.squashX = 0.85;
      player.squashY = 1.18;
      playJump();
      // Jump dust puff
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x: player.x + 11,
          y: player.y + player.h,
          vx: (Math.random() - 0.5) * 2.5,
          vy: Math.random() * -1.2,
          color: "rgba(255, 255, 255, 0.45)",
          size: Math.random() * 2.5 + 1,
          life: 0.9,
          decay: 0.08,
        });
      }
    } else if (player.canDoubleJump) {
      player.vy = -7.5;
      player.canDoubleJump = false;
      player.squashX = 0.82;
      player.squashY = 1.22;
      playDoubleJump();
      // Expanding ring below player
      ringsRef.current.push({
        x: player.x + 11,
        y: player.y + player.h,
        radius: 4,
        maxRadius: 24,
        color: "#22d3ee",
        alpha: 0.85,
      });
    }
  }, [playJump, playDoubleJump]);

  // Keyboard input listeners
  useEffect(() => {
    if (!isPlatformerOpen) return;

    const handleKeyDown = (e) => {
      if (["ArrowLeft", "KeyA", "a"].includes(e.code) || e.key === "ArrowLeft") {
        keysRef.current.left = true;
      }
      if (["ArrowRight", "KeyD", "d"].includes(e.code) || e.key === "ArrowRight") {
        keysRef.current.right = true;
      }
      if (["ArrowUp", "Space", "KeyW", "w"].includes(e.code) || e.key === " " || e.key === "ArrowUp") {
        if (!keysRef.current.up) {
          handleJumpTrigger();
        }
        keysRef.current.up = true;
      }
      if (["ShiftLeft", "ShiftRight", "KeyK", "k"].includes(e.code)) {
        handleDashTrigger();
      }
      if (["KeyE", "e"].includes(e.code) || e.key === "e" || e.key === "E") {
        if (nearSign) {
          setIsReadingSign((prev) => !prev);
        }
      }
      if (e.key === "Escape") {
        if (isReadingSign) {
          setIsReadingSign(false);
        } else if (inspectItem) {
          setInspectItem(null);
        } else {
          closePlatformer();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (["ArrowLeft", "KeyA", "a"].includes(e.code) || e.key === "ArrowLeft") {
        keysRef.current.left = false;
      }
      if (["ArrowRight", "KeyD", "d"].includes(e.code) || e.key === "ArrowRight") {
        keysRef.current.right = false;
      }
      if (["ArrowUp", "Space", "KeyW", "w"].includes(e.code) || e.key === " " || e.key === "ArrowUp") {
        keysRef.current.up = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlatformerOpen, nearSign, isReadingSign, inspectItem, handleJumpTrigger, handleDashTrigger, closePlatformer]);

  // Main Canvas Physics & Render Loop
  useEffect(() => {
    if (!isPlatformerOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animId;
    const CANVAS_WIDTH = 720;
    const CANVAS_HEIGHT = 380;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Ambient floating dust particles
    const ambientStars = Array.from({ length: 42 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (CANVAS_HEIGHT - 60),
      speed: Math.random() * 0.4 + 0.1,
      size: Math.random() * 1.8 + 0.8,
      phase: Math.random() * Math.PI * 2,
    }));

    let lastTime = 0;
    const render = (time) => {
      const deltaMs = lastTime ? time - lastTime : 16.67;
      lastTime = time;
      // Normalizes to 60fps (16.67ms = 1.0), clamping for safety on background/tab switch
      const dt = Math.min(Math.max(deltaMs / 16.67, 0.35), 2.0);

      const room = roomDataRef.current[currentRoomIndex];
      const player = playerRef.current;
      const keys = keysRef.current;

      // Update Moving Platforms
      for (const plat of room.platforms) {
        if (plat.isMoving) {
          const prevX = plat.x;
          plat.x = plat.baseX + Math.sin(Date.now() * 0.0018 * (plat.speed || 1)) * (plat.range || 40);
          plat.dx = plat.x - prevX;
        }
      }

      // --- 1. Physics Update ---
      const MAX_SPEED = 2.5;
      const ACCEL = 0.55 * dt;

      if (keys.left) {
        player.vx = Math.max(-MAX_SPEED, player.vx - ACCEL);
        player.facing = "left";
        player.walkFrame += 0.14 * dt;
        // Running dust
        if (player.isGrounded && Math.random() < 0.2) {
          particlesRef.current.push({
            x: player.x + player.w,
            y: player.y + player.h - 2,
            vx: (Math.random() * 1.2 + 0.3) * dt,
            vy: -Math.random() * 0.8 * dt,
            color: "rgba(255, 255, 255, 0.35)",
            size: Math.random() * 2 + 1,
            life: 0.8,
            decay: 0.08,
          });
        }
      } else if (keys.right) {
        player.vx = Math.min(MAX_SPEED, player.vx + ACCEL);
        player.facing = "right";
        player.walkFrame += 0.14 * dt;
        // Running dust
        if (player.isGrounded && Math.random() < 0.2) {
          particlesRef.current.push({
            x: player.x,
            y: player.y + player.h - 2,
            vx: -(Math.random() * 1.2 + 0.3) * dt,
            vy: -Math.random() * 0.8 * dt,
            color: "rgba(255, 255, 255, 0.35)",
            size: Math.random() * 2 + 1,
            life: 0.8,
            decay: 0.08,
          });
        }
      } else {
        player.vx *= Math.pow(0.74, dt);
      }

      const GRAVITY = 0.40 * dt;
      player.vy += GRAVITY;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Character squash & stretch recovery
      player.squashX += (1 - player.squashX) * 0.15;
      player.squashY += (1 - player.squashY) * 0.15;

      // Platform Collisions
      const prevGrounded = player.isGrounded;
      player.isGrounded = false;

      for (const plat of room.platforms) {
        if (
          player.x + player.w > plat.x &&
          player.x < plat.x + plat.w &&
          player.y + player.h >= plat.y &&
          player.y + player.h <= plat.y + plat.h + 14 &&
          player.vy >= 0
        ) {
          player.y = plat.y - player.h;
          player.vy = 0;
          player.isGrounded = true;
          player.canDoubleJump = true;

          // Drag along moving platform
          if (plat.isMoving && plat.dx) {
            player.x += plat.dx;
          }

          // Landing squash & dust puff
          if (!prevGrounded) {
            player.squashX = 1.25;
            player.squashY = 0.8;
            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                x: player.x + (i % 2 === 0 ? 0 : player.w),
                y: player.y + player.h,
                vx: (i % 2 === 0 ? -1 : 1) * (Math.random() * 2 + 1),
                vy: -Math.random() * 1.2,
                color: "rgba(255, 255, 255, 0.4)",
                size: Math.random() * 2.5 + 1,
                life: 0.9,
                decay: 0.09,
              });
            }
          }
          break;
        }
      }

      // Spring Launchers / Kinetic Bounce Pads
      if (room.springs) {
        for (const spring of room.springs) {
          if (
            player.x + player.w > spring.x &&
            player.x < spring.x + spring.w &&
            player.y + player.h >= spring.y &&
            player.y + player.h <= spring.y + spring.h + 10 &&
            player.vy >= 0
          ) {
            player.vy = spring.power || -13.5;
            player.isGrounded = false;
            player.canDoubleJump = true;
            player.squashX = 0.7;
            player.squashY = 1.45;
            playSpring();

            // Kinetic burst particles
            for (let i = 0; i < 10; i++) {
              particlesRef.current.push({
                x: spring.x + spring.w / 2,
                y: spring.y,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                color: room.color,
                size: Math.random() * 3 + 2,
                life: 1,
                decay: 0.06,
              });
            }
          }
        }
      }

      // Screen boundaries
      if (player.x < 10) player.x = 10;

      // Check proximity to Info Sign
      if (room.infoSign) {
        const distToSign = Math.hypot(player.x - room.infoSign.x, player.y - room.infoSign.y);
        setNearSign(distToSign < 45);
      } else {
        setNearSign(false);
      }

      // Doorway Trigger: walking past right edge advances to next room
      const DOOR_X = CANVAS_WIDTH - 48;
      if (player.x > DOOR_X) {
        if (currentRoomIndex < roomDataRef.current.length - 1) {
          const nextIndex = currentRoomIndex + 1;
          setCurrentRoomIndex(nextIndex);
          player.x = 30;
          player.y = 280;
          player.vx = 0;
          playDoor();
          setActiveStoryToast({
            title: `Entered ${roomDataRef.current[nextIndex].title}`,
            desc: roomDataRef.current[nextIndex].subtitle,
            tag: roomDataRef.current[nextIndex].badge,
          });
        } else {
          // Reached end of final room!
          setIsGameWon(true);
          playVictory();
        }
      }

      // Coin/Item Collections with explosive particles
      for (const item of room.items) {
        if (!item.collected) {
          const dist = Math.hypot(player.x + 11 - item.x, player.y + 14 - item.y);
          if (dist < 28) {
            item.collected = true;
            setScore((s) => s + 100);
            playCoin();
            showStoryToastRef.current?.({
              title: `Milestone: ${item.label}`,
              desc: item.desc,
              tag: item.tag,
            });

            // Explosive spark shower
            for (let i = 0; i < 14; i++) {
              const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
              const spd = Math.random() * 3.5 + 2;
              particlesRef.current.push({
                x: item.x,
                y: item.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 1,
                color: room.color,
                size: Math.random() * 3 + 2,
                life: 1,
                decay: 0.04,
              });
            }

            // Floating Score text
            floatingTextsRef.current.push({
              x: item.x,
              y: item.y - 10,
              text: "+100 PTS",
              color: "#38bdf8",
              alpha: 1,
              vy: -1.2,
            });
          }
        }
      }

      // Secret Relic Collection
      if (room.relic && !room.relic.collected) {
        const distToRelic = Math.hypot(player.x + 11 - room.relic.x, player.y + 14 - room.relic.y);
        if (distToRelic < 28) {
          room.relic.collected = true;
          setScore((s) => s + 250);
          playVictory();
          showStoryToastRef.current?.({
            title: `SECRET FOUND: ${room.relic.label}`,
            desc: room.relic.desc,
            tag: "Secret Relic",
          });

          // Golden spark shower
          for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const spd = Math.random() * 4 + 2;
            particlesRef.current.push({
              x: room.relic.x,
              y: room.relic.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 1.5,
              color: "#f59e0b",
              size: Math.random() * 3.5 + 2,
              life: 1.2,
              decay: 0.035,
            });
          }

          floatingTextsRef.current.push({
            x: room.relic.x,
            y: room.relic.y - 12,
            text: "+250 SECRET BONUS!",
            color: "#fbbf24",
            alpha: 1,
            vy: -1.4,
          });
        }
      }

      // --- 2. Render Environment ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (room.bgType === "server_lab") {
        // High-tech Core Lab Server Room
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#030712");
        bgGrad.addColorStop(1, "#081325");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Blinking Server Racks in background
        const rackPositions = [80, 220, 360, 500, 630];
        for (const rx of rackPositions) {
          ctx.fillStyle = "#0c1829";
          ctx.fillRect(rx, 60, 38, 280);
          ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
          ctx.strokeRect(rx, 60, 38, 280);

          for (let u = 0; u < 9; u++) {
            const uy = 70 + u * 28;
            ctx.fillStyle = "#061322";
            ctx.fillRect(rx + 3, uy, 32, 20);

            const t = Date.now() * 0.003 + rx + u;
            ctx.fillStyle = Math.sin(t * 2) > 0 ? "#22c55e" : "#14532d";
            ctx.fillRect(rx + 6, uy + 8, 3, 3);
            ctx.fillStyle = Math.cos(t * 3) > 0 ? "#06b6d4" : "#164e63";
            ctx.fillRect(rx + 12, uy + 8, 3, 3);
            ctx.fillStyle = Math.sin(t * 1.5) > 0.3 ? "#f59e0b" : "#78350f";
            ctx.fillRect(rx + 18, uy + 8, 3, 3);
          }
        }
      } else if (room.bgType === "vault_grid") {
        // Futuristic Neural Network Project Vault
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#080312");
        bgGrad.addColorStop(1, "#140728");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = "rgba(139, 92, 246, 0.12)";
        ctx.lineWidth = 1;
        const nodes = [
          { x: 100, y: 120 }, { x: 220, y: 70 }, { x: 330, y: 130 },
          { x: 450, y: 80 }, { x: 580, y: 120 }, { x: 670, y: 70 },
          { x: 180, y: 200 }, { x: 400, y: 210 }, { x: 540, y: 220 }
        ];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < 160) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (room.bgType === "academic_stars") {
        // Academic Hall with Starry Sky & VIT Campus Skyline
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#020d09");
        bgGrad.addColorStop(1, "#051f16");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "#03140e";
        ctx.fillRect(60, 160, 140, 180);
        ctx.fillRect(100, 110, 60, 50);
        ctx.beginPath();
        ctx.arc(130, 110, 30, Math.PI, 0);
        ctx.fill();

        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillStyle = "rgba(251, 191, 36, 0.18)";
            ctx.fillRect(80 + c * 35, 180 + r * 32, 16, 20);
          }
        }
        ctx.fillStyle = "#03140e";
        ctx.fillRect(380, 190, 200, 150);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
            ctx.fillRect(405 + c * 42, 210 + r * 36, 18, 22);
          }
        }
      } else {
        // Cloud Summit with Mountain Horizons & Celestial Moon
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#0d0702");
        bgGrad.addColorStop(1, "#261305");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.shadowColor = "rgba(251, 191, 36, 0.4)";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.arc(620, 80, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#120903";
        ctx.beginPath();
        ctx.moveTo(0, 340);
        ctx.lineTo(140, 180);
        ctx.lineTo(260, 290);
        ctx.lineTo(410, 150);
        ctx.lineTo(560, 270);
        ctx.lineTo(720, 130);
        ctx.lineTo(720, 340);
        ctx.fill();
      }

      // Ambient Floating Stars / Specks
      const timeNow = Date.now() * 0.002;
      for (const star of ambientStars) {
        const starAlpha = (Math.sin(timeNow + star.phase) + 1) * 0.35 + 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }

      // Platforms with Bevels & Neon Linings
      for (const plat of room.platforms) {
        ctx.fillStyle = plat.isMoving ? "#1e293b" : "#111827";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        ctx.save();
        ctx.fillStyle = plat.isMoving ? "#38bdf8" : room.color;
        ctx.shadowColor = plat.isMoving ? "#38bdf8" : room.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        for (let px = plat.x + 8; px < plat.x + plat.w - 8; px += 16) {
          ctx.fillRect(px, plat.y + 6, 2, 2);
        }
      }

      // Spring Launchers / Kinetic Bounce Pads
      if (room.springs) {
        for (const spring of room.springs) {
          ctx.save();
          ctx.fillStyle = "#27272a";
          ctx.fillRect(spring.x, spring.y + 6, spring.w, 8);
          ctx.strokeStyle = room.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(spring.x + 4, spring.y + 10);
          ctx.lineTo(spring.x + spring.w / 2, spring.y + 2);
          ctx.lineTo(spring.x + spring.w - 4, spring.y + 10);
          ctx.stroke();
          ctx.fillStyle = room.color;
          ctx.shadowColor = room.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(spring.x, spring.y, spring.w, 3);
          ctx.restore();
        }
      }

      // Info Terminal Signpost
      if (room.infoSign) {
        ctx.save();
        ctx.fillStyle = "#27272a";
        ctx.fillRect(room.infoSign.x, room.infoSign.y, 14, 26);
        ctx.fillStyle = room.color;
        ctx.shadowColor = room.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(room.infoSign.x + 2, room.infoSign.y + 2, 10, 10);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("i", room.infoSign.x + 7, room.infoSign.y + 10);

        if (nearSign) {
          ctx.fillStyle = "#fef08a";
          ctx.font = "bold 9px monospace";
          ctx.fillText("[E] Read", room.infoSign.x + 7, room.infoSign.y - 6);
        }
        ctx.restore();
      }

      // Doorway / Exit Portal on right
      ctx.save();
      const portalPulse = Math.sin(Date.now() * 0.006) * 4;
      ctx.fillStyle = room.color;
      ctx.shadowColor = room.color;
      ctx.shadowBlur = 18 + portalPulse;
      ctx.fillRect(DOOR_X, 260, 26, 80);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(DOOR_X + 6, 268, 14, 64);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(currentRoomIndex === 3 ? "GOAL" : "NEXT", DOOR_X + 13, 250);
      ctx.restore();

      // Collectible Floating Milestone Orbs
      const now = Date.now() * 0.004;
      for (const item of room.items) {
        if (!item.collected) {
          const hoverY = item.y + Math.sin(now + item.x) * 4.5;

          ctx.save();
          ctx.shadowColor = room.color;
          ctx.shadowBlur = 14;

          ctx.fillStyle = room.color;
          ctx.beginPath();
          ctx.arc(item.x, hoverY, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(item.x - 2.5, hoverY - 2.5, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#f4f4f5";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(item.label, item.x, hoverY - 15);
          ctx.restore();
        }
      }

      // Secret Relic in Room
      if (room.relic && !room.relic.collected) {
        const relicHover = room.relic.y + Math.sin(now * 1.5) * 3.5;
        ctx.save();
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        // Star diamond shape
        ctx.moveTo(room.relic.x, relicHover - 8);
        ctx.lineTo(room.relic.x + 8, relicHover);
        ctx.lineTo(room.relic.x, relicHover + 8);
        ctx.lineTo(room.relic.x - 8, relicHover);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(room.relic.x - 2, relicHover - 2, 4, 4);

        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SECRET", room.relic.x, relicHover - 13);
        ctx.restore();
      }

      // Ghost Trails (Dash afterimages)
      for (let i = ghostTrailsRef.current.length - 1; i >= 0; i--) {
        const gt = ghostTrailsRef.current[i];
        gt.alpha -= 0.05;
        if (gt.alpha <= 0) {
          ghostTrailsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, gt.alpha);
          ctx.fillStyle = gt.color;
          ctx.fillRect(gt.x + 4, gt.y + 4, 14, 20);
          ctx.restore();
        }
      }

      // Particle Bursts & Dust
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.restore();
        }
      }

      // Expanding Jump Rings
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const r = ringsRef.current[i];
        r.radius += 1.8;
        r.alpha -= 0.06;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ringsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, r.alpha);
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Floating Score / XP Popups
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.025;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.alpha);
          ctx.fillStyle = ft.color;
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }

      // --- 3. Draw Pixel Character with Selected Skin ---
      ctx.save();
      const px = Math.round(player.x);
      const py = Math.round(player.y);
      const skin = SKINS.find((s) => s.id === selectedSkin) || SKINS[0];

      // Character Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(px + 11, py + player.h + 2, 9 * player.squashX, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Squash & Stretch
      ctx.translate(px + 11, py + player.h);
      ctx.scale(player.squashX, player.squashY);
      ctx.translate(-(px + 11), -(py + player.h));

      // Flapping Cape / Scarf
      const capeOffset = Math.sin(player.walkFrame * 1.5) * 4 - player.vx * 1.5;
      ctx.fillStyle = skin.cape;
      ctx.fillRect(
        player.facing === "right" ? px + 2 : px + 16,
        py + 10,
        4 + Math.abs(player.vx) * 0.8,
        10 + Math.abs(capeOffset) * 0.5
      );

      // Body / Jacket
      ctx.fillStyle = skin.color;
      ctx.fillRect(px + 4, py + 8, 14, 12);

      // Head
      ctx.fillStyle = "#fdba74";
      ctx.fillRect(px + 6, py + 1, 10, 8);

      // Skin-Specific Hat / Hair / Helmet
      if (skin.id === "grad") {
        // Mortarboard Cap & Gold Tassel
        ctx.fillStyle = "#18181b";
        ctx.fillRect(px + 3, py - 2, 16, 4);
        ctx.fillStyle = "#f59e0b"; // Gold Tassel
        ctx.fillRect(px + (player.facing === "right" ? 17 : 3), py, 2, 6);
      } else if (skin.id === "space") {
        // Astronaut Bubble Helmet
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(px + 4, py - 2, 14, 12);
        ctx.fillStyle = skin.visor;
        ctx.fillRect(px + 6, py + 1, 10, 6);
      } else {
        // Undercut Hair
        ctx.fillStyle = skin.id === "matrix" ? "#14532d" : "#18181b";
        ctx.fillRect(px + 5, py, 12, 3);
        if (player.facing === "left") {
          ctx.fillRect(px + 5, py + 2, 4, 4);
        } else {
          ctx.fillRect(px + 13, py + 2, 4, 4);
        }
      }

      // Visor / Glasses (if not space helmet)
      if (skin.id !== "space") {
        ctx.fillStyle = skin.visor;
        ctx.shadowColor = skin.visor;
        ctx.shadowBlur = 6;
        if (player.facing === "right") {
          ctx.fillRect(px + 11, py + 4, 5, 2);
        } else {
          ctx.fillRect(px + 6, py + 4, 5, 2);
        }
      }

      // Legs / Walking & Jumping Animation
      ctx.fillStyle = skin.id === "space" ? "#cbd5e1" : "#27272a";
      const legOffset = Math.sin(player.walkFrame) * 3.5;
      if (player.isGrounded && Math.abs(player.vx) > 0.4) {
        ctx.fillRect(px + 6, py + 20, 4, 8 + legOffset);
        ctx.fillRect(px + 12, py + 20, 4, 8 - legOffset);
      } else if (!player.isGrounded) {
        ctx.fillRect(px + 5, py + 19, 4, 6);
        ctx.fillRect(px + 13, py + 19, 4, 6);
      } else {
        ctx.fillRect(px + 6, py + 20, 4, 8);
        ctx.fillRect(px + 12, py + 20, 4, 8);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlatformerOpen, currentRoomIndex, nearSign, selectedSkin, playDoor, playCoin, playSpring, playVictory]);

  if (!isPlatformerOpen) return null;

  const currentRoom = ROOMS[currentRoomIndex];

  // Calculate total milestones & relics
  const allItems = roomDataRef.current.flatMap((r) => r.items);
  const totalMilestones = allItems.length;
  const collectedMilestones = allItems.filter((i) => i.collected).length;
  const collectedRelics = roomDataRef.current.filter((r) => r.relic && r.relic.collected).length;
  const progressPercent = Math.round((collectedMilestones / totalMilestones) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-4 bg-black/90 backdrop-blur-xl select-none">
      <Motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-4xl max-h-[98dvh] rounded-2xl sm:rounded-3xl bg-zinc-950 border-2 border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col font-mono"
      >
        {/* Arcade Titlebar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 bg-zinc-900/90 border-b border-white/10 select-none shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-cyan-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
                SakshamOS<span className="hidden sm:inline">: Platformer Resume</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Speedrun Clock */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <Clock size={12} className="text-cyan-400" />
              <span>{timerSeconds.toFixed(1)}s</span>
            </div>

            {/* Score & Progress Pill */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 sm:px-2.5 py-0.8 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-[11px] sm:text-xs">
                {score} PTS
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.8 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 font-bold text-[11px]">
                {collectedMilestones}/{totalMilestones} ({progressPercent}%)
              </span>
              {collectedRelics > 0 && (
                <span className="px-2 py-0.8 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[11px] hidden sm:inline-block">
                  RELICS: {collectedRelics}/4
                </span>
              )}
            </div>

            {/* BGM Toggle */}
            <button
              type="button"
              onClick={() => setIsMusicEnabled((v) => !v)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                isMusicEnabled && !isMuted
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/5 text-zinc-500 border-white/10 hover:text-zinc-300"
              }`}
              title={isMusicEnabled ? "Chiptune Music: ON" : "Chiptune Music: OFF"}
            >
              <Music size={14} />
            </button>

            {/* SFX Mute Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-cyan-400" />}
            </button>

            {/* Reset Level Button */}
            <button
              type="button"
              onClick={resetGame}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
              title="Restart Level"
            >
              <RotateCcw size={15} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closePlatformer}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer touch-manipulation"
              title="Close Arcade"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Room Navigation Tabs Bar & Skin Selector */}
        <div className="px-2.5 sm:px-6 py-1.5 sm:py-2 bg-zinc-900/60 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {/* Room Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
            {ROOMS.map((r, idx) => {
              const isCurrent = currentRoomIndex === idx;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => switchRoom(idx)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap touch-manipulation ${
                    isCurrent
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="sm:hidden">R{r.id}</span>
                  <span className="hidden sm:inline">R{r.id}: {r.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Skin Selector */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 shrink-0">
            <span className="text-[10px] text-zinc-400 px-1 font-bold uppercase tracking-wider flex items-center gap-1">
              <Shirt size={11} className="text-cyan-400" />
              <span className="hidden md:inline">Outfit:</span>
            </span>
            {SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                onClick={() => setSelectedSkin(skin.id)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer touch-manipulation ${
                  selectedSkin === skin.id
                    ? "bg-cyan-500 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title={skin.name}
              >
                <span>{skin.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Gameport */}
        <div className="relative w-full aspect-[720/380] bg-zinc-950 overflow-hidden flex items-center justify-center touch-none select-none">
          <canvas
            ref={canvasRef}
            onClick={handleJumpTrigger}
            className="w-full h-full object-contain cursor-pointer touch-none"
            style={{ imageRendering: "pixelated" }}
          />

          {/* CRT Scanline Overlay */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent opacity-60 bg-[length:100%_4px]"
            aria-hidden="true"
          />

          {/* In-Game Narrative Toast */}
          <AnimatePresence>
            {activeStoryToast && !isGameWon && (
              <Motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                onClick={() => setActiveStoryToast(null)}
                className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-zinc-950/92 border border-cyan-400/50 text-center shadow-2xl backdrop-blur-md pointer-events-auto cursor-pointer max-w-[85%] sm:max-w-sm z-20 transition-transform active:scale-95"
                title="Tap to dismiss"
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                    {activeStoryToast.tag || "Milestone"}
                  </span>
                  <p className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                    {activeStoryToast.title}
                  </p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-300 leading-tight line-clamp-2">
                  {activeStoryToast.desc}
                </p>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collected Inventory / Milestones Tray */}
        <div className="px-2.5 sm:px-6 py-1.5 sm:py-2 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between gap-2 sm:gap-3 text-xs overflow-x-auto no-scrollbar select-none shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Inventory:</span>
            <span className="text-[11px] font-bold text-cyan-400">{collectedMilestones}/{totalMilestones}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {allItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.collected && setInspectItem(item)}
                disabled={!item.collected}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 touch-manipulation ${
                  item.collected
                    ? "bg-white/10 hover:bg-cyan-500/20 text-zinc-200 hover:text-cyan-300 border border-white/15 cursor-pointer shadow-sm"
                    : "bg-white/[0.02] text-zinc-600 border border-white/5 cursor-not-allowed"
                }`}
                title={item.collected ? `Inspect ${item.label}` : "Undiscovered milestone"}
              >
                <span>{item.collected ? "✓" : "○"}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <span className="text-[10px] text-zinc-500 hidden xl:inline shrink-0">
            [Shift] Dash &bull; [Space x2] Double Jump &bull; [E] Terminal
          </span>
        </div>

        {/* Mobile On-Screen Touch Controls */}
        <div
          className="sm:hidden px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] bg-zinc-900/95 border-t border-white/10 flex items-center justify-between select-none touch-none shrink-0"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                keysRef.current.left = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                keysRef.current.left = false;
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                keysRef.current.left = false;
              }}
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              onMouseLeave={() => (keysRef.current.left = false)}
              className="w-12 h-12 rounded-2xl bg-zinc-800/90 active:bg-cyan-500/30 border border-white/15 flex items-center justify-center text-white active:text-cyan-300 cursor-pointer active:scale-95 shadow-md touch-none select-none transition-transform"
              aria-label="Move Left"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                keysRef.current.right = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                keysRef.current.right = false;
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                keysRef.current.right = false;
              }}
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              onMouseLeave={() => (keysRef.current.right = false)}
              className="w-12 h-12 rounded-2xl bg-zinc-800/90 active:bg-cyan-500/30 border border-white/15 flex items-center justify-center text-white active:text-cyan-300 cursor-pointer active:scale-95 shadow-md touch-none select-none transition-transform"
              aria-label="Move Right"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dash Button */}
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                handleDashTrigger();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleDashTrigger();
              }}
              disabled={dashCooldown > 0}
              className={`px-3 sm:px-3.5 h-12 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1 active:scale-95 shadow-md touch-none select-none transition-transform ${
                dashCooldown <= 0
                  ? "bg-purple-600/30 border-purple-400/40 text-purple-300 active:bg-purple-500/40"
                  : "bg-white/5 border-white/10 text-zinc-600"
              }`}
            >
              <Zap size={14} />
              <span>DASH</span>
            </button>

            {nearSign && (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  setIsReadingSign(true);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsReadingSign(true);
                }}
                className="px-2.5 sm:px-3 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 touch-none select-none"
              >
                <Info size={14} />
                <span>READ</span>
              </button>
            )}

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                handleJumpTrigger();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleJumpTrigger();
              }}
              className="px-4 sm:px-5 h-12 rounded-2xl bg-cyan-500 active:bg-cyan-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/30 touch-none select-none transition-transform"
            >
              <ArrowUp size={16} />
              <span>JUMP</span>
            </button>
          </div>
        </div>

        {/* Signpost Reader Dialog Modal (Card Overlay) */}
        <AnimatePresence>
          {isReadingSign && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-40"
            >
              <div className="max-w-md w-full bg-zinc-900 border border-cyan-400/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Info size={16} />
                    <span>{currentRoom.infoSign.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReadingSign(false)}
                    className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {currentRoom.infoSign.text}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsReadingSign(false)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    Close [Esc]
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Inspect Collected Milestone Modal (Card Overlay) */}
        <AnimatePresence>
          {inspectItem && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-40"
            >
              <div className="max-w-md w-full bg-zinc-900 border border-cyan-400/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Award size={16} />
                    <span>{inspectItem.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectItem(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    {inspectItem.tag}
                  </span>
                  <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                    {inspectItem.desc}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <a
                    href="https://github.com/saksham-dev07"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                  >
                    <span>View GitHub Code</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setInspectItem(null)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    Back to Game
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Victory Modal Overlay (Overlays entire arcade card) */}
        {isGameWon && (
          <div className="absolute inset-0 bg-zinc-950/96 backdrop-blur-xl flex flex-col items-center justify-center p-5 sm:p-8 text-center z-50 overflow-y-auto no-scrollbar">
            <Trophy size={42} className="text-amber-400 mb-2 animate-bounce shrink-0" />
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-1.5 shrink-0">
              RESUME RUN COMPLETED!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-md mb-4 font-sans leading-relaxed shrink-0">
              You've piloted Saksham through engineering foundations, production AI systems, academics at VIT Bhopal, and AWS Cloud certifications!
            </p>

            <div className="flex items-center gap-2 sm:gap-3 mb-5 flex-wrap justify-center shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold">
                <Sparkles size={14} />
                <span>SCORE: {score + 500} PTS</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <Clock size={14} />
                <span>TIME: {timerSeconds.toFixed(1)}s</span>
              </div>
              {collectedRelics === 4 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
                  <span>100% COMPLETIONIST</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href={resume}
                download="Saksham_Agarwal_Resume.pdf"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
              >
                <FileText size={14} />
                <span>Download Official PDF</span>
              </a>
              <a
                href="mailto:sakmmm07@gmail.com?subject=Saw%20Your%20Interactive%20Resume%20Game!"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg cursor-pointer"
              >
                <Mail size={14} />
                <span>Email Saksham</span>
              </a>
              <button
                type="button"
                onClick={resetGame}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </Motion.div>
    </div>
  );
});

PixelPlatformer.displayName = "PixelPlatformer";
export default PixelPlatformer;
