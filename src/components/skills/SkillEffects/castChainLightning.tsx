import { Vector3 } from 'three';
import { activeEffects } from './SkillEffects';
import { applyPassiveEffects } from './passiveEffects';
import { findNearestCreep } from './utils';

const BASE_DAMAGE = 25;
const DAMAGE_PER_LEVEL = 15;
const CHAIN_DELAY = 150; // ms between chains
const BASE_CHAINS = 3;
const CHAINS_PER_LEVEL = 1;

export const getChainLightningStats = (level: number) => ({
  damage: applyPassiveEffects(BASE_DAMAGE + level * DAMAGE_PER_LEVEL, "lightning"),
  maxChains: BASE_CHAINS + level * CHAINS_PER_LEVEL,
  chainDelay: CHAIN_DELAY,
  duration: 2, // seconds
});

export function castChainLightning(position: Vector3, direction: Vector3, level: number) {
  const stats = getChainLightningStats(level);
  
  // Find initial target
  const creeps = window.gameState?.creeps || [];
  const initialTarget = findNearestCreep(position, creeps, 12); // 12 unit initial cast range
  
  if (!initialTarget) return; // No target found

  // Create the initial lightning effect
  const effect = {
    id: Math.random().toString(),
    type: 'chainLightning' as const,
    position: position.clone(),
    startTime: Date.now(),
    duration: stats.duration,
    damage: stats.damage,
    color: '#7c3aed',
    targetId: initialTarget.id,
    chainCount: 0,
    maxChains: stats.maxChains,
    lastChainTime: Date.now(),
    chainDelay: stats.chainDelay,
    chainTargets: [initialTarget.id],
    level,
  };

  // Deal initial damage
  window.gameState?.damageCreep(initialTarget.id, stats.damage);

  // Create initial lightning visual effect
  const initialLightning = {
    id: Math.random().toString(),
    type: 'lightning' as const,
    startPosition: position,
    endPosition: new Vector3(
      initialTarget.position[0],
      initialTarget.position[1],
      initialTarget.position[2]
    ),
    startTime: Date.now(),
    duration: 0.3, // 300ms
    color: '#7c3aed',
  };

  // Add effects
  activeEffects.push(effect);
  activeEffects.push(initialLightning);

  // Notify that effects have changed
  window.dispatchEvent(new CustomEvent('effectsChanged'));
}
