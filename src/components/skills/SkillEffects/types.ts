import { Vector3 } from 'three';

export interface SkillEffect {
  id: string;
  type: string;
  position: Vector3;
  startTime: number;
  duration: number;
  radius: number;
  damage?: number;
  color: string;
  velocity?: Vector3;
  phase?: 'rising' | 'seeking' | 'falling' | 'outward' | 'return';
  initialVelocity?: Vector3;
  timeOffset?: number;
  spawnDir?: Vector3;
  spawnPos?: Vector3;
  curve?: number;
  age?: number;
  level?: number;
  hasHitEnemy?: boolean;
  expansionSpeed?: number;
  nextStrikeTime?: number;
  strikeInterval?: number;
  remainingStrikes?: number;
  seed?: number;
}
