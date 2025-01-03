import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  SoftShadows,
  OrbitControls,
  BakeShadows,
  Environment,
  Loader,
} from "@react-three/drei";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { Physics } from "@react-three/rapier";
import { Level } from "./components/level/Level/Level";
import { BottomMenu } from "./components/BottomMenu";
import { GameUI } from "./components/GameUI";
import { WaveIndicator } from "./components/WaveIndicator";
import { useGameStore } from "./store/gameStore";
import { useEffect, useRef } from "react";

function TDCamera() {
  const { playerRef } = useGameStore();
  const isPanning = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 2 || e.button === 1) {
      isPanning.current = true;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (e.button === 2 || e.button === 1) {
      isPanning.current = false;
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPanning.current || !playerRef) return;

    const dx = (e.clientX - lastPanPosition.current.x) * 0.1;
    const dy = (e.clientY - lastPanPosition.current.y) * 0.1;

    const movement = new THREE.Vector3(-dx, 0, -dy);
    const currentPos = playerRef.translation();
    playerRef.setTranslation(
      {
        x: currentPos.x + movement.x,
        y: currentPos.y,
        z: currentPos.z + movement.z,
      },
      true
    );

    lastPanPosition.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2.5}
      minPolarAngle={Math.PI / 4}
      maxDistance={70}
      minDistance={20}
      enableDamping={true}
      dampingFactor={0.01}
      enablePan={false}
      zoomSpeed={0.3}
    />
  );
}

function Effects() {
  return (
    <EffectComposer
      multisampling={0}
      enabled
      frameBufferType={THREE.HalfFloatType}
    >
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
  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000913",
          position: "relative",
        }}
      >
        <BottomMenu />
        <GameUI />
        <WaveIndicator />
        <Canvas
          shadows="soft"
          camera={{
            fov: 75,
            position: [0, 20, 20],
            near: 0.1,
            far: 2000
          }}
          dpr={[1, 2]}
          gl={{
            powerPreference: "high-performance",
            antialias: true,
            stencil: false,
            depth: true,
            alpha: false,
          }}
        >
          <color attach="background" args={["#000913"]} />
          <fog attach="fog" args={["#000913", 100, 400]} />

          <Suspense fallback={null}>
            <SoftShadows size={35} samples={16} focus={0.5} />

            <Environment preset="sunset" background={false} />

            <ambientLight intensity={0.5} />
            <directionalLight
              castShadow
              intensity={3}
              position={[20, 30, 20]}
              shadow-mapSize={[4096, 4096]}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
              shadow-camera-near={0.1}
              shadow-camera-far={500}
              shadow-bias={-0.001}
            />

            <Physics debug={false}>
              <Level />
            </Physics>
            <TDCamera />
            <Effects />
            <BakeShadows />
          </Suspense>
        </Canvas>
        <Loader />
      </div>
    </>
  );
}
