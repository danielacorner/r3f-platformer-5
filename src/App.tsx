import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, SoftShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import { Level } from './components/Level';
import { useGameStore } from './store/gameStore';
import { CameraController } from './components/CameraController';
import { useEffect } from 'react';
import { BuildMenu } from './components/BuildMenu';

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

  useEffect(() => {
    // Prevent default touch behaviors
    const preventDefaultTouchBehaviors = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventDefaultTouchBehaviors, { passive: false });
    document.addEventListener('touchmove', preventDefaultTouchBehaviors, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventDefaultTouchBehaviors);
      document.removeEventListener('touchmove', preventDefaultTouchBehaviors);
    };
  }, []);

  return (
    <div className="h-screen w-screen touch-none">
      {/* Game Interface */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {/* Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-lg pointer-events-none">
          <div className="text-white text-xl font-bold">
            {phase === 'prep' ? 'Preparation Phase' : `Time: ${timer}s`}
          </div>
        </div>

        {/* Start Combat Button */}
        {phase === 'prep' && placedBoxes.length > 0 && (
          <div className="absolute top-4 right-4 pointer-events-auto">
            <button
              onClick={handleStartCombat}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Start Combat
            </button>
          </div>
        )}

        {/* Enemies Counter */}
        {phase === 'combat' && (
          <div className="absolute top-4 right-4 bg-black/50 px-4 py-2 rounded-lg pointer-events-none">
            <div className="text-white text-xl">
              Enemies: {enemiesAlive}
            </div>
          </div>
        )}

        {/* Level Complete Interface */}
        {levelComplete && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-5 rounded-xl text-center pointer-events-auto">
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

        <BuildMenu />
      </div>

      <Canvas
        shadows
        camera={{
          position: [0, 15, 20],
          fov: 45,
          rotation: [-0.7, 0, 0]
        }}
        style={{
          width: '100vw',
          height: '100vh',
          touchAction: 'none',
          position: 'fixed',
          left: 0,
          top: 0
        }}
      >
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

          <Physics debug={false} gravity={[0, -30, 0]}>
            <Player />
            <Level />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}