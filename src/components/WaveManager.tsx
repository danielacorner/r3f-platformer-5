import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Vector3 } from 'three';

interface Wave {
  creeps: {
    type: 'normal' | 'armored' | 'fast' | 'boss';
    health: number;
    count: number;
  }[];
  spawnInterval: number;
}

const WAVES: Wave[] = [
  // Wave 1: Introduction
  {
    creeps: [{ type: 'normal', health: 100, count: 10 }],
    spawnInterval: 1500,
  },
  // Wave 2: Mix of normal and fast
  {
    creeps: [
      { type: 'normal', health: 120, count: 8 },
      { type: 'fast', health: 80, count: 4 },
    ],
    spawnInterval: 1200,
  },
  // Wave 3: Introduce armored
  {
    creeps: [
      { type: 'normal', health: 140, count: 8 },
      { type: 'armored', health: 200, count: 3 },
    ],
    spawnInterval: 1000,
  },
  // Wave 4: All types
  {
    creeps: [
      { type: 'normal', health: 160, count: 10 },
      { type: 'fast', health: 100, count: 6 },
      { type: 'armored', health: 250, count: 4 },
    ],
    spawnInterval: 800,
  },
  // Wave 5: Boss wave
  {
    creeps: [
      { type: 'normal', health: 180, count: 12 },
      { type: 'fast', health: 120, count: 8 },
      { type: 'armored', health: 300, count: 5 },
      { type: 'boss', health: 1000, count: 1 },
    ],
    spawnInterval: 1000,
  },
];

interface WaveManagerProps {
  pathPoints: Vector3[];
}

export function WaveManager({ pathPoints }: WaveManagerProps) {
  const { phase, currentLevel, setPhase, setEnemiesAlive, addCreep } = useGameStore();
  const waveQueue = useRef<Array<{ type: 'normal' | 'armored' | 'fast' | 'boss'; health: number }>>([]);
  const spawnTimerRef = useRef<number | null>(null);
  const enemyIdCounter = useRef(0);

  // Initialize wave
  useEffect(() => {
    if (phase === 'prep') return;

    const wave = WAVES[currentLevel - 1];
    if (!wave) return;

    // Build queue of enemies
    waveQueue.current = wave.creeps.flatMap(creep =>
      Array(creep.count).fill({ type: creep.type, health: creep.health })
    );

    // Randomize queue for variety
    for (let i = waveQueue.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [waveQueue.current[i], waveQueue.current[j]] = [waveQueue.current[j], waveQueue.current[i]];
    }

    setEnemiesAlive(waveQueue.current.length);

    // Start spawning
    const spawnEnemy = () => {
      if (waveQueue.current.length > 0) {
        const enemy = waveQueue.current.shift()!;
        enemyIdCounter.current++;

        // Add enemy to scene
        const startPos = pathPoints[0].clone();
        startPos.y = 1; // Set exact height instead of adding

        // Create new creep
        const newCreep = {
          position: [startPos.x, startPos.y, startPos.z] as [number, number, number],
          type: enemy.type,
          health: enemy.health,
          maxHealth: enemy.health,
          id: enemyIdCounter.current,
          effects: {
            slow: 0,
            amplify: 0,
            dot: 0,
            armor: 0,
            splash: 0
          }
        };

        // Add to game store
        addCreep(newCreep);
        console.log('Spawned creep:', newCreep);
        return newCreep;
      }
      return null;
    };

    const interval = setInterval(() => {
      const spawned = spawnEnemy();
      if (!spawned && waveQueue.current.length === 0) {
        clearInterval(interval);
      }
    }, wave.spawnInterval);

    spawnTimerRef.current = interval;

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    };
  }, [phase, currentLevel, setPhase, setEnemiesAlive, addCreep, pathPoints]);

  if (phase !== 'combat') return null;

  return null; // Creeps are now managed through the store
}
