import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";
import { useGameStore } from "../../../store/gameStore";

const STORM_RADIUS = 12;
const BOLT_DAMAGE = 75;
const STORM_DURATION = 6;

export const getLightningStormStats = (level: number) => ({
  radius: STORM_RADIUS + level * 1.5,
  damage: BOLT_DAMAGE + level * 25,
  duration: STORM_DURATION + level * 0.5,
  strikeCount: 3 + Math.floor(level * 1.5),
  strikeInterval: 500 // Strike every 0.5 seconds
});

export function castLightningStorm(position: Vector3, level: number) {
  const stats = getLightningStormStats(level);
  const playerRef = useGameStore.getState().playerRef;

  // Get player position
  let stormPosition = position.clone();
  if (playerRef) {
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
    remainingStrikes: stats.strikeCount,
    level,
    followPlayer: true,
    seed: Math.random()
  };

  // Add main storm effect
  activeEffects.push(stormEffect);

  // Notify that effects have changed
  window.dispatchEvent(new CustomEvent('effectsChanged'));
}
