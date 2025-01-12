import { Vector3 } from 'three';
import { SkillEffect } from '../types';
import { findNearestCreep } from '../utils';

// Constants for performance optimization
const MAX_TRAIL_LENGTH = 10;
const COLLISION_CHECK_INTERVAL = 2;
const MAX_SPEED = 16;
const MIN_SPEED = 4;
const SEEK_FORCE = 1;
const MIN_HEIGHT = 1.2;
const IDEAL_HEIGHT = 2.0;
const HIT_RADIUS = 0.8;
const SEEK_START_HEIGHT = 6;
const SEEK_TRANSITION_HEIGHT = 6.0; // Height range over which seeking gradually increases

let frameCounter = 0;

export function updateMagicMissile(
  effect: SkillEffect,
  delta: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void,
  trailsRef: React.MutableRefObject<Map<string, Vector3[]>>,
  now: number
): boolean {
  if (!effect.velocity) return false;

  // Get or create trail
  if (!trailsRef.current.has(effect.id)) {
    trailsRef.current.set(effect.id, []);
  }
  const trail = trailsRef.current.get(effect.id)!;

  // Update trail with less frequency
  trail.unshift(effect.position.clone());
  if (trail.length > MAX_TRAIL_LENGTH) {
    trail.pop();
  }

  if (now < effect.startTime) {
    return true;
  }

  // Start seeking immediately if there's a target
  const nearestCreepInfo = findNearestCreep(effect.position, creeps);

  // Update position
  effect.position.add(effect.velocity.clone().multiplyScalar(delta));

  // Calculate seek influence (0 to 1) based on height
  const heightDiffFromStart = Math.max(0, SEEK_START_HEIGHT - effect.position.y);
  const seekInfluence = Math.min(1, heightDiffFromStart / SEEK_TRANSITION_HEIGHT);

  // Seeking behavior
  if (effect.phase === 'rising') {
    effect.velocity.y -= 15 * delta; // Apply gravity

    // Start seeking earlier and if there's a target
    if ((effect.velocity.y < 0 && effect.position.y > SEEK_START_HEIGHT) ||
      (nearestCreepInfo && effect.position.y > SEEK_START_HEIGHT)) {
      effect.phase = 'seeking';
      // Maintain some upward momentum when transitioning
      effect.velocity.y = Math.max(effect.velocity.y, 2);
    }
  } else if (effect.phase === 'seeking') {
    if (nearestCreepInfo) {
      const { creep, position: creepPos } = nearestCreepInfo;
      const targetPos = creepPos.clone();

      // Predict target position based on current velocity
      if (creep.velocity) {
        targetPos.add(new Vector3(
          creep.velocity.x * 0.5,
          0,
          creep.velocity.z * 0.5
        ));
      }

      // Ensure target is at least at minimum height
      targetPos.y = Math.max(MIN_HEIGHT, creepPos.y + 0.5);

      const toTarget = targetPos.clone().sub(effect.position);
      const distanceToTarget = toTarget.length();

      // Stronger seeking at longer distances
      const distanceMultiplier = Math.min(4, 8 / Math.max(1, distanceToTarget));

      // Apply seek force with height control and gradual transition
      const seekForce = toTarget
        .normalize()
        .multiplyScalar(SEEK_FORCE * distanceMultiplier * delta * seekInfluence);

      // Add upward force if too low
      if (effect.position.y < MIN_HEIGHT) {
        seekForce.y += (MIN_HEIGHT - effect.position.y) * 30 * delta;
      }

      // Add hovering force to maintain ideal height
      const heightDiff = IDEAL_HEIGHT - effect.position.y;
      seekForce.y += heightDiff * 8 * delta;

      // More aggressive turning at close range, scaled by seek influence
      const turnMultiplier = Math.min(1, 2 / Math.max(1, distanceToTarget)) * seekInfluence;
      effect.velocity.lerp(
        toTarget.normalize().multiplyScalar(MAX_SPEED),
        0.15 * turnMultiplier
      );

      effect.velocity.add(seekForce);

      // Ensure velocity doesn't point too far down
      if (effect.velocity.y < 0) {
        effect.velocity.y *= 0.5;
      }

      // Maintain minimum speed
      const currentSpeed = effect.velocity.length();
      if (currentSpeed < MIN_SPEED) {
        effect.velocity.normalize().multiplyScalar(MIN_SPEED);
      }

      // Cap maximum speed
      else if (currentSpeed > MAX_SPEED) {
        effect.velocity.normalize().multiplyScalar(MAX_SPEED);
      }

      // Check for hits
      frameCounter = (frameCounter + 1) % COLLISION_CHECK_INTERVAL;
      if (frameCounter === 0 && distanceToTarget <= HIT_RADIUS) {
        const damageMultiplier = 1 - (distanceToTarget / HIT_RADIUS) * 0.3;
        const finalDamage = Math.floor((effect.damage || 0) * damageMultiplier);
        damageCreep(creep.id, finalDamage);
        
        // Spawn hit effect at the impact point
        if (typeof window !== 'undefined' && (window as any).spawnMissileHitEffect) {
          (window as any).spawnMissileHitEffect(effect.position);
        }
        
        trailsRef.current.delete(effect.id);
        return false;
      }
    } else {
      // No target found, maintain height and current direction
      if (effect.position.y < IDEAL_HEIGHT) {
        effect.velocity.y += (IDEAL_HEIGHT - effect.position.y) * 5 * delta;
      }

      // Maintain minimum speed when no target
      const speed = effect.velocity.length();
      if (speed < MIN_SPEED) {
        effect.velocity.normalize().multiplyScalar(MIN_SPEED);
      }
    }
  }

  // Remove if too old
  const age = (now - effect.startTime) / 1000;
  if (age > effect.duration) {
    trailsRef.current.delete(effect.id);
    return false;
  }

  return true;
}
