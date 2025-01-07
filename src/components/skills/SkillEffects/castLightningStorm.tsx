import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";
import * as THREE from 'three';

const STORM_RADIUS = 20; // 2x the usual range
const BOLT_DAMAGE = 75;
const STORM_DURATION = 6;

export const getLightningStormStats = (level: number) => ({
  radius: STORM_RADIUS + level * 2,
  damage: BOLT_DAMAGE + level * 25,
  duration: STORM_DURATION + level * 0.5,
  strikeCount: 3 + Math.floor(level * 1.5),
  strikeInterval: 1000 / (2 + level * 0.5)
});

export function castLightningStorm(position: Vector3, level: number) {
  const stats = getLightningStormStats(level);
  
  // Create the main storm effect
  const stormEffect = {
    id: Math.random().toString(),
    type: 'lightningStorm',
    position: position.clone().add(new Vector3(0, 8, 0)), // Raise cloud position
    startTime: Date.now(),
    duration: stats.duration,
    radius: stats.radius,
    damage: stats.damage,
    color: '#7c3aed',
    nextStrikeTime: Date.now(),
    strikeInterval: stats.strikeInterval,
    remainingStrikes: stats.strikeCount,
    level
  };

  // Add main storm effect
  activeEffects.push(stormEffect);

  // Create initial range indicator effect
  const rangeEffect = {
    id: Math.random().toString(),
    type: 'stormRange',
    position: position.clone(),
    startTime: Date.now(),
    duration: stats.duration,
    radius: stats.radius,
    color: '#7c3aed',
    level
  };

  // Add range indicator effect
  activeEffects.push(rangeEffect);

  // Create cloud effect
  const cloudEffect = {
    id: Math.random().toString(),
    type: 'stormCloud',
    position: position.clone().add(new Vector3(0, 8, 0)),
    startTime: Date.now(),
    duration: stats.duration,
    radius: 5,
    color: '#7c3aed',
    level
  };

  // Add cloud effect
  activeEffects.push(cloudEffect);

  // Notify that effects have changed
  window.dispatchEvent(new CustomEvent('effectsChanged'));
}
