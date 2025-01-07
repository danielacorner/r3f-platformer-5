import { Vector3 } from 'three';
import { SkillEffect } from '../types';

export function updateArcaneNova(
  effect: SkillEffect,
  now: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void
): boolean {
  const age = (now - effect.startTime) / 1000;
  const progress = Math.min(age / effect.duration, 1);

  if (progress >= 1) {
    return false;
  }

  // Apply damage during expansion phase
  if (progress < 0.5) {
    const scale = Math.min(progress * 2, 1) * effect.radius;
    creeps.forEach(creep => {
      if (!creep.isDead) {
        const creepPos = new Vector3(...creep.position);
        const distance = effect.position.distanceTo(creepPos);
        if (distance < scale) {
          damageCreep(creep.id, effect.damage);
        }
      }
    });
  }

  return true;
}
