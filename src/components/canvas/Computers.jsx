import React, { Suspense, useEffect, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Float } from "@react-three/drei";
import CanvasLoader from "../Loader";

// Custom hook to detect device type based on screen width
const useDeviceType = () => {
  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width <= 640) setDevice("mobile");
      else if (width <= 1024) setDevice("tablet");
      else setDevice("desktop");
    };

    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  return device;
};

const Computers = ({ device }) => {
  const gltf = useGLTF("/desktop_pc/scene-opt.glb");

  useMemo(() => {
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.geometry.attributes.position) {
        const posAttr = child.geometry.attributes.position;
        let foundBad = false;

        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.warn(`Found NaN in ${child.name} at vertex ${i}`, x, y, z);
            foundBad = true;
            break;
          }
        }

        if (foundBad) {
          child.geometry.computeBoundingBox();
          const bs = child.geometry.boundingBox.getBoundingSphere(
            new THREE.Sphere()
          );
          child.geometry.boundingSphere = bs;
        }
      }
    });
  }, [gltf]);

  // Scaled & positioned gracefully for the full-screen immersive Hero
  const config = {
    mobile: {
      scale: 0.55,
      position: [0, -2.2, -0.8],
      rotation: [-0.01, -0.1, -0.02],
      rotationIntensity: 0.05,
      floatIntensity: 0.25,
      speed: 0.8,
      floatRange: [0.01, 0.04],
    },
    tablet: {
      scale: 0.65,
      position: [0, -2.4, -1.0],
      rotation: [-0.01, -0.15, -0.05],
      rotationIntensity: 0.08,
      floatIntensity: 0.35,
      speed: 0.85,
      floatRange: [0.02, 0.06],
    },
    desktop: {
      scale: 0.72,
      position: [0, -2.6, -1.2],
      rotation: [-0.01, -0.2, -0.1],
      rotationIntensity: 0.1,
      floatIntensity: 0.4,
      speed: 0.9,
      floatRange: [0.02, 0.08],
    },
  };

  const {
    scale,
    position,
    rotation,
    rotationIntensity,
    floatIntensity,
    speed,
    floatRange,
  } = config[device];

  return (
    <Float
      rotationIntensity={rotationIntensity}
      floatIntensity={floatIntensity}
      speed={speed}
      floatRange={floatRange}
    >
      {/* Ambient base lighting */}
      <hemisphereLight
        skyColor="#ffffff"
        groundColor="#33334d"
        intensity={1.4}
      />

      {/* Key light – bright warm white from top-right */}
      <directionalLight
        color="#fdfbd3"
        intensity={3.2}
        position={[8, 12, 6]}
      />

      {/* Fill light – cool blue from left */}
      <directionalLight
        color="#93c5fd"
        intensity={2.0}
        position={[-6, 4, 4]}
      />

      {/* Front fill – illuminates monitor & keyboard */}
      <pointLight
        color="#ffffff"
        intensity={2.2}
        position={[0, 3, 8]}
        distance={25}
        decay={2}
      />

      {/* Screen glow accent */}
      <spotLight
        color="#60a5fa"
        intensity={2.4}
        position={[0, 2, 4]}
        angle={0.6}
        penumbra={0.8}
        distance={20}
        decay={2}
      />

      <primitive
        object={gltf.scene}
        scale={scale}
        position={position}
        rotation={rotation}
        dispose={null}
      />
    </Float>
  );
};

const ComputersCanvas = () => {
  const device = useDeviceType();
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cameraPos = {
    mobile: [16, 2.5, 5],
    tablet: [18, 2.8, 5],
    desktop: [20, 3.0, 5],
  }[device];

  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        frameloop={isVisible ? "always" : "never"}
        shadows={false}
        dpr={[1, 1.5]}
        camera={{ position: cameraPos, fov: 25 }}
        gl={{ 
          powerPreference: "high-performance", 
          antialias: false,
          stencil: false,
          alpha: false,
        }}
        style={{ touchAction: 'pan-y', pointerEvents: device === 'mobile' ? 'none' : 'auto' }}
      >
        <Suspense fallback={<CanvasLoader />}>  
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={device !== "mobile"}
            autoRotate={isVisible}
            autoRotateSpeed={0.8}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
          <Computers device={device} />
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
};

// Preload GLTF model immediately for faster Vercel delivery
useGLTF.preload("/desktop_pc/scene-opt.glb");

export default ComputersCanvas;
