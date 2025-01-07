import { Vector3 } from 'three';

export interface SkillEffect {
  id: string;
  type: 'magicMissile' | 'timeDilation' | 'arcaneNova';
  position: Vector3;
  startTime: number;
  duration: number;
  damage?: number;
  radius?: number;
  velocity?: Vector3;
  phase?: 'rising' | 'seeking' | 'falling';
  color?: string;
  expansionSpeed?: number;
  level?: number;
}
