import { Vector3 } from 'three';
import { SkillEffect } from '../types';

export function updateArcaneNova(
  effect: SkillEffect,
  now: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void
): boolean {
  const age = (now - effect.startTime) / 1000;
  const progress = age / effect.duration;

  // Only apply damage during the main expansion phase (before max radius)
  if (progress < 0.8) {
    const currentRadius = effect.radius * Math.min(progress / 0.8, 1);
    creeps.forEach(creep => {
      if (!creep.isDead) {
        const creepPos = new Vector3(...creep.position);
        const distance = effect.position.distanceTo(creepPos);
        if (distance < currentRadius) {
          damageCreep(creep.id, effect.damage);
        }
      }
    });
  }

  // Keep effect alive for 1.5x duration to allow for fade out
  return age < effect.duration * 1.5;
}
