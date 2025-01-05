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