import { Vector3 } from 'three';
import { SkillEffect } from '../types';

export function updateTimeDilation(
  effect: SkillEffect,
  now: number,
  creeps: any[]
): boolean {
  const age = (now - effect.startTime) / 1000;

  if (age > effect.duration) {
    return false;
  }

  const radius = effect.radius || 5;
  const effectPos = new Vector3(effect.position.x, 0, effect.position.z);

  creeps.forEach(creep => {
    if (!creep.isDead) {
      const creepPos = new Vector3(...creep.position);
      const distance = effectPos.distanceTo(creepPos);
      
      if (distance <= radius) {
        creep.timeScale = 0.5; // Slow affected creeps
      } else {
        creep.timeScale = 1.0; // Reset unaffected creeps
      }
    }
  });

  return true;
}
