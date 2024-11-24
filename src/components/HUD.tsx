import { Html } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import { useEffect, useState } from 'react';

export function HUD() {
  const { 
    timer, 
    setTimer,
    enemiesAlive, 
    levelComplete, 
    phase, 
    currentLevel, 
    setCurrentLevel, 
    setPhase,
    setIsSpawning,
    setLevelComplete
  } = useGameStore();
  const [enemyQueue, setEnemyQueue] = useState<number[]>([]);

  // Countdown timer
  useEffect(() => {
    if (phase === 'combat' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, timer]);

  // Handle timer completion
  useEffect(() => {
    if (timer <= 0) {
      setIsSpawning(false);
    }
  }, [timer]);

  // Generate enemy queue when phase changes to combat
  useEffect(() => {
    if (phase === 'combat') {
      const queueSize = Math.min(3 + currentLevel, 8);
      const newQueue = Array.from({ length: queueSize }, (_, i) => i);
      setEnemyQueue(newQueue);
    } else {
      setEnemyQueue([]);
    }
  }, [phase, currentLevel]);

  const handleNextLevel = () => {
    setEnemyQueue([]);
    setCurrentLevel(currentLevel + 1);
    setPhase('prep');
    setTimer(4);
    setLevelComplete(false);
    setIsSpawning(false);
  };

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      {/* Timer/Status */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'Arial',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        {phase === 'combat' && (
          <>
            {timer > 0 ? (
              <>
                Time until reinforcements stop: {timer}s
                <br />
                Enemies remaining: {enemiesAlive}
              </>
            ) : (
              <>
                No more reinforcements!
                <br />
                Defeat remaining {enemiesAlive} {enemiesAlive === 1 ? 'enemy' : 'enemies'}!
              </>
            )}
          </>
        )}
        {phase === 'prep' && 'Preparation Phase'}
      </div>

      {/* Enemy Queue */}
      {Array.isArray(enemyQueue) && enemyQueue.length > 0 && timer > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '8px',
        }}>
          <div style={{ color: 'white', marginBottom: '5px' }}>
            Next Enemies:
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}>
            {enemyQueue.slice(0, 3).map((_, index) => (
              <div
                key={index}
                style={{
                  width: '30px',
                  height: '30px',
                  background: 'red',
                  borderRadius: '4px',
                  opacity: 0.8 - (index * 0.2),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Level Complete Interface */}
      {levelComplete && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          pointerEvents: 'auto',
        }}>
          <div style={{
            color: '#4CAF50',
            fontSize: '32px',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}>
            Level {currentLevel} Complete!
          </div>
          <button
            onClick={handleNextLevel}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            Next Level →
          </button>
        </div>
      )}
    </Html>
  );
}
