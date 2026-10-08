import { useGLTF } from "@react-three/drei/core/Gltf.js";
import { OrbitControls } from "@react-three/drei/core/OrbitControls.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ArrowUpRight,
  Box,
  Code2,
  Layers3,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box3, MathUtils, Vector3 } from "three";
import "../../styles/workstation.css";

const MODEL_URL = new URL(
  "../../assets/models/workstation.glb",
  import.meta.url,
).href;
const TARGET = [0, 0.15, 0];
const VIEWS = [
  { name: "Desk", icon: Code2, position: [10.4, 5.2, 6.5], target: TARGET },
  {
    name: "Screen",
    icon: Maximize2,
    position: [7.3, 2.7, 2.5],
    target: [-0.36, 0.75, 0.69],
  },
  {
    name: "Blueprint",
    icon: Layers3,
    position: [7.8, 10, 7.5],
    target: TARGET,
  },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off",
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setReduced(
        query.matches || document.documentElement.dataset.motion === "off",
      );
    query.addEventListener("change", update);
    window.addEventListener("portfolio-motion-change", update);
    update();
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("portfolio-motion-change", update);
    };
  }, []);
  return reduced;
}

class DeskBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onUnavailable();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function OriginalDesk({ onReady, onScreenSelect }) {
  const { scene } = useGLTF(MODEL_URL, "/desktop_pc/draco/");
  const desk = useMemo(() => {
    const copy = scene.clone(true);
    copy.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(copy);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 7 / Math.max(size.x, size.z);
    copy.scale.setScalar(scale);
    copy.position.set(
      -center.x * scale,
      -bounds.min.y * scale - 1.2,
      -center.z * scale,
    );
    return copy;
  }, [scene]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <primitive
      object={desk}
      dispose={null}
      onClick={(event) => {
        if (
          event.delta < 4 &&
          event.object.name.replaceAll("_", " ").includes("MY SCREEN")
        ) {
          event.stopPropagation();
          onScreenSelect();
        }
      }}
    />
  );
}

function CameraDirector({
  view,
  revision,
  controls,
  reduced,
  onContextLost,
  moving,
  active,
  autoRotate,
}) {
  const { camera, invalidate, gl, size } = useThree();
  const destination = useRef(new Vector3(...VIEWS[0].position));
  useEffect(() => {
    camera.fov =
      size.width < 430
        ? MathUtils.clamp(35 + (350 - size.width) * 0.1, 35, 44)
        : 28;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, size.width]);
  const idleTime = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLoss = (event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", handleLoss);
    return () => canvas.removeEventListener("webglcontextlost", handleLoss);
  }, [gl, onContextLost]);

  useEffect(() => {
    // Revision lets Reset return to the same camera after the visitor drags it.
    if (revision < 0) return;
    destination.current.set(...VIEWS[view].position);
    controls.current?.target.set(...VIEWS[view].target);
    if (reduced) {
      camera.position.copy(destination.current);
      controls.current?.update();
    } else {
      moving.current = true;
    }
    invalidate();
  }, [camera, controls, invalidate, moving, reduced, revision, view]);

  useFrame((_, delta) => {
    if (!moving.current) {
      if (active && autoRotate && !reduced && controls.current) {
        idleTime.current += Math.min(delta, 0.05);
        const preset = VIEWS[view];
        const baseAngle = Math.atan2(
          preset.position[0] - preset.target[0],
          preset.position[2] - preset.target[2],
        );
        controls.current.setAzimuthalAngle(
          baseAngle + Math.sin(idleTime.current * 0.22) * 0.2,
        );
        controls.current.update();
      }
      return;
    }
    camera.position.lerp(
      destination.current,
      1 - Math.exp(-Math.min(delta, 0.05) * 5.5),
    );
    controls.current?.update();
    if (camera.position.distanceTo(destination.current) < 0.012) {
      camera.position.copy(destination.current);
      controls.current?.update();
      moving.current = false;
    } else {
      invalidate();
    }
  });

  return null;
}

