import { PointMaterial, Points, Preload } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { memo, Suspense, useEffect, useRef, useState } from "react";
import CanvasErrorBoundary from "./CanvasErrorBoundary";

const generateSpherePoints = (count = 2000, radius = 1.25) => {
  const points = new Float32Array(count);
  for (let i = 0; i < count; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);

    points[i] = r * sinPhi * Math.cos(theta);
    points[i + 1] = r * sinPhi * Math.sin(theta);
    points[i + 2] = r * Math.cos(phi);
  }
  return points;
};

const Stars = (props) => {
  const ref = useRef();
  const [sphere] = useState(() => generateSpherePoints(1200, 1.25));

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 30;
      ref.current.rotation.y -= delta / 40;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color="#60a5fa"
          size={0.0022}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const hasWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const supported = Boolean(window.WebGLRenderingContext && gl);
    gl?.getExtension?.("WEBGL_lose_context")?.loseContext?.();
    return supported;
  } catch {
    return false;
  }
};

const StarsCanvas = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const [canRenderWebGL] = useState(() =>
    typeof window !== "undefined" ? hasWebGL() : false,
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!canRenderWebGL) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-auto absolute inset-0 z-[-1] pointer-events-none overflow-hidden"
    >
      <CanvasErrorBoundary>
        <Canvas
          frameloop={isVisible ? "always" : "never"}
          camera={{ position: [0, 0, 1] }}
          dpr={[1, 1.2]}
          gl={{ powerPreference: "high-performance", antialias: false }}
        >
          <Suspense fallback={null}>
            <Stars />
          </Suspense>

          <Preload all />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
});

StarsCanvas.displayName = "StarsCanvas";

export default StarsCanvas;
