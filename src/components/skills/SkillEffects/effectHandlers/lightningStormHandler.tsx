import { Vector3 } from 'three';
import { SkillEffect } from '../types';
import { findNearestCreep } from '../utils';

export function updateLightningStorm(
  effect: SkillEffect & { 
    nextStrikeTime: number, 
    strikeInterval: number,
    remainingStrikes: number 
  },
  now: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void
): boolean {
  const age = (now - effect.startTime) / 1000;
  
  // Check if storm has ended
  if (age > effect.duration || effect.remainingStrikes <= 0) {
    return false;
  }

  // Time to strike?
  if (now >= effect.nextStrikeTime && effect.remainingStrikes > 0) {
    // Find all creeps in range
    const creepsInRange = creeps.filter(creep => {
      if (!creep || !creep.position) return false;
      const creepPos = new Vector3(...creep.position);
      return creepPos.distanceTo(effect.position) <= effect.radius;
    });

    if (creepsInRange.length > 0) {
      // Pick a random creep to strike
      const targetCreep = creepsInRange[Math.floor(Math.random() * creepsInRange.length)];
      
      // Apply damage
      damageCreep(targetCreep.id, effect.damage);

      // Create lightning strike effect
      const strikeEffect = {
        id: Math.random().toString(),
        type: 'lightning',
        position: new Vector3(...targetCreep.position),
        startTime: now,
        duration: 0.3,
        radius: 0.5,
        color: effect.color,
      };
      
      // Add strike effect
      window.dispatchEvent(new CustomEvent('addEffect', { detail: strikeEffect }));

      // Update strike counter and next strike time
      effect.remainingStrikes--;
      effect.nextStrikeTime = now + effect.strikeInterval;
    }
  }

  return true;
}
