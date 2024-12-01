import { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Sky,
  SoftShadows,
  OrbitControls,
  BakeShadows,
  Environment,
  Loader,
  Cloud,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  SMAA
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';
import { Level } from './components/Level';
import { BuildMenu } from './components/BuildMenu';
import { GameUI } from './components/GameUI';
import { useGameStore } from './store/gameStore';
import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/three';

function TDCamera() {
  const { playerRef } = useGameStore();
  const controlsRef = useRef();
  const lastPanPosition = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  useFrame((state) => {
    if (!controlsRef.current || !playerRef?.current) return;

    // Get player position
    const playerPos = playerRef.current.translation();

    // Update camera target to follow player
    controlsRef.current.target.set(playerPos.x, 0, playerPos.z);

    // Update camera position to maintain relative offset
    const cameraOffset = new THREE.Vector3();
    cameraOffset.copy(state.camera.position).sub(controlsRef.current.target);
    state.camera.position.copy(new THREE.Vector3(playerPos.x, 0, playerPos.z)).add(cameraOffset);
  });

  const handlePointerDown = (e) => {
    if (e.button === 2 || e.button === 1) { // Right click or middle click
      isPanning.current = true;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    if (e.button === 2 || e.button === 1) {
      isPanning.current = false;
    }
  };

  const handlePointerMove = (e) => {
    if (!isPanning.current || !playerRef?.current) return;

    const dx = (e.clientX - lastPanPosition.current.x) * 0.1;
    const dy = (e.clientY - lastPanPosition.current.y) * 0.1;

    // Convert screen movement to world-space direction based on camera angle
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const camera = controlsRef.current.object;

    forward.set(0, 0, 1)
      .applyQuaternion(camera.quaternion)
      .setY(0)
      .normalize();

    right.set(1, 0, 0)
      .applyQuaternion(camera.quaternion)
      .setY(0)
      .normalize();

    // Move player based on pan direction
    const movement = new THREE.Vector3()
      .addScaledVector(forward, -dy)
      .addScaledVector(right, dx);

    const currentPos = playerRef.current.translation();
    playerRef.current.setTranslation({
      x: currentPos.x + movement.x,
      y: currentPos.y,
      z: currentPos.z + movement.z
    });

    lastPanPosition.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      maxPolarAngle={Math.PI / 2.5}
      minPolarAngle={Math.PI / 4}
      maxDistance={50}
      minDistance={10}
      enableDamping={true}
      dampingFactor={0.05}
      enablePan={false}
    />
  );
}

function FollowingCloud() {
  const { playerRef } = useGameStore();
  const [spring, api] = useSpring(() => ({
    position: [0, 15, 0],
    config: {
      mass: 1,
      tension: 120,
      friction: 300
    }
  }));

  useFrame(() => {
    if (!playerRef?.current) return;
    const playerPos = playerRef.current.translation();
    api.start({
      position: [playerPos.x, 15, playerPos.z],
    });
  });

  return (
    <animated.group position={spring.position}>
      <Cloud
        opacity={0.01}
        speed={0.2}
        width={10}
        depth={1.5}
        segments={32}
      />
    </animated.group>
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={0} disableNormalPass frameBufferType={THREE.HalfFloatType}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <SMAA preset={2} />
    </EffectComposer>
  );
}

export default function App() {
  const { currentLevel } = useGameStore();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000913' }}>
      <Canvas
        shadows="soft"
        camera={{ position: [30, 30, 30], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false
        }}
      >
        <color attach="background" args={['#000913']} />
        <fog attach="fog" args={['#000913', 30, 100]} />

        <Suspense fallback={null}>
          <SoftShadows
            size={35}
            samples={16}
            focus={0.5}
            blur={3}
          />

          <Environment
            preset="sunset"
            background={false}
            intensity={0.5}
          />

          <ambientLight intensity={0.2} />
          <directionalLight
            castShadow
            intensity={2}
            position={[10, 15, 10]}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-camera-near={0.1}
            shadow-camera-far={200}
            shadow-bias={-0.001}
          />

          <Physics debug={true}>
            <Level />
          </Physics>
          <TDCamera />
          <FollowingCloud />

          <Effects />
          <BakeShadows />
        </Suspense>
      </Canvas>
      <BuildMenu />
      <GameUI />
      <Loader />
    </div>
  );
}