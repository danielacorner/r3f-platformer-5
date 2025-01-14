import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";
import { useGameStore } from "../../../store/gameStore";
import { applyPassiveEffects } from './passiveEffects';

const STORM_RADIUS = 7;
const BOLT_DAMAGE = 18;
const STORM_DURATION = 8; // Changed to match SkillsMenu duration

export const getLightningStormStats = (level: number) => ({
  radius: STORM_RADIUS + level * 1.5,
  damage: applyPassiveEffects(BOLT_DAMAGE + level * 25, "lightning"),
  duration: STORM_DURATION,
  strikeInterval: Math.max(200, 500 - level * 25) // Strike interval decreases with level, min 200ms
});

export function castLightningStorm(position: Vector3, level: number) {
  const stats = getLightningStormStats(level);
  const playerRef = useGameStore.getState().playerRef;

  // Get initial position
  let stormPosition = position.clone();
  if (!position && playerRef) {
    const playerPos = playerRef.translation();
    stormPosition = new Vector3(playerPos.x, playerPos.y, playerPos.z);
  }

  // Create the main storm effect
  const stormEffect = {
    id: Math.random().toString(),
    type: 'lightningStorm' as const,
    position: stormPosition,
    startTime: Date.now(),
    duration: stats.duration,
    radius: stats.radius,
    damage: stats.damage,
    color: '#a786e0',
    nextStrikeTime: Date.now(),
    strikeInterval: stats.strikeInterval,
    level,
    followPlayer: false, // Storm stays where it was cast
    seed: Math.random()
  };

  // Add main storm effect
  activeEffects.push(stormEffect);

  // Notify that effects have changed
  window.dispatchEvent(new CustomEvent('effectsChanged'));
}