function DeskScene({
  active,
  autoRotate,
  view,
  revision,
  reduced,
  onReady,
  onContextLost,
  controls,
  moving,
  onDrag,
  onScreenSelect,
}) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#f5f2df", "#515976", 1.6]} />
      <directionalLight position={[8, 10, 5]} color="#fff9e5" intensity={3.2} />
      <directionalLight
        position={[-5, 3, -4]}
        color="#c5aaff"
        intensity={2.3}
      />
      <directionalLight position={[1, 5, 8]} color="#a8b7ff" intensity={1.1} />
      <pointLight
        position={[4, 2, 3]}
        color="#ffffff"
        intensity={9}
        distance={14}
        decay={2}
      />
      <mesh position={[0, -1.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.35, 80]} />
        <meshBasicMaterial color="#242c40" />
      </mesh>
      <mesh position={[0, -1.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.33, 4.36, 96]} />
        <meshBasicMaterial color="#a8b7ff" transparent opacity={0.35} />
      </mesh>
      <Suspense fallback={null}>
        <OriginalDesk onReady={onReady} onScreenSelect={onScreenSelect} />
      </Suspense>
      <OrbitControls
        ref={controls}
        makeDefault
        target={VIEWS[view].target}
        enableZoom={false}
        enablePan={false}
        enableDamping={!reduced}
        dampingFactor={0.075}
        rotateSpeed={0.55}
        minPolarAngle={0.33}
        maxPolarAngle={Math.PI / 2 - 0.055}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={(Math.PI * 4) / 5}
        autoRotate={false}
        onStart={onDrag}
      />
      <CameraDirector
        view={view}
        revision={revision}
        controls={controls}
        reduced={reduced}
        onContextLost={onContextLost}
        moving={moving}
        active={active}
        autoRotate={autoRotate}
      />
    </>
  );
}

function DeskFallback({ onRetry }) {
  return (
    <div className="desk-fallback">
      <svg viewBox="0 0 360 260" aria-hidden="true">
        <defs>
          <linearGradient id="desk-screen" x2="1" y2="1">
            <stop stopColor="#a8b7ff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#b6a2dd" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="m35 180 130 55 158-73-132-49Z M35 180v13l130 55 158-73v-13 M48 199v32m260-52v32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="m118 47 111-13v93l-111 15Z"
          fill="url(#desk-screen)"
          stroke="currentColor"
        />
        <path
          d="m167 136 2 27m-16 6 36-5m-63 9 49 21 57-27-47-18Z M254 77l38-6v83l-38 10Z M138 77l-8 9 8 6m17-18 8 8-8 9m-8-18-4 21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <p>The desk is taking a breather.</p>
      <span>Your browser could not open the 3D view.</span>
      <button type="button" onClick={onRetry}>
        <RotateCcw size={13} /> Try the 3D view again
      </button>
    </div>
  );
}

