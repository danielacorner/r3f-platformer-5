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
    followPlayer?: boolean,
    ambientBolts?: {
      time: number;
      offset: Vector3;
    }[]
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

  // Initialize ambient bolts if they don't exist
  if (!effect.ambientBolts) {
    effect.ambientBolts = Array(5).fill(0).map(() => ({
      time: now,  // Start immediately
      offset: new Vector3(
        (Math.random() - 0.5) * effect.radius * 0.8,
        0,
        (Math.random() - 0.5) * effect.radius * 0.8
      )
    }));
  }

  // Update ambient bolts
  effect.ambientBolts.forEach((bolt, index) => {
    if (now >= bolt.time) {
      // Create new ambient bolt
      const boltPos = effect.position.clone().add(bolt.offset);
      const strikeEffect = {
        id: Math.random().toString(),
        type: 'lightning',
        position: boltPos,
        startTime: now,
        duration: 0.5,  // Longer duration
        radius: 0.5,
        color: '#80ffff',
        sourceHeight: 15,
        damage: 0, // Ambient bolts do no damage
        isAmbient: true
      };

      activeEffects.push(strikeEffect);
      console.log('Created ambient bolt:', strikeEffect);  // Debug log
      
      // Reset bolt timer and position with shorter interval
      bolt.time = now + 100;  // Strike every 100ms
      bolt.offset = new Vector3(
        (Math.random() - 0.5) * effect.radius * 0.8,
        0,
        (Math.random() - 0.5) * effect.radius * 0.8
      );
    }
  });

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
        duration: 0.5,
        radius: 0.5,
        color: '#ffffff',
        sourceHeight: 15,
        damage: effect.damage,
        isAmbient: false
      };

      // Add strike effect to activeEffects
      activeEffects.push(strikeEffect);
      console.log('Created lightning strike effect:', strikeEffect);
      console.log('Current active effects:', activeEffects);

      // Apply damage
      damageCreep(targetCreep.id, effect.damage);

      // Update strike counter and next strike time
      effect.remainingStrikes--;
      effect.nextStrikeTime = now + effect.strikeInterval;

      // Create additional visual effects
      for (let i = 0; i < 3; i++) {
        const offset = new Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        );
        const visualEffect = {
          id: Math.random().toString(),
          type: 'lightning',
          position: targetPos.clone().add(offset),
          startTime: now + i * 50, // Stagger the strikes
          duration: 0.3,
          radius: 0.3,
          color: '#80ffff',
          sourceHeight: 15,
          damage: 0,
          isAmbient: true
        };
        activeEffects.push(visualEffect);
      }

      // Notify that effects have changed
      window.dispatchEvent(new CustomEvent('effectsChanged'));
    } else {
      // If no creeps in range, create some visual effects
      const randomOffset = new Vector3(
        (Math.random() - 0.5) * effect.radius * 0.8,
        0,
        (Math.random() - 0.5) * effect.radius * 0.8
      );
      const visualPos = effect.position.clone().add(randomOffset);
      const visualEffect = {
        id: Math.random().toString(),
        type: 'lightning',
        position: visualPos,
        startTime: now,
        duration: 0.3,
        radius: 0.3,
        color: '#80ffff',
        sourceHeight: 15,
        damage: 0,
        isAmbient: true
      };
      activeEffects.push(visualEffect);
      
      // Update next strike time
      effect.nextStrikeTime = now + effect.strikeInterval;
    }
  }

  return true;
}
