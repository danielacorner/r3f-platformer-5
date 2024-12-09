import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { Enemy } from "./Enemy";
import { useGameStore } from "../store/gameStore";
import { LEVEL_CONFIGS } from "./level/Level";
import { Text } from "@react-three/drei";

interface EnemySpawnerProps {
  position: Vector3;
}

export function EnemySpawner({ position }: EnemySpawnerProps) {
  const [enemies, setEnemies] = useState<{ id: string; position: Vector3 }[]>(
    []
  );
  const [queuedEnemies, setQueuedEnemies] = useState(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { phase, isSpawning, currentLevel, setEnemiesAlive } = useGameStore();
  const spawnInterval = 2000; // 2 seconds between spawns

  const maxEnemies = Math.min(3 + currentLevel, 8);

  // Reset enemies when phase changes to prep
  useEffect(() => {
    if (phase === "prep") {
      console.log("Prep phase - resetting enemies");
      setEnemies([]);
      setEnemiesAlive(0);
    }
  }, [phase, setEnemiesAlive]);

  // Update queued enemies count
  useEffect(() => {
    if (phase === "combat" && isSpawning) {
      console.log(
        "Combat phase - updating queue. Max:",
        maxEnemies,
        "Current:",
        enemies.length
      );
      setQueuedEnemies(Math.max(0, maxEnemies - enemies.length));
    } else {
      setQueuedEnemies(0);
    }
  }, [phase, isSpawning, enemies.length, maxEnemies]);

  // Update enemies alive count
  useEffect(() => {
    console.log("Updating enemies alive count:", enemies.length);
    setEnemiesAlive(enemies.length);
  }, [enemies, setEnemiesAlive]);

  // Handle enemy spawning
  useEffect(() => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }

    if (phase === "combat" && isSpawning) {
      console.log("Starting spawn timer...");

      const spawnEnemy = () => {
        setEnemies((prev) => {
          if (prev.length >= maxEnemies) {
            console.log("Max enemies reached:", maxEnemies);
            return prev;
          }
          console.log("Spawning new enemy. Current count:", prev.length);
          return [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              position: position.clone(),
            },
          ];
        });
      };

      // Initial spawn
      spawnEnemy();
      // Set up interval for subsequent spawns
      spawnTimerRef.current = setInterval(spawnEnemy, spawnInterval);
    }

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [phase, isSpawning, maxEnemies, position, spawnInterval]);

  const handleEnemyDeath = (enemyId: string) => {
    console.log("Enemy death:", enemyId);
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== enemyId));
  };

  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];
  if (!config) return null;

  const portalPosition = new Vector3(...config.portalPosition);

  return (
    <>
      {/* Always visible spawner */}
      <group>
        {/* Base */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 32]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        {/* Spawn point indicator */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.1, 1, 0.4, 8]} />
          <meshStandardMaterial color="#ff0000" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Queued enemies indicator */}
      {queuedEnemies > 0 && (
        <group position={[0, 2, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {queuedEnemies}
          </Text>
        </group>
      )}

      {/* Enemies */}
      <group name="enemies">
        {enemies.map((enemy) => (
          <Enemy
            key={enemy.id}
            position={enemy.position}
            target={portalPosition}
            onDeath={() => handleEnemyDeath(enemy.id)}
          />
        ))}
      </group>
    </>
  );
}
