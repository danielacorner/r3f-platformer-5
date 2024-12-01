import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Vector3 } from 'three';
import { generateWaveSet, WaveCreep, Wave as ConfigWave } from '../config/waveConfig';

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
    enemiesAlive,
    addMoney,
    setWave
  } = useGameStore();
  
  const waveQueue = useRef<Array<WaveCreep & { waveId: number }>>([]);
  const spawnTimerRef = useRef<number | null>(null);
  const enemyIdCounter = useRef(0);
  const currentWaveRef = useRef<ConfigWave | null>(null);

  // Cleanup function
  const cleanup = () => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    waveQueue.current = [];
    currentWaveRef.current = null;
  };

  // Initialize wave
  useEffect(() => {
    if (!isSpawning || phase !== 'combat') {
      console.log('Not spawning or not in combat phase');
      return cleanup();
    }

    console.log(`Starting level ${currentLevel}`);
    const waveSet = generateWaveSet(currentLevel);
    const wave = waveSet.waves[0]; // Start with first wave
    currentWaveRef.current = wave;
    setWave(wave.id);
    
    if (!wave) {
      console.log('No more waves available!');
      setPhase('victory');
      setIsSpawning(false);
      return cleanup();
    }

    // Build queue of enemies with modifiers applied
    waveQueue.current = wave.creeps.flatMap(creepGroup => 
      Array(creepGroup.count).fill(null).map(() => ({
        ...creepGroup,
        waveId: wave.id,
        health: creepGroup.health * (wave.modifiers?.find(m => m.type === 'health')?.value || 1),
        speed: creepGroup.speed * (wave.modifiers?.find(m => m.type === 'speed')?.value || 1)
      }))
    );

    // Randomize queue for variety
    for (let i = waveQueue.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [waveQueue.current[i], waveQueue.current[j]] = [waveQueue.current[j], waveQueue.current[i]];
    }

    const totalEnemies = waveQueue.current.length;
    console.log(`Wave ${wave.id} starting with ${totalEnemies} enemies`);
    setEnemiesAlive(totalEnemies);

    // Start spawning
    const spawnEnemy = () => {
      if (waveQueue.current.length > 0) {
        const enemy = waveQueue.current.shift()!;
        enemyIdCounter.current++;

        // Add enemy to scene
        const startPos = pathPoints[0].clone();
        startPos.y = 0.5;  // Match the height in Creep component

        // Create new creep with modifiers
        const newCreep = {
          position: [startPos.x, startPos.y, startPos.z] as [number, number, number],
          type: enemy.type,
          health: enemy.health,
          maxHealth: enemy.health,
          speed: enemy.speed,
          size: enemy.size,
          value: enemy.value,
          id: String(enemyIdCounter.current),  // Convert to string
          effects: {},
          waveId: enemy.waveId
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
        console.log('Finished spawning all enemies for wave ' + currentWaveRef.current?.id);
        clearInterval(interval);
        setIsSpawning(false);
        
        // Award wave completion bonus
        if (currentWaveRef.current) {
          addMoney(currentWaveRef.current.reward);
        }
      }
    }, wave.baseDelay);

    spawnTimerRef.current = interval;

    return cleanup;
  }, [phase, currentLevel, isSpawning]);

  // Check for wave completion
  useEffect(() => {
    if (phase === 'combat' && !isSpawning && creeps.length === 0 && enemiesAlive === 0) {
      const waveSet = generateWaveSet(currentLevel);
      const currentWaveId = currentWaveRef.current?.id || 0;
      const nextWave = waveSet.waves[currentWaveId];

      if (nextWave) {
        // More waves in this level
        console.log(`Wave ${currentWaveId} completed! Starting next wave...`);
        currentWaveRef.current = nextWave;
        setWave(nextWave.id);
        setIsSpawning(true);
      } else {
        // Level complete
        console.log(`Level ${currentLevel} completed! All waves defeated.`);
        setPhase('prep');
        incrementLevel();
      }
    }
  }, [phase, isSpawning, creeps.length, enemiesAlive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return null;
}
