import React, { Suspense, useEffect, useState } from "react";
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
      if (width <= 500) setDevice("mobile");
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
  // Load your model
  const gltf = useGLTF("/desktop_pc/scene.gltf");

  useEffect(() => {
    // As soon as the GLTF is ready, clean up any NaNs and re-compute bounds
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.geometry.attributes.position) {
        const posAttr = child.geometry.attributes.position;
        let foundBad = false;

        // Quick check for NaN positions
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.warn(
              `Found NaN in ${child.name} at vertex ${i}`,
              x, y, z
            );
            foundBad = true;
            break;
          }
        }

        // If any NaNs, replace bounding sphere via box->sphere approach
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

  // Configuration per device
  const config = {
    mobile: {
      scale: 0.75,
      position: [2.5, -3.5, -0.75],
      rotation: [-0.01, -0.1, -0.02],
      rotationIntensity: 0.05,
      floatIntensity: 0.3,
      speed: 0.8,
      floatRange: [0.01, 0.05],
      cameraPos: [12, 2, 3],
    },
    tablet: {
      scale: 0.6,
      position: [-1.2, -2.2, -1],
      rotation: [-0.01, -0.15, -0.05],
      rotationIntensity: 0.1,
      floatIntensity: 0.45,
      speed: 0.9,
      floatRange: [0.03, 0.1],
      cameraPos: [18, 2.5, 4],
    },
    desktop: {
      scale: 0.8,
      position: [-1, -3.2, -1.5],
      rotation: [-0.01, -0.2, -0.1],
      rotationIntensity: 0.15,
      floatIntensity: 0.6,
      speed: 1,
      floatRange: [0.05, 0.15],
      cameraPos: [20, 3, 5],
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
      <ambientLight intensity={0.4} />
      <directionalLight
        intensity={1.5}
        position={[5, 10, 5]}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <pointLight intensity={1} />
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

  // Extract camera position from config
  const cameraPos = {
    mobile: [15, 2, 20],
    tablet: [18, 2.5, 4],
    desktop: [20, 3, 5],
  }[device];

  return (
    <Canvas
      frameloop="demand"
      shadows={device !== "mobile"}
      dpr={window.devicePixelRatio > 1 ? 1.5 : 1}
      camera={{ position: cameraPos, fov: 25 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={<CanvasLoader />}>  
        <OrbitControls
          enableZoom={false}
          autoRotate={device === "mobile"}
          autoRotateSpeed={1.0}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
        <Computers device={device} />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;
