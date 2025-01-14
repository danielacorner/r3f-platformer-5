import { Vector3 } from 'three';
import { SkillEffect } from '../types';
import { findNearestCreep } from '../utils';

const CHAIN_RANGE = 8; // Range to find next target
const CHAIN_DURATION = 300; // Duration of each chain in ms

export function updateChainLightning(
  effect: SkillEffect & {
    targetId?: string;
    chainCount: number;
    maxChains: number;
    lastChainTime: number;
    chainDelay: number;
    chainTargets: string[];
  },
  now: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void
): boolean {
  // Check if the effect has expired
  if (now - effect.startTime > effect.duration * 1000) {
    return false;
  }

  // If we haven't chained yet and it's time to chain
  if (effect.chainCount < effect.maxChains && now >= effect.lastChainTime + effect.chainDelay) {
    const currentCreep = creeps.find(c => c.id === effect.targetId);
    if (!currentCreep) return true; // Keep effect alive but skip this frame

    const currentPos = new Vector3(
      currentCreep.position[0],
      currentCreep.position[1],
      currentCreep.position[2]
    );

    // Find next target (excluding already hit targets)
    const nextTarget = findNearestCreep(
      currentPos,
      creeps.filter(c => !effect.chainTargets.includes(c.id)),
      CHAIN_RANGE
    );

    if (nextTarget) {
      // Deal damage to the next target
      damageCreep(nextTarget.id, effect.damage * 0.8); // Each chain does 80% of previous damage

      // Update effect state
      effect.targetId = nextTarget.id;
      effect.chainTargets.push(nextTarget.id);
      effect.chainCount++;
      effect.lastChainTime = now;

      // Create lightning visual effect between the two points
      const lightningEffect = {
        id: Math.random().toString(),
        type: 'lightning' as const,
        startPosition: currentPos,
        endPosition: new Vector3(
          nextTarget.position[0],
          nextTarget.position[1],
          nextTarget.position[2]
        ),
        startTime: now,
        duration: CHAIN_DURATION / 1000, // Convert to seconds
        color: effect.color,
      };

      // Add to active effects
      window.dispatchEvent(new CustomEvent('addEffect', { detail: lightningEffect }));
    }
  }

  return true;
}
