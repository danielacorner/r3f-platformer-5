import { useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { Enemy } from './Enemy';
import { useGameStore } from '../store/gameStore';

interface EnemySpawnerProps {
  position: Vector3;
  spawnRadius?: number;
}

export function EnemySpawner({ position, spawnRadius = 2 }: EnemySpawnerProps) {
  const [enemies, setEnemies] = useState<{ id: string; position: Vector3 }[]>([]);
  const { phase, currentLevel } = useGameStore();

  // Slower spawn rate and lower max enemies
  const spawnInterval = Math.max(3000 - (currentLevel - 1) * 200, 2000); // ms
  const maxEnemies = Math.min(3 + currentLevel, 8); // Cap at 8 enemies

  useEffect(() => {
    if (phase !== 'combat') {
      setEnemies([]);
      return;
    }

    const spawnEnemy = () => {
      setEnemies(prev => {
        if (prev.length >= maxEnemies) return prev;

        // Random position within spawn radius
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spawnRadius;
        const spawnPos = new Vector3(
          position.x + Math.cos(angle) * radius,
          position.y,
          position.z + Math.sin(angle) * radius
        );

        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          position: spawnPos
        }];
      });
    };

    // Initial spawn
    spawnEnemy();

    // Set up interval for continuous spawning
    const interval = setInterval(spawnEnemy, spawnInterval);

    return () => {
      clearInterval(interval);
    };
  }, [phase, position, spawnRadius, spawnInterval, maxEnemies, currentLevel]);

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
