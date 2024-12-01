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
  const { 
    phase, 
    currentLevel, 
    setPhase, 
    setEnemiesAlive, 
    addCreep, 
    isSpawning,
    setIsSpawning,
    creeps,
    incrementLevel,
    enemiesAlive 
  } = useGameStore();
  
  const waveQueue = useRef<Array<{ type: 'normal' | 'armored' | 'fast' | 'boss'; health: number }>>([]);
  const spawnTimerRef = useRef<number | null>(null);
  const enemyIdCounter = useRef(0);

  // Initialize wave
  useEffect(() => {
    if (!isSpawning || phase !== 'combat') {
      console.log('Not spawning or not in combat phase');
      return;
    }

    console.log(`Starting wave ${currentLevel}`);
    const wave = WAVES[currentLevel - 1];
    
    if (!wave) {
      console.log('No more waves available!');
      setPhase('victory');
      setIsSpawning(false);
      return;
    }

    // Build queue of enemies
    waveQueue.current = wave.creeps.flatMap(creep =>
      Array(creep.count).fill({ type: creep.type, health: creep.health })
    );

    // Randomize queue for variety
    for (let i = waveQueue.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [waveQueue.current[i], waveQueue.current[j]] = [waveQueue.current[j], waveQueue.current[i]];
    }

    const totalEnemies = waveQueue.current.length;
    console.log(`Wave ${currentLevel} starting with ${totalEnemies} enemies`);
    setEnemiesAlive(totalEnemies);

    // Start spawning
    const spawnEnemy = () => {
      if (waveQueue.current.length > 0) {
        const enemy = waveQueue.current.shift()!;
        enemyIdCounter.current++;

        // Add enemy to scene
        const startPos = pathPoints[0].clone();
        startPos.y = 1;

        // Create new creep
        const newCreep = {
          position: [startPos.x, startPos.y, startPos.z] as [number, number, number],
          type: enemy.type,
          health: enemy.health,
          maxHealth: enemy.health,
          id: enemyIdCounter.current,
          effects: {}
        };

        // Add to game store
        addCreep(newCreep);
        console.log(`Spawned ${enemy.type} creep (ID: ${enemyIdCounter.current}), ${waveQueue.current.length} remaining`);
        return newCreep;
      }
      return null;
    };

    const interval = setInterval(() => {
      if (!isSpawning) {
        console.log('Spawning stopped, clearing interval');
        clearInterval(interval);
        return;
      }

      const spawned = spawnEnemy();
      if (!spawned && waveQueue.current.length === 0) {
        console.log('Finished spawning all enemies for wave ' + currentLevel);
        clearInterval(interval);
        setIsSpawning(false);
      }
    }, wave.spawnInterval);

    spawnTimerRef.current = interval;

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [phase, currentLevel, isSpawning]);

  // Check for wave completion
  useEffect(() => {
    if (phase === 'combat' && !isSpawning && creeps.length === 0 && enemiesAlive === 0) {
      console.log(`Wave ${currentLevel} completed! All enemies defeated.`);
      setPhase('prep');
      incrementLevel();
    }
  }, [phase, isSpawning, creeps.length, enemiesAlive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, []);

  return null;
}
