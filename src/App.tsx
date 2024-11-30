import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  Sky, 
  SoftShadows, 
  OrbitControls,
  BakeShadows,
  Environment,
  Loader
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  SMAA
} from '@react-three/postprocessing';
import { Physics } from '@react-three/rapier';
import { Level } from './components/Level';
import { BuildMenu } from './components/BuildMenu';
import { useGameStore } from './store/gameStore';

function TDCamera() {
  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2.5}
      minPolarAngle={Math.PI / 4}
      maxDistance={50}
      minDistance={10}
      target={[0, 0, 0]}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
      />
      <SMAA />
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
        dpr={[1, 2]} // Limit max pixel ratio to 2 for performance
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
          
          <Physics>
            <Level />
          </Physics>
          <TDCamera />
          
          <Effects />
          <BakeShadows />
        </Suspense>
      </Canvas>
      <BuildMenu />
      <Loader />
    </div>
  );
}