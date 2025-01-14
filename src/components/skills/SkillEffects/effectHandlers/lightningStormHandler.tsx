import { Vector3 } from "three";
import { SkillEffect } from "../types";
import { useGameStore } from "../../../../store/gameStore";

export function updateLightningStorm(
  effect: SkillEffect & {
    nextStrikeTime: number;
    strikeInterval: number;
    followPlayer?: boolean;
    ambientBolts?: {
      time: number;
      offset: Vector3;
    }[];
  },
  now: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void
): boolean {
  const age = (now - effect.startTime) / 1000;

  // Check if storm has ended based only on duration
  if (age > effect.duration) {
    return false;
  }

  // Update position to follow player if needed
  if (effect.followPlayer) {
    const playerRef = useGameStore.getState().playerRef;
    if (playerRef) {
      const playerPos = playerRef.translation();
      effect.position.set(playerPos.x, playerPos.y, playerPos.z);
    }
  }

  // Initialize ambient bolts if they don't exist
  if (!effect.ambientBolts) {
    effect.ambientBolts = Array(5)
      .fill(0)
      .map(() => ({
        time: now, // Start immediately
        offset: new Vector3(
          (Math.random() - 0.5) * effect.radius * 0.8,
          0,
          (Math.random() - 0.5) * effect.radius * 0.8
        ),
      }));
  }

  // Update ambient bolts
  effect.ambientBolts.forEach((bolt, index) => {
    if (now >= bolt.time) {
      // Create new ambient bolt
      effect.ambientBolts![index] = {
        time: now + Math.random() * 1000 + 500, // Next bolt in 0.5-1.5 seconds
        offset: new Vector3(
          (Math.random() - 0.5) * effect.radius * 0.8,
          0,
          (Math.random() - 0.5) * effect.radius * 0.8
        ),
      };
    }
  });

  // Check for strike timing
  if (now >= effect.nextStrikeTime) {
    // Get storm position (which might be following player or static)
    const stormPosition = effect.position;

    const nearbyCreeps = creeps.filter((creep) => {
      if (!creep || creep.isDead) return false;
      const creepPos = new Vector3(
        creep.position[0],
        creep.position[1],
        creep.position[2]
      );
      // Use storm position for range check
      const distance = creepPos.distanceTo(stormPosition);
      return distance <= effect.radius;
    });

    if (nearbyCreeps.length > 0) {
      // Choose a random creep to strike
      const targetCreep =
        nearbyCreeps[Math.floor(Math.random() * nearbyCreeps.length)];

      // Deal damage
      damageCreep(targetCreep.id, effect.damage ?? 0);

      // Schedule next strike
      effect.nextStrikeTime = now + effect.strikeInterval;
    } else {
      // If no targets found, check again sooner
      effect.nextStrikeTime = now + Math.min(100, effect.strikeInterval / 2);
    }
  }

  return true;
}
