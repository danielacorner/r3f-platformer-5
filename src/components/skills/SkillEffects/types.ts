import { Vector3 } from 'three';

export interface SkillEffect {
  id: string;
  type: 'magicMissile' | 'arcaneNova' | 'lightning' | 'magicBoomerang' | 'inferno';
  position: Vector3;
  startTime: number;
  duration: number;
  damage?: number;
  radius?: number;
  velocity?: Vector3;
  phase?: 'rising' | 'seeking' | 'falling' | 'outward' | 'return';
  color?: string;
  expansionSpeed?: number;
  level?: number;
  age?: number;
  spawnPos?: Vector3;
  curve?: number;
  hasHitEnemy?: boolean;
}
