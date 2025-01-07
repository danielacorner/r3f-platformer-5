import { Vector3 } from 'three';
import { SkillEffect } from '../types';
import { useGameStore } from '../../../../store/gameStore';

// Constants
const BOOMERANG_MAX_DURATION = 5;
const BOOMERANG_MIN_HEIGHT = 1;
const BOOMERANG_MAX_DISTANCE = 15;
const BOOMERANG_SPEED = 20;
const BOOMERANG_RETURN_SPEED = 25;
const BOOMERANG_CURVE = 15;
const BOOMERANG_SEEK_STRENGTH = 0.8;
const BOOMERANG_RETURN_RADIUS = 1;
const HIT_RADIUS = 0.5;

export function updateBoomerang(
  effect: SkillEffect,
  delta: number,
  creeps: any[],
  damageCreep: (id: string, damage: number) => void,
  trailsRef: React.MutableRefObject<Map<string, Vector3[]>>,
  now: number
): boolean {
  // Update trail
  if (!trailsRef.current.has(effect.id)) {
    trailsRef.current.set(effect.id, []);
  }
  const trail = trailsRef.current.get(effect.id)!;

  trail.unshift(effect.position.clone());
  if (trail.length > 15) {
    trail.pop();
  }

  effect.age = (effect.age || 0) + delta;

  // Remove if max duration exceeded
  if (effect.age > BOOMERANG_MAX_DURATION) {
    trailsRef.current.delete(effect.id);
    return false;
  }

  if (!effect.velocity) return false;

  const frameVelocity = effect.velocity.clone().multiplyScalar(delta);
  effect.position.add(frameVelocity);

  // Clamp height to minimum
  if (effect.position.y < BOOMERANG_MIN_HEIGHT) {
    effect.position.y = BOOMERANG_MIN_HEIGHT;
    // Reflect any downward velocity
    if (effect.velocity.y < 0) {
      effect.velocity.y = Math.abs(effect.velocity.y) * 0.5;
    }
  }

  if (effect.phase === 'outward') {
    // Calculate distance from spawn
    const distanceFromSpawn = effect.position.distanceTo(effect.spawnPos);

    if (distanceFromSpawn >= BOOMERANG_MAX_DISTANCE) {
      effect.phase = 'return';
    } else {
      // Only seek if we haven't hit any enemies yet
      if (!effect.hasHitEnemy) {
        // Find nearest enemy
        let nearestCreep = null;
        let nearestDist = Infinity;

        for (const creep of creeps) {
          if (!creep || !creep.position) continue;
          const creepPos = new Vector3(...creep.position);
          const dist = effect.position.distanceTo(creepPos);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestCreep = creep;
          }
        }

        // Add curved path and enemy seeking
        const forward = effect.velocity.clone().normalize();
        const right = new Vector3(forward.z, 0, -forward.x).normalize();

        // Base curve
        effect.velocity.add(right.multiplyScalar(BOOMERANG_CURVE * (effect.curve || 1) * delta));

        // Add enemy seeking if we have a target
        if (nearestCreep) {
          const toEnemy = new Vector3(...nearestCreep.position).sub(effect.position).normalize();
          effect.velocity.lerp(toEnemy.multiplyScalar(BOOMERANG_SPEED), delta * BOOMERANG_SEEK_STRENGTH);
        }
      } else {
        // Just continue on curved path without seeking
        const forward = effect.velocity.clone().normalize();
        const right = new Vector3(forward.z, 0, -forward.x).normalize();
        effect.velocity.add(right.multiplyScalar(BOOMERANG_CURVE * (effect.curve || 1) * delta));
      }
    }
  } else if (effect.phase === 'return') {
    // Get current player position for tracking
    const playerRef = useGameStore.getState().playerRef;
    if (playerRef) {
      const playerPos = playerRef.translation();
      const returnTarget = new Vector3(playerPos.x, playerPos.y + 1, playerPos.z);

      // Calculate path to player
      const toPlayer = returnTarget.clone().sub(effect.position);
      const distanceToPlayer = toPlayer.length();

      // Only remove if very close to player
      if (distanceToPlayer < BOOMERANG_RETURN_RADIUS) {
        trailsRef.current.delete(effect.id);
        return false;
      }

      // Stronger return force when close
      const returnStrength = Math.min(1, BOOMERANG_RETURN_RADIUS / Math.max(1, distanceToPlayer));
      const toPlayerDir = toPlayer.normalize();
      const right = new Vector3(toPlayerDir.z, 0, -toPlayerDir.x).normalize();
      const returnForce = toPlayerDir.multiplyScalar(BOOMERANG_RETURN_SPEED * (1 + returnStrength))
        .add(right.multiplyScalar(BOOMERANG_CURVE * (effect.curve || 1) * 0.3));

      // More aggressive lerping when close
      effect.velocity.lerp(returnForce, 0.2 + returnStrength * 0.4);

      // Maintain speed based on phase
      effect.velocity.normalize().multiplyScalar(BOOMERANG_RETURN_SPEED);
    }
  }

  // Check for enemy hits
  for (const creep of creeps) {
    if (!creep || !creep.position) continue;

    const creepPos = new Vector3(...creep.position);
    const hitDistance = effect.position.distanceTo(creepPos);

    if (hitDistance <= HIT_RADIUS) {
      const damageMultiplier = 1 - (hitDistance / HIT_RADIUS) * 0.3;
      const finalDamage = Math.floor((effect.damage || 0) * damageMultiplier);

      damageCreep(creep.id, finalDamage);

      // Mark that we've hit an enemy to stop seeking behavior
      effect.hasHitEnemy = true;

      // Don't change phase, let it continue on its path
      // Only start returning if we've gone too far from spawn
      const distanceFromSpawn = effect.position.distanceTo(effect.spawnPos);
      if (distanceFromSpawn >= BOOMERANG_MAX_DISTANCE) {
        effect.phase = 'return';
      }

      // Add hit effect to the trail
      const hitPos = effect.position.clone();
      for (let i = 0; i < 2; i++) {
        trail.push(hitPos.clone().add(new Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )));
      }
      // Trim trail to prevent it from growing too long
      while (trail.length > 15) {
        trail.pop();
      }
    }
  }

  return true;
}
