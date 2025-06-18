import React, { Suspense, memo, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Decal,
  Float,
  OrbitControls,
  Preload,
  useTexture,
  Environment,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import CanvasLoader from "../Loader";

/**
 * Enhanced floating icosahedron with decal texture and performance optimizations
 * @param {object} props
 * @param {string} props.imgUrl - URL of the decal image
 * @param {number} [props.scale=2.75] - Scale of the mesh
 * @param {[number, number, number]} [props.decalRotation=[Math.PI * 2, 0, 6.25]] - Rotation of the decal
 * @param {string} [props.materialColor="#fff8eb"] - Base material color
 * @param {number} [props.metalness=0.5] - Material metalness
 * @param {number} [props.roughness=0.5] - Material roughness
 * @param {boolean} [props.enableAnimation=true] - Enable floating animation
 * @param {object} [props.floatProps] - Custom float animation properties
 */
const Ball = memo(({ 
  imgUrl, 
  scale = 2.75, 
  decalRotation = [Math.PI * 2, 0, 6.25],
  materialColor = "#fff8eb",
  metalness = 0.5,
  roughness = 0.5,
  enableAnimation = true,
  floatProps = {}
}) => {
  const meshRef = useRef();
  
  // Load texture at top level - hooks must be called at component top level
  const [decalTexture] = useTexture([imgUrl]);

  // Memoize geometry and material for performance
  const geometry = useMemo(() => <icosahedronGeometry args={[1, 1]} />, []);
  
  const material = useMemo(() => (
    <meshStandardMaterial
      color={materialColor}
      polygonOffset
      polygonOffsetFactor={-5}
      flatShading
      metalness={metalness}
      roughness={roughness}
      toneMapped={false}
    />
  ), [materialColor, metalness, roughness]);

  // Optional custom animation frame
  useFrame((state) => {
    if (meshRef.current && !enableAnimation) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  // Early return if texture fails to load
  if (!decalTexture) {
    console.warn('Failed to load texture:', imgUrl);
    return (
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef} castShadow receiveShadow scale={scale}>
          {geometry}
          {material}
        </mesh>
      </Float>
    );
  }

  const floatConfig = {
    speed: 1.75,
    rotationIntensity: 1,
    floatIntensity: 2,
    ...floatProps
  };

  const BallMesh = (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      scale={scale}
    >
      {geometry}
      {material}
      <Decal
        position={[0, 0, 1]}
        rotation={decalRotation}
        scale={1}
        map={decalTexture}
        flatShading
        transparent
        alphaTest={0.01}
      />
    </mesh>
  );

  return enableAnimation ? (
    <Float {...floatConfig}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      {BallMesh}
    </Float>
  ) : (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      {BallMesh}
    </>
  );
});

Ball.displayName = 'Ball';

Ball.propTypes = {
  imgUrl: PropTypes.string.isRequired,
  scale: PropTypes.number,
  decalRotation: PropTypes.arrayOf(PropTypes.number),
  materialColor: PropTypes.string,
  metalness: PropTypes.number,
  roughness: PropTypes.number,
  enableAnimation: PropTypes.bool,
  floatProps: PropTypes.object,
};

/**
 * Enhanced canvas wrapper with performance optimizations and error boundaries
 * @param {object} props
 * @param {string} props.icon - URL of the decal image
 * @param {string} [props.fallbackColor='#001920'] - Background fallback color
 * @param {object} [props.cameraProps] - Custom camera properties
 * @param {boolean} [props.enableOrbitControls=true] - Enable orbit controls
 * @param {string} [props.environmentPreset='studio'] - Environment lighting preset
 * @param {object} [props.ballProps] - Props to pass to Ball component
 * @param {function} [props.onError] - Error callback function
 */
const BallCanvas = memo(({ 
  icon, 
  fallbackColor = '#001920',
  cameraProps = {},
  enableOrbitControls = true,
  environmentPreset = 'studio',
  ballProps = {},
  onError
}) => {
  // Memoize camera configuration
  const cameraConfig = useMemo(() => ({
    position: [0, 0, 7],
    fov: 50,
    ...cameraProps
  }), [cameraProps]);

  // Memoize GL configuration
  const glConfig = useMemo(() => ({
    preserveDrawingBuffer: true,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  }), []);

  // Error boundary callback
  const handleError = useCallback((error) => {
    console.error('BallCanvas rendering error:', error);
    onError?.(error);
  }, [onError]);

  return (
    <Canvas
      shadows={{ type: "PCF", enabled: true }}
      frameloop="demand"
      dpr={[1, 2]}
      gl={glConfig}
      style={{ 
        background: fallbackColor,
        width: '100%',
        height: '100%'
      }}
      camera={cameraConfig}
      onError={handleError}
      linear
      flat
    >
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      
      <Suspense fallback={<CanvasLoader />}>
        {enableOrbitControls && (
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
            autoRotate={false}
            dampingFactor={0.05}
            enableDamping
          />
        )}
        
        <Environment 
          preset={environmentPreset}
          background={false}
          blur={0.8}
        />
        
        <Ball 
          imgUrl={icon} 
          {...ballProps}
        />
      </Suspense>
      
      <Preload all />
    </Canvas>
  );
});

BallCanvas.displayName = 'BallCanvas';

BallCanvas.propTypes = {
  icon: PropTypes.string.isRequired,
  fallbackColor: PropTypes.string,
  cameraProps: PropTypes.object,
  enableOrbitControls: PropTypes.bool,
  environmentPreset: PropTypes.oneOf([
    'apartment', 'city', 'dawn', 'forest', 'lobby', 
    'night', 'park', 'studio', 'sunset', 'warehouse'
  ]),
  ballProps: PropTypes.object,
  onError: PropTypes.func,
};

export default BallCanvas;