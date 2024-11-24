import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { Enemy } from './Enemy';
import { useGameStore } from '../store/gameStore';

interface EnemySpawnerProps {
  position: Vector3;
  spawnRadius?: number;
}

export function EnemySpawner({ position, spawnRadius = 2 }: EnemySpawnerProps) {
  const [enemies, setEnemies] = useState<{ id: string; position: Vector3 }[]>([]);
  const { phase, isSpawning, currentLevel } = useGameStore();

  // Calculate spawn interval based on level (faster spawns in higher levels)
  const spawnInterval = Math.max(2000 - (currentLevel - 1) * 200, 800); // ms

  useEffect(() => {
    if (phase !== 'combat' || !isSpawning) return;

    const spawnEnemy = () => {
      // Random position within spawn radius
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spawnRadius;
      const spawnPos = new Vector3(
        position.x + Math.cos(angle) * radius,
        position.y,
        position.z + Math.sin(angle) * radius
      );

      setEnemies(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        position: spawnPos
      }]);
    };

    // Initial spawn
    spawnEnemy();

    // Set up interval for continuous spawning
    const interval = setInterval(spawnEnemy, spawnInterval);

    return () => {
      clearInterval(interval);
    };
  }, [phase, isSpawning, position, spawnRadius, spawnInterval]);

  const handleEnemyDeath = (enemyId: string) => {
    setEnemies(prev => prev.filter(enemy => enemy.id !== enemyId));
  };

  return (
    <>
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          position={enemy.position}
          onDeath={() => handleEnemyDeath(enemy.id)}
        />
      ))}
    </>
  );
}
