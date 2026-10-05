import { useGLTF } from "@react-three/drei/core/Gltf.js";
import { OrbitControls } from "@react-three/drei/core/OrbitControls.js";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Download,
  Grid2X2,
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
import { Box3, MathUtils, MeshBasicMaterial, Vector3 } from "three";
import { motionAllowed } from "../../utils/studioMotion";

const MODEL = "/portrait/saksham-model.glb";
const TARGET = [0, 0.84, 0];

class PortraitBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Bust({ wireframe, onReady }) {
  const { scene } = useGLTF(MODEL);
  const { invalidate } = useThree();
  const portrait = useMemo(() => {
    const copy = scene.clone(true);
    const materials = new Map();
    copy.traverse((object) => {
      if (!object.isMesh) return;
      const cloneMaterial = (material) => {
        if (!materials.has(material)) {
          const cloned = material.clone();
          cloned.userData.wireMaterial = new MeshBasicMaterial({
            color: "#a8b7ff",
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          });
          materials.set(material, cloned);
        }
        return materials.get(material);
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material);
      object.userData.sculptMaterial = object.material;
    });
    // Fit the supplied model's own transforms, units, and origin to this stage.
    copy.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(copy);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const scale = 4.2 / Math.max(size.y, 0.001);
    copy.scale.multiplyScalar(scale);
    copy.position.sub(center.multiplyScalar(scale));
    copy.position.y += TARGET[1];
    return copy;
  }, [scene]);
  useEffect(() => {
    portrait.traverse((object) => {
      if (!object.isMesh) return;
      const sculptMaterial = object.userData.sculptMaterial;
      const wireMaterial = (material) => material.userData.wireMaterial;
      object.material = wireframe
        ? Array.isArray(sculptMaterial)
          ? sculptMaterial.map(wireMaterial)
          : wireMaterial(sculptMaterial)
        : sculptMaterial;
    });
    invalidate();
  }, [portrait, wireframe, invalidate]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useEffect(
    () => () => {
      const materials = new Set();
      portrait.traverse((object) => {
        if (!object.isMesh) return;
        const sculptMaterial = object.userData.sculptMaterial;
        for (const material of Array.isArray(sculptMaterial)
          ? sculptMaterial
          : [sculptMaterial])
          materials.add(material);
      });
      materials.forEach((material) => {
        material.dispose();
        material.userData.wireMaterial.dispose();
      });
    },
    [portrait],
  );
  return <primitive object={portrait} dispose={null} />;
}

function PortraitCamera({ controls, revision, onFail }) {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    if (revision < 0) return;
    camera.position.set(0, 1.1, 7.6);
    controls.current?.target.set(...TARGET);
    controls.current?.update();
    invalidate();
  }, [camera, controls, invalidate, revision]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event) => {
      event.preventDefault();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFail]);
  return null;
}

