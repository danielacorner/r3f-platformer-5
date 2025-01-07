import { Vector3 } from 'three';
import { SkillEffect } from '../types';
import { findNearestCreep } from '../utils';
import { useGameStore } from '../../../../store/gameStore';
import { activeEffects } from '../SkillEffects';

export function updateLightningStorm(
  effect: SkillEffect & {
    nextStrikeTime: number,
    strikeInterval: number,
    remainingStrikes: number,
    followPlayer?: boolean
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

  // Update position to follow player
  const playerRef = useGameStore.getState().playerRef;
  if (playerRef) {
    const playerPos = playerRef.translation();
    effect.position.set(playerPos.x, playerPos.y, playerPos.z);
  }

  // Time to strike?
  if (now >= effect.nextStrikeTime && effect.remainingStrikes > 0) {
    // Find all creeps in range
    const creepsInRange = creeps.filter(creep => {
      if (!creep || !creep.position || creep.isDead) return false;
      const creepPos = new Vector3(creep.position[0], creep.position[1], creep.position[2]);
      const distance = creepPos.distanceTo(effect.position);
      return distance <= effect.radius;
    });

    if (creepsInRange.length > 0) {
      // Pick a random creep to strike
      const targetCreep = creepsInRange[Math.floor(Math.random() * creepsInRange.length)];
      const targetPos = new Vector3(targetCreep.position[0], targetCreep.position[1], targetCreep.position[2]);

      // Create main lightning strike
      const strikeEffect = {
        id: Math.random().toString(),
        type: 'lightning',
        position: targetPos.clone(),
        startTime: now,
        duration: 0.3,
        radius: 0.5,
        color: '#80ffff',
      };

      // Add strike effect to activeEffects
      activeEffects.push(strikeEffect);

      // Apply damage
      damageCreep(targetCreep.id, effect.damage);

      // Update strike counter and next strike time
      effect.remainingStrikes--;
      effect.nextStrikeTime = now + effect.strikeInterval;

      // Notify that effects have changed
      window.dispatchEvent(new CustomEvent('effectsChanged'));
    } else {
      // If no creeps in range, just update next strike time
      effect.nextStrikeTime = now + effect.strikeInterval;
    }
  }

  return true;
}
