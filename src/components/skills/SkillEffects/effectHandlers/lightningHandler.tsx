import { Vector3 } from 'three';
import { SkillEffect } from '../types';

export function updateLightning(
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

  // Check for enemy hits if the lightning just appeared
  if (progress < 0.1) {
    creeps.forEach(creep => {
      if (!creep.isDead) {
        const creepPos = new Vector3(...creep.position);
        const distance = effect.position.distanceTo(creepPos);
        if (distance < effect.radius) {
          damageCreep(creep.id, effect.damage);
        }
      }
    });
  }

  return true;
}
