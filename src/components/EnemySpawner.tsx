import { useState, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { Enemy } from './Enemy';
import { useGameStore } from '../store/gameStore';
import { LEVEL_CONFIGS } from './Level';
import { Text } from '@react-three/drei';

interface EnemySpawnerProps {
  position: Vector3;
}

export function EnemySpawner({ position }: EnemySpawnerProps) {
  const [enemies, setEnemies] = useState<{ id: string; position: Vector3 }[]>([]);
  const [queuedEnemies, setQueuedEnemies] = useState(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { phase, isSpawning, currentLevel, setEnemiesAlive } = useGameStore();
  const spawnInterval = 2000; // 2 seconds between spawns

  const maxEnemies = Math.min(3 + currentLevel, 8);

  // Reset enemies when phase changes to prep
  useEffect(() => {
    if (phase === 'prep') {
      setEnemies([]);
      setEnemiesAlive(0);
    }
  }, [phase, setEnemiesAlive]);

  // Update queued enemies count
  useEffect(() => {
    if (phase === 'combat' && isSpawning) {
      setQueuedEnemies(Math.max(0, maxEnemies - enemies.length));
    } else {
      setQueuedEnemies(0);
    }
  }, [phase, isSpawning, enemies.length, maxEnemies]);

  // Update enemies alive count
  useEffect(() => {
    console.log('Enemies updated:', enemies.length);
    setEnemiesAlive(enemies.length);
  }, [enemies.length, setEnemiesAlive]);

  // Handle enemy spawning
  useEffect(() => {
    // Clear existing timer
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }

    // Start spawning if conditions are met
    if (phase === 'combat' && isSpawning) {
      console.log('Starting spawn timer...');
      spawnTimerRef.current = setInterval(() => {
        setEnemies(prev => {
          if (prev.length >= maxEnemies || !isSpawning) return prev;
          console.log('Spawning enemy...', prev.length + 1);
          return [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              position: position.clone()
            }
          ];
        });
      }, spawnInterval);
    }

    // Cleanup
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    };
  }, [phase, isSpawning, maxEnemies]);

  const handleEnemyDeath = (enemyId: string) => {
    setEnemies(prev => prev.filter(enemy => enemy.id !== enemyId));
  };

  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];
  if (!config) return null;

  const portalPosition = new Vector3(...config.portalPosition);

  return (
    <>
      {/* Always visible spawner */}
      <group>
        {/* Base */}
        <mesh position={position}>
          <cylinderGeometry args={[1, 1.2, 0.2, 16]} />
          <meshStandardMaterial 
            color={phase === 'combat' ? "#400000" : "#202020"} 
            roughness={0.7}
          />
        </mesh>
        
        {/* Spawner pillar */}
        <mesh position={position.clone().add(new Vector3(0, 0.6, 0))}>
          <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
          <meshStandardMaterial 
            color={phase === 'combat' ? "red" : "#303030"}
            emissive={phase === 'combat' ? "red" : "#202020"}
            emissiveIntensity={isSpawning ? 0.8 : 0.2}
            roughness={0.3}
          />
        </mesh>

        {/* Enemy queue indicator */}
        {phase === 'combat' && (
          <group position={position.clone().add(new Vector3(0, 2.5, 0))}>
            {/* Background panel */}
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[2.5, 1, 0.1]} />
              <meshStandardMaterial 
                color="#000000"
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Colored overlay */}
            <mesh>
              <boxGeometry args={[2.4, 0.9, 0.12]} />
              <meshStandardMaterial 
                color={isSpawning ? "#400000" : "#202020"}
                emissive={isSpawning ? "#400000" : "#202020"}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {isSpawning ? `Incoming: ${queuedEnemies}` : 'Spawner Idle'}
            </Text>
          </group>
        )}
      </group>

      {/* Enemies */}
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          position={enemy.position}
          target={portalPosition}
          onDeath={() => handleEnemyDeath(enemy.id)}
        />
      ))}
    </>
  );
}