export default function PortraitBust({ portraitImage }) {
  const [wireframe, setWireframe] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [allowed, setAllowed] = useState(motionAllowed);
  const [active, setActive] = useState(true);
  const controls = useRef(null);
  const stage = useRef(null);
  const instructions = useId();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const motion = motionAllowed();
      setAllowed(motion);
      if (!motion) setRotating(false);
    };
    reduced.addEventListener("change", update);
    window.addEventListener("portfolio-motion-change", update);
    return () => {
      reduced.removeEventListener("change", update);
      window.removeEventListener("portfolio-motion-change", update);
    };
  }, []);
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    if (stage.current) observer.observe(stage.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => {
    setFailed(true);
    setRotating(false);
  }, []);
  const reset = () => {
    setRotating(false);
    setRevision((value) => value + 1);
  };
  const retry = () => {
    useGLTF.clear(MODEL);
    setReady(false);
    setFailed(false);
    setAttempt((value) => value + 1);
  };
  const keyDown = (event) => {
    if (event.target !== event.currentTarget || !controls.current) return;
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    setRotating(false);
    if (event.key === "Home") {
      reset();
      return;
    }
    const orbit = controls.current;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight")
      orbit.setAzimuthalAngle(
        orbit.getAzimuthalAngle() + (event.key === "ArrowLeft" ? -0.15 : 0.15),
      );
    else
      orbit.setPolarAngle(
        MathUtils.clamp(
          orbit.getPolarAngle() + (event.key === "ArrowUp" ? -0.1 : 0.1),
          0.75,
          1.95,
        ),
      );
    orbit.update();
  };
  const fallback = (
    <div className="bust-fallback">
      <img src={portraitImage} alt="Saksham Agarwal" />
      <span>3D view unavailable in this browser.</span>
      <button type="button" onClick={retry}>
        <RotateCcw size={13} /> Try again
      </button>
    </div>
  );
  return (
    <div className="portrait-bust" ref={stage}>
      <div className="bust-coordinate mono" aria-hidden="true">
        SA / IN THREE DIMENSIONS
        <br />A DIFFERENT PERSPECTIVE.
      </div>
      <div
        className="bust-viewport"
        role="group"
        aria-label="Interactive 3D model of Saksham Agarwal"
        aria-describedby={instructions}
        tabIndex={ready && !failed ? 0 : -1}
        onKeyDown={keyDown}
      >
        {failed ? (
          fallback
        ) : (
          <PortraitBoundary key={attempt} onFail={onFail} fallback={fallback}>
            <Canvas
              dpr={[1, 1.5]}
              frameloop={rotating && active && allowed ? "always" : "demand"}
              camera={{ position: [0, 1.1, 7.6], fov: 40, near: 0.1, far: 35 }}
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
              <ambientLight intensity={0.65} />
              <hemisphereLight args={["#fff6ee", "#7c809b", 0.8]} />
              <directionalLight
                position={[3, 5, 6]}
                intensity={1.5}
                color="#fff2df"
              />
              <directionalLight
                position={[-4, 2, -1]}
                intensity={0.9}
                color="#a8b7ff"
              />
              <directionalLight
                position={[4, 3, -3]}
                intensity={1.1}
                color="#b7a1ee"
              />
              <Suspense fallback={null}>
                <Bust wireframe={wireframe} onReady={onReady} />
              </Suspense>
              <OrbitControls
                ref={controls}
                target={TARGET}
                makeDefault
                enableZoom={false}
                enablePan={false}
                enableDamping={allowed}
                dampingFactor={0.09}
                minPolarAngle={0.75}
                maxPolarAngle={1.95}
                rotateSpeed={0.65}
                autoRotate={rotating && active && allowed}
                autoRotateSpeed={0.65}
                onStart={() => setRotating(false)}
              />
              <PortraitCamera
                controls={controls}
                revision={revision}
                onFail={onFail}
              />
            </Canvas>
          </PortraitBoundary>
        )}
        {!ready && !failed && (
          <div className="bust-loading" role="status">
            <span className="desk-loader" /> Opening another perspective…
          </div>
        )}
      </div>
      <div className="bust-toolbar">
        <button
          type="button"
          aria-pressed={wireframe}
          disabled={!ready || failed}
          onClick={() => setWireframe((value) => !value)}
        >
          <Grid2X2 size={13} />{" "}
          {wireframe ? "Back to portrait" : "Reveal the wireframe"}
        </button>
        <div>
          <button
            type="button"
            aria-label={
              rotating ? "Pause portrait rotation" : "Rotate portrait"
            }
            aria-pressed={rotating}
            onClick={() => setRotating((value) => !value)}
            disabled={!ready || failed || !allowed}
          >
            {rotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            aria-label="Reset portrait view"
            onClick={reset}
            disabled={!ready || failed}
          >
            <RotateCcw size={14} />
          </button>
          <a
            href={MODEL}
            download="Saksham-Agarwal-3D-Model.glb"
            aria-label="Download 3D portrait model"
          >
            <Download size={14} />
          </a>
        </div>
      </div>
      <p id={instructions} className="bust-instructions">
        <MousePointer2 size={12} aria-hidden="true" /> Drag or use arrow keys.
        Home resets the view.<span>Your model, in 3D</span>
      </p>
    </div>
  );
}
