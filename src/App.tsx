import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, SoftShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import { Level } from './components/Level';
import { useGameStore } from './store/gameStore';
import { CameraController } from './components/CameraController';
import { useEffect } from 'react';

export default function App() {
  const { currentLevel, timer, enemiesAlive, phase, placedBoxes, setPhase, setIsSpawning, levelComplete, setCurrentLevel, setTimer, setLevelComplete } = useGameStore();

  const handleStartCombat = () => {
    setPhase('combat');
    setIsSpawning(true);
  };

  const handleNextLevel = () => {
    setCurrentLevel(currentLevel + 1);
    setPhase('prep');
    setTimer(4);
    setLevelComplete(false);
    setIsSpawning(false);
  };

  // Countdown timer
  useEffect(() => {
    if (phase === 'combat' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, timer, setTimer]);

  // Handle timer completion
  useEffect(() => {
    if (timer <= 0) {
      setIsSpawning(false);
    }
  }, [timer, setIsSpawning]);

  return (
    <div className="h-screen w-screen">
      <div className="absolute top-0 left-0 p-4 text-white z-10">
        <p>Level: {currentLevel}</p>
        <p>Phase: {phase}</p>
        <p>Time Remaining: {timer}s</p>
        <p>Enemies: {enemiesAlive}</p>
        <p>Boxes Placed: {placedBoxes.length}/20</p>
        
        {/* Combat status messages */}
        {phase === 'combat' && (
          <div className="text-center mt-4">
            {timer > 0 ? (
              <>Time until reinforcements stop: {timer}s</>
            ) : (
              <>
                No more reinforcements!
                <br />
                Defeat remaining {enemiesAlive} {enemiesAlive === 1 ? 'enemy' : 'enemies'}!
              </>
            )}
          </div>
        )}

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

      {/* Level Complete Interface */}
      {levelComplete && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-5 rounded-xl text-center pointer-events-auto">
          <div className="text-green-500 text-3xl mb-5 text-shadow-lg">
            Level {currentLevel} Complete!
          </div>
          <button
            onClick={handleNextLevel}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Next Level
          </button>
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