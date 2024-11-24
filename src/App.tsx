import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Sky, SoftShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import { Level } from './components/Level';
import { useGameStore } from './store/gameStore';
import { CameraController } from './components/CameraController';

export default function App() {
  const { currentLevel, timer, enemiesAlive, levelComplete, phase, placedBoxes, setPhase, setIsSpawning } = useGameStore();

  const handleStartCombat = () => {
    setPhase('combat');
    setIsSpawning(true);
  };

  return (
    <div className="h-screen w-screen">
      <div className="absolute top-0 left-0 p-4 text-white z-10">
        <p>Level: {currentLevel}</p>
        <p>Phase: {phase}</p>
        <p>Time Remaining: {timer}s</p>
        <p>Enemies: {enemiesAlive}</p>
        <p>Boxes Placed: {placedBoxes.length}/20</p>
        <p className="mt-2 text-sm opacity-75">
          {phase === 'prep' ? (
            <>Click on platforms to place boxes (up to 20)<br />Click placed boxes to remove them</>
          ) : (
            <>WASD to move, SPACE to jump<br />Left-click to shoot arrow, Right-click to throw boomerang</>
          )}
        </p>
        {phase === 'prep' && placedBoxes.length >= 3 && (
          <button
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleStartCombat}
          >
            Start Combat
          </button>
        )}
      </div>

      {levelComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Level Complete!</h2>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                useGameStore.getState().setCurrentLevel(currentLevel + 1);
                useGameStore.getState().setLevelComplete(false);
                useGameStore.getState().setTimer(60);
                useGameStore.getState().setIsSpawning(false);
                useGameStore.getState().setPhase('prep');
                useGameStore.getState().clearBoxes();
              }}
            >
              Next Level
            </button>
          </div>
        </div>
      )}

      <Canvas shadows>
        <Suspense fallback={null}>
          <CameraController />

          <SoftShadows size={2.5} samples={16} focus={0.5} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.3} />
          <directionalLight
            castShadow
            position={[50, 50, 30]}
            intensity={1.5}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-camera-near={0.1}
            shadow-camera-far={200}
            shadow-bias={-0.0001}
          />

          <Physics gravity={[0, -30, 0]}>
            <Player />
            <Level />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}