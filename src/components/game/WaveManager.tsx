import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { Vector3 } from "three";
import {
  generateWaveSet,
  WaveCreep,
  Wave as ConfigWave,
} from "../../config/waveConfig";

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
    setWave,
    isWaveInProgress,
    setIsWaveInProgress,
    setWaveStartTime,
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
    if (!isSpawning || phase !== "combat") {
      console.log("Not spawning or not in combat phase");
      return cleanup();
    }

    console.log(`Starting level ${currentLevel}`);
    const waveSet = generateWaveSet(currentLevel);
    const wave =
      waveSet.waves.find((w) => w.id === currentWaveRef.current?.id) ||
      waveSet.waves[0];
    currentWaveRef.current = wave;
    setWave(wave.id);

    console.log("Current wave set:", {
      wave,
      currentWaveRef: currentWaveRef.current,
    });

    if (!wave) {
      console.log("No more waves available!");
      setPhase("victory");
      setIsSpawning(false);
      return cleanup();
    }

    // Build queue of enemies with modifiers applied
    const totalEnemies = wave.creeps.reduce(
      (total, group) => total + group.count,
      0
    );
    console.log(`Wave ${wave.id} will have ${totalEnemies} total enemies`);
    setEnemiesAlive(totalEnemies);

    waveQueue.current = wave.creeps.flatMap((creepGroup) =>
      Array(creepGroup.count)
        .fill(null)
        .map(() => ({
          ...creepGroup,
          waveId: wave.id,
          health:
            creepGroup.health *
            (wave.modifiers?.find((m) => m.type === "health")?.value || 1),
          speed:
            creepGroup.speed *
            (wave.modifiers?.find((m) => m.type === "speed")?.value || 1),
        }))
    );

    // Randomize queue for variety
    for (let i = waveQueue.current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [waveQueue.current[i], waveQueue.current[j]] = [
        waveQueue.current[j],
        waveQueue.current[i],
      ];
    }

    console.log(
      `Wave ${wave.id} queue prepared with ${waveQueue.current.length} enemies`
    );

    // Start spawning
    const spawnEnemy = () => {
      if (waveQueue.current.length > 0) {
        const enemy = waveQueue.current.shift()!;
        enemyIdCounter.current++;

        // Add enemy to scene
        const startPos = pathPoints[0].clone();
        startPos.y = 0.5; // Match the height in Creep component

        // Create new creep with modifiers
        const newCreep = {
          position: [startPos.x, startPos.y, startPos.z] as [
            number,
            number,
            number
          ],
          type: enemy.type,
          health: enemy.health,
          maxHealth: enemy.health,
          speed: enemy.speed,
          size: enemy.size,
          value: enemy.value,
          id: String(enemyIdCounter.current), // Convert to string
          effects: {},
          waveId: enemy.waveId,
        };

        // Add to game store
        addCreep(newCreep);
        console.log(
          `Spawned ${enemy.type} creep (ID: ${enemyIdCounter.current}), ${waveQueue.current.length} remaining`
        );
        return newCreep;
      }
      return null;
    };

    const interval = setInterval(() => {
      if (!isSpawning) {
        console.log("Spawning stopped, clearing interval");
        clearInterval(interval);
        return;
      }

      const spawned = spawnEnemy();
      if (!spawned && waveQueue.current.length === 0) {
        console.log(
          "Finished spawning all enemies for wave " + currentWaveRef.current?.id
        );
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
    const checkWaveCompletion = () => {
      console.log("Wave completion check:", {
        phase,
        isSpawning,
        enemiesAlive,
        creepsLength: creeps.length,
        currentWaveId: currentWaveRef.current?.id,
        currentLevel,
      });

      if (phase !== "combat" || isSpawning || enemiesAlive > 0) {
        return;
      }

      const waveSet = generateWaveSet(currentLevel);
      const currentWaveId = currentWaveRef.current?.id || 0;
      console.log("Wave state:", {
        currentWaveId,
        availableWaves: waveSet.waves.map((w) => w.id),
        currentLevel,
      });

      const nextWave = waveSet.waves.find((w) => w.id === currentWaveId + 1);
      console.log("Next wave found:", nextWave);

      if (nextWave) {
        // More waves in this level
        console.log(
          `Wave ${currentWaveId} completed! Next wave will be ${nextWave.id}`
        );
        setPhase("prep");
        currentWaveRef.current = nextWave;
        setWave(nextWave.id);
      } else {
        // Level complete
        console.log(`Level ${currentLevel} completed! All waves defeated.`);
        setPhase("prep");
        incrementLevel();
      }
    };

    // Add a small delay to ensure all state updates are processed
    const timer = setTimeout(checkWaveCompletion, 100);
    return () => clearTimeout(timer);
  }, [phase, isSpawning, enemiesAlive, currentLevel]);

  const startWave = () => {
    if (isWaveInProgress) return;

    // Debug log
    console.log("Starting wave...");

    // Get the store instance
    const store = useGameStore.getState();
    console.log("Current store state:", store);

    // Call startWave
    store.startWave();
    console.log("Wave started, new state:", useGameStore.getState());

    setIsWaveInProgress(true);
    setWaveStartTime(Date.now());
  };

  const handleNextWave = () => {
    // Debug log
    console.log("Next wave clicked");

    // Get current store state
    const store = useGameStore.getState();

    // Update wave state
    store.startWave();

    // Start wave
    startWave();

    console.log("Wave started, new state:", useGameStore.getState());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return null;
}
