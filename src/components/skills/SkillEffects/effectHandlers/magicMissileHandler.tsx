import { Vector3 } from "three";
import { SkillEffect } from "../types";
import { findNearestCreep } from "../utils";
import {
  GRAVITY,
  HIT_RADIUS,
  HORIZONTAL_SEEK_HEIGHT,
  MAX_SPEED,
  SEEK_FORCE,
} from "../constants";

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

  // Update trail
  trail.unshift(effect.position.clone());
  if (trail.length > 20) {
    trail.pop();
  }

  if (now < effect.startTime) {
    return true;
  }

  const age = (now - effect.startTime) / 1000;

  if (age > effect.duration) {
    // Clean up trail when effect expires
    trailsRef.current.delete(effect.id);
    return false;
  }

  const frameVelocity = effect.velocity.clone().multiplyScalar(delta);
  effect.position.add(frameVelocity);

  if (effect.phase === "rising") {
    // Full gravity during rising phase for parabolic arc
    effect.velocity.add(GRAVITY.clone().multiplyScalar(delta));

    // Transition to seeking when velocity points downward and we're above minimum height
    if (effect.velocity.y < 0 && effect.position.y > HORIZONTAL_SEEK_HEIGHT) {
      effect.phase = "seeking";

      // Set horizontal velocity in spawn direction but slower
      const spawnDir = (effect as any).spawnDir || new Vector3(1, 0, 0);
      effect.velocity.set(
        spawnDir.x * MAX_SPEED * 0.5,
        0,
        spawnDir.z * MAX_SPEED * 0.5
      );

      console.log("Missile transitioning to seeking phase");
    }
  } else if (effect.phase === "seeking") {
    const nearestCreepInfo = findNearestCreep(effect.position, creeps);
    if (nearestCreepInfo) {
      const { creep, position: creepPos } = nearestCreepInfo;

      // Target slightly above the creep
      const targetPos = creepPos.clone();
      targetPos.y = Math.max(HORIZONTAL_SEEK_HEIGHT, creepPos.y + 0.5);

      const toTarget = targetPos.clone().sub(effect.position);
      const distanceToTarget = toTarget.length();

      // Stronger seeking force overall and even stronger at close range
      const distanceMultiplier = Math.min(3, 5 / Math.max(1, distanceToTarget));
      const seekForce = toTarget
        .normalize()
        .multiplyScalar(SEEK_FORCE * distanceMultiplier * delta);

      // Apply seek force
      effect.velocity.add(seekForce);

      // More aggressive height adjustment
      const heightDiff = targetPos.y - effect.position.y;
      effect.velocity.y += heightDiff * 12 * delta;

      // Direct velocity more towards target when close
      const directness = Math.min(1, 3 / Math.max(1, distanceToTarget));
      effect.velocity.lerp(
        toTarget.normalize().multiplyScalar(MAX_SPEED),
        0.2 + directness * 0.4 // More direct steering at close range
      );

      // Ensure minimum speed towards target
      const currentSpeed = effect.velocity.length();
      if (currentSpeed < MAX_SPEED * 0.5) {
        effect.velocity.normalize().multiplyScalar(MAX_SPEED * 0.5);
      }
      // Cap maximum speed
      else if (currentSpeed > MAX_SPEED) {
        effect.velocity.normalize().multiplyScalar(MAX_SPEED);
      }

      // Check for hits with larger radius
      const hitDistance = effect.position.distanceTo(targetPos);
      if (hitDistance <= HIT_RADIUS) {
        // Apply damage with slight falloff based on distance
        const damageMultiplier = 1 - (hitDistance / HIT_RADIUS) * 0.3;
        const finalDamage = Math.floor((effect.damage || 0) * damageMultiplier);

        console.log(
          "Missile hit creep:",
          effect.id,
          "with damage:",
          finalDamage,
          "at distance:",
          hitDistance.toFixed(2)
        );
        damageCreep(creep.id, finalDamage);

        // Create a small explosion effect in the trail
        const explosionPos = effect.position.clone();
        const trail = trailsRef.current.get(effect.id)!;

        // Clear existing trail and add explosion particles
        trail.length = 0;
        for (let i = 0; i < 3; i++) {
          trail.push(
            explosionPos
              .clone()
              .add(
                new Vector3(
                  (Math.random() - 0.5) * 0.5,
                  (Math.random() - 0.5) * 0.5,
                  (Math.random() - 0.5) * 0.5
                )
              )
          );
        }

        // Remove trail and effect after a short delay to show explosion
        setTimeout(() => {
          trailsRef.current.delete(effect.id);
        }, 100);

        return false;
      }
    } else {
      // Keep moving in current direction if no target found
      const horizontalVel = effect.velocity.clone();
      horizontalVel.y = 0;
      if (horizontalVel.length() < 0.1) {
        effect.phase = "falling";
      }
    }
  } else if (effect.phase === "falling") {
    effect.velocity.add(GRAVITY.clone().multiplyScalar(delta));
    if (effect.position.y <= 0) {
      trailsRef.current.delete(effect.id);
      return false;
    }
  }

  return true;
}