/** Lazy-load this component; its own stylesheet is included in that chunk. */
export default function WorkstationStage({ onReveal, compact = false }) {
  const reduced = useReducedMotion();
  const [autoRotate, setAutoRotate] = useState(!reduced);
  const [view, setView] = useState(0);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);
  const stageRef = useRef(null);
  const controls = useRef(null);
  const moving = useRef(false);
  const revealRef = useRef(onReveal);
  const instructionsId = useId();
  revealRef.current = onReveal;

  useEffect(() => {
    if (reduced) setAutoRotate(false);
  }, [reduced]);

  useEffect(() => {
    let intersecting = true;
    const update = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    if (stageRef.current) observer.observe(stageRef.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    revealRef.current?.();
  }, []);
  const onContextLost = useCallback(() => setFailed(true), []);
  const onDrag = useCallback(() => {
    moving.current = false;
    setAutoRotate(false);
  }, []);
  const reset = () => {
    setAutoRotate(false);
    setView(0);
    setRevision((value) => value + 1);
  };
  const retry = () => {
    useGLTF.clear(MODEL_URL);
    setFailed(false);
    setReady(false);
    setAttempt((value) => value + 1);
  };
  const chooseView = (index) => {
    setAutoRotate(false);
    setView(index);
    setRevision((value) => value + 1);
  };
  const handleKey = (event) => {
    if (event.target !== event.currentTarget) return;
    const orbit = controls.current;
    if (!orbit) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    moving.current = false;
    if (event.key === "Home") {
      reset();
      return;
    }
    setAutoRotate(false);
    const azimuth = orbit.getAzimuthalAngle();
    const polar = orbit.getPolarAngle();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      orbit.setAzimuthalAngle(
        MathUtils.clamp(
          azimuth + (event.key === "ArrowLeft" ? -0.15 : 0.15),
          -Math.PI / 5,
          (Math.PI * 4) / 5,
        ),
      );
    } else {
      orbit.setPolarAngle(
        MathUtils.clamp(
          polar + (event.key === "ArrowUp" ? -0.1 : 0.1),
          0.33,
          Math.PI / 2 - 0.055,
        ),
      );
    }
    orbit.update();
  };
  const fallback = <DeskFallback onRetry={retry} />;

  return (
    <div
      ref={stageRef}
      className={`workstation-stage${compact ? " workstation-compact" : ""}`}
    >
      <div className="desk-atmosphere" aria-hidden="true" />
      <div className="desk-header">
        <span className="desk-label">
          <Box size={12} aria-hidden="true" /> THE BUILDER'S DESK
        </span>
        <span className="desk-status">
          <i /> {ready && !failed ? "LIVE 3D" : "THE ORIGINAL SCENE"}
        </span>
      </div>
      <div className="desk-coordinate" aria-hidden="true">
        SA / WORKSPACE_01
        <br />
        THINK. BUILD. ITERATE.
      </div>
      <div
        className="desk-viewport"
        tabIndex={ready && !failed ? 0 : -1}
        role="group"
        aria-label="Interactive 3D workstation"
        aria-describedby={instructionsId}
        onKeyDown={handleKey}
      >
        {failed ? (
          fallback
        ) : (
          <DeskBoundary
            key={attempt}
            fallback={fallback}
            onUnavailable={onContextLost}
          >
            <Canvas
              frameloop={active && autoRotate && !reduced ? "always" : "demand"}
              dpr={[1, 1.5]}
              camera={{
                position: VIEWS[0].position,
                fov: 33,
                near: 0.1,
                far: 80,
              }}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: "default",
                stencil: false,
              }}
              fallback={fallback}
              aria-hidden="true"
              style={{ touchAction: "none" }}
            >
              <DeskScene
                active={active}
                autoRotate={autoRotate}
                view={view}
                revision={revision}
                reduced={reduced}
                onReady={onReady}
                onContextLost={onContextLost}
                controls={controls}
                moving={moving}
                onDrag={onDrag}
                onScreenSelect={() => chooseView(1)}
              />
            </Canvas>
          </DeskBoundary>
        )}
        {!ready && !failed && (
          <div className="desk-loading" role="status">
            <span className="desk-loader" />
            Opening the original desk
          </div>
        )}
        <span className="desk-watermark" aria-hidden="true">
          build_
        </span>
      </div>
      <p id={instructionsId} className="desk-instructions">
        <MousePointer2 size={12} aria-hidden="true" /> Drag to explore. Arrow
        keys to orbit. Home to reset.
      </p>
      <div className="desk-toolbar" aria-label="Workstation controls">
        <div className="desk-views" aria-label="Camera views">
          {VIEWS.map(({ name, icon: Icon }, index) => (
            <button
              key={name}
              type="button"
              aria-pressed={view === index}
              onClick={() => chooseView(index)}
              disabled={!ready || failed}
            >
              <Icon size={13} aria-hidden="true" />
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="desk-control"
          aria-label={autoRotate ? "Pause desk rotation" : "Rotate the desk"}
          aria-pressed={autoRotate}
          onClick={() => setAutoRotate((current) => !current)}
          disabled={!ready || failed || reduced}
        >
          {autoRotate ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="desk-control"
          aria-label="Reset workstation view"
          onClick={reset}
          disabled={!ready || failed}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <details className="desk-credit">
        <summary>3D model credit</summary>
        <p>
          <a
            href="https://sketchfab.com/3d-models/gaming-desktop-pc-d1d8282c9916438091f11aeb28787b66"
            target="_blank"
            rel="noreferrer"
          >
            Gaming Desktop PC <ArrowUpRight size={11} />
          </a>{" "}
          by{" "}
          <a
            href="https://sketchfab.com/Yolala1232"
            target="_blank"
            rel="noreferrer"
          >
            Yolala1232
          </a>{" "}
          /{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
        </p>
      </details>
    </div>
  );
}
