import { Vector3 } from 'three';

export interface WaveCreep {
  type: 'normal' | 'armored' | 'fast' | 'boss';
  count: number;
  delay: number;  // Delay between each creep spawn in ms
  health: number;
  speed: number;
  value: number;  // Money reward for killing
  size: number;   // Scale factor
}

export interface WaveModifier {
  type: 'speed' | 'health' | 'shield' | 'regen' | 'split';
  value: number;
}

export interface Wave {
  id: number;
  creeps: WaveCreep[];
  modifiers?: WaveModifier[];
  baseDelay: number;  // Base delay between groups in ms
  isBossWave?: boolean;
  reward: number;     // Bonus money for completing wave
}

export interface WaveSet {
  level: number;
  waves: Wave[];
  difficulty: number;
}
// Base stats for different creep types
export const CREEP_BASE_STATS = {
  normal: {
    health: 100,
    speed: 1,
    value: 10,
    size: 0.8
  },
  fast: {
    health: 75,
    speed: 1.5,
    value: 15,
    size: 0.6
  },
  armored: {
    health: 200,
    speed: 0.8,
    value: 20,
    size: 1
  },
  boss: {
    health: 1000,
    speed: 0.6,
    value: 100,
    size: 1.5
  }
};

// Wave difficulty scaling factors
const DIFFICULTY_SCALING = {
  health: 1.15,    // Health increases by 15% per level
  count: 1.2,      // Creep count increases by 20% per level
  speed: 1.05,     // Speed increases by 5% per level
  reward: 1.1      // Rewards increase by 10% per level
};

// Helper function to scale stats based on difficulty
const scaleStats = (baseStats: typeof CREEP_BASE_STATS.normal, difficulty: number) => ({
  health: Math.round(baseStats.health * Math.pow(DIFFICULTY_SCALING.health, difficulty)),
  speed: baseStats.speed * Math.pow(DIFFICULTY_SCALING.speed, difficulty),
  value: Math.round(baseStats.value * Math.pow(DIFFICULTY_SCALING.reward, difficulty)),
  size: baseStats.size
});

// Generate waves for a level
export const generateWaveSet = (level: number): WaveSet => {
  const difficulty = Math.floor((level - 1) / 5);  // Increase difficulty every 5 levels
  const waves: Wave[] = [];
  const wavesCount = 5 + Math.floor(level / 10);   // Add an extra wave every 10 levels

  for (let i = 0; i < wavesCount; i++) {
    const isBossWave = i === wavesCount - 1;
    const wave: Wave = {
      id: i + 1,
      creeps: [],
      baseDelay: 1000,
      isBossWave,
      reward: Math.round(100 * Math.pow(DIFFICULTY_SCALING.reward, difficulty))
    };

    if (isBossWave) {
      // Boss wave
      const bossStats = scaleStats(CREEP_BASE_STATS.boss, difficulty);
      wave.creeps.push({
        type: 'boss',
        count: process.env.NODE_ENV === 'development' ? 1 : 1,
        delay: 0,
        ...bossStats
      });
      wave.modifiers = [
        { type: 'shield', value: 0.3 },
        { type: 'regen', value: 0.01 }
      ];
    } else {
      // Normal wave
      const creepTypes = ['normal', 'fast', 'armored'] as const;
      const groupCount = 2 + Math.floor(difficulty / 2);

      for (let j = 0; j < groupCount; j++) {
        const type = creepTypes[Math.floor(Math.random() * creepTypes.length)];
        const stats = scaleStats(CREEP_BASE_STATS[type], difficulty);

        wave.creeps.push({
          type,
          count: process.env.NODE_ENV === 'development' ? 2 : Math.round(5 * Math.pow(DIFFICULTY_SCALING.count, difficulty)),
          delay: 500,
          ...stats
        });
      }

      // Add wave modifiers based on difficulty
      if (difficulty > 0) {
        wave.modifiers = [];
        if (Math.random() < 0.3) wave.modifiers.push({ type: 'speed', value: 1.2 });
        if (Math.random() < 0.3) wave.modifiers.push({ type: 'health', value: 1.3 });
        if (difficulty > 2 && Math.random() < 0.2) wave.modifiers.push({ type: 'split', value: 2 });
      }
    }

    waves.push(wave);
  }

  return {
    level,
    waves,
    difficulty
  };
};
