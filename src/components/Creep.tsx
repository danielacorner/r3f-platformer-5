import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { Vector3 } from 'three';
import { Billboard } from '@react-three/drei';

interface CreepProps {
  id: number;
  pathPoints: Vector3[];
}

interface CreepData {
  id: number;
  position: [number, number, number];
  type: 'normal' | 'armored' | 'fast' | 'boss';
  health: number;
  maxHealth: number;
  effects: {
    [key: string]: {
      value: number;
      duration: number;
      startTime: number;
      stacks?: number;
    };
  };
}

const creepSpeeds = {
  normal: 0.1,
  fast: 0.15,
  armored: 0.08,
  boss: 0.06
};

const SPEED_MULTIPLIER = 30;

const creepSizes = {
  normal: [0.8, 0.8, 0.8],
  armored: [1, 1, 1],
  fast: [0.6, 0.6, 0.6],
  boss: [1.5, 1.5, 1.5],
};

const creepColors = {
  normal: '#ef4444',
  armored: '#6b7280',
  fast: '#22c55e',
  boss: '#8b5cf6',
};

const creepRewards = {
  normal: 20,
  armored: 40,
  fast: 25,
  boss: 100,
};

const effectColors = {
  slow: '#00ffff',
  amplify: '#ffff00',
  poison: '#00ff00',
  armor_reduction: '#ff0000',
  splash: '#ff00ff',
  freeze: '#0000ff',
  fear: '#ff0000',
  burn: '#ff9900',
  thorns: '#33cc33',
  curse: '#6600cc',
  mana_burn: '#cc00cc',
  mark: '#ff00ff',
};

export function Creep({ id, pathPoints }: { id: number; pathPoints: Vector3[] }) {
  const creepData = useGameStore(state => state.creeps.find(c => c.id === id));
  const updateCreep = useGameStore(state => state.updateCreep);
  const removeCreep = useGameStore(state => state.removeCreep);
  const addMoney = useGameStore(state => state.addMoney);
  const loseLife = useGameStore(state => state.loseLife);

  const ref = useRef<THREE.Group>(null);
  const pathIndex = useRef(1);
  const lastPosition = useRef<Vector3 | null>(null);

  const [effects, setEffects] = useState<{
    [key: string]: {
      value: number;
      duration: number;
      startTime: number;
      stacks?: number;
    };
  }>({});

  const applyEffect = useCallback((type: string, value: number, duration: number) => {
    setEffects(prev => {
      const currentTime = Date.now();
      const existing = prev[type];
      
      // Handle stacking effects
      if (existing) {
        const newStacks = (existing.stacks || 1) + 1;
        return {
          ...prev,
          [type]: {
            value: Math.max(existing.value, value),
            duration,
            startTime: currentTime,
            stacks: newStacks
          }
        };
      }

      return {
        ...prev,
        [type]: {
          value,
          duration,
          startTime: currentTime,
          stacks: 1
        }
      };
    });
  }, []);

  const getEffectValue = useCallback((type: string) => {
    const effect = effects[type];
    if (!effect) return 0;

    const elapsed = (Date.now() - effect.startTime) / 1000;
    if (elapsed > effect.duration) return 0;

    return effect.value;
  }, [effects]);

  const hasEffect = useCallback((type: string) => {
    return !!effects[type];
  }, [effects]);

  const getEffectStacks = useCallback((type: string) => {
    return effects[type]?.stacks || 0;
  }, [effects]);

  if (!creepData) {
    console.log('No creep data found for id:', id);
    return null;
  }

  const { position, type, health, maxHealth } = creepData;

  // Movement
  useFrame((state, delta) => {
    if (!ref.current || pathIndex.current >= pathPoints.length) return;

    const currentPos = new Vector3(...position);
    const targetPos = pathPoints[pathIndex.current];
    const direction = targetPos.clone().sub(currentPos).normalize();
    
    // Calculate speed with effects
    const slowValue = getEffectValue('slow');
    const baseSpeed = (creepSpeeds[type] || 0.1) * SPEED_MULTIPLIER;
    const currentSpeed = baseSpeed * (1 - slowValue);

    // Move towards next point
    const newPos = currentPos.clone().add(direction.multiplyScalar(currentSpeed * delta));
    newPos.y = 1; // Maintain constant height
    
    // Check if reached target
    const distanceToTarget = newPos.distanceTo(targetPos);
    if (distanceToTarget < 0.5) {
      pathIndex.current++;
      
      // Reached end of path
      if (pathIndex.current >= pathPoints.length) {
        loseLife();
        removeCreep(id);
        return;
      }
    }

    // Handle damage over time effects
    let dotDamage = 0;

    // Poison damage
    const poisonValue = getEffectValue('poison');
    if (poisonValue > 0) {
      dotDamage += poisonValue * delta;
    }

    // Burn damage
    const burnValue = getEffectValue('burn');
    if (burnValue > 0) {
      dotDamage += burnValue * delta;
    }

    // Apply total dot damage
    if (dotDamage > 0) {
      const amplifyValue = getEffectValue('amplify');
      const armorReduction = getEffectValue('armor_reduction');
      const totalDamage = dotDamage * (1 + amplifyValue) * (1 + armorReduction);
      updateCreep(id, {
        health: health - totalDamage
      });
    }

    // Handle curse effect when nearby enemies die
    if (hasEffect('curse')) {
      const nearbyDeaths = 0; // Replace with actual implementation
      if (nearbyDeaths > 0) {
        const curseValue = getEffectValue('curse');
        updateCreep(id, {
          health: health - nearbyDeaths * curseValue * maxHealth
        });
      }
    }

    // Handle mana burn
    if (hasEffect('mana_burn')) {
      const manaValue = getEffectValue('mana_burn');
      // Replace with actual implementation
    }

    // Check for death effects
    if (health <= 0) {
      if (hasEffect('mark')) {
        const explosionDamage = getEffectValue('mark');
        // Replace with actual implementation
      }
      removeCreep(id);
    }

    // Clean up expired effects
    setEffects(prev => {
      const currentTime = Date.now();
      const newEffects = { ...prev };
      
      Object.entries(prev).forEach(([type, effect]) => {
        const elapsed = (currentTime - effect.startTime) / 1000;
        if (elapsed > effect.duration) {
          delete newEffects[type];
        }
      });

      return newEffects;
    });

    // Update position and decay effects
    updateCreep(id, { 
      position: [newPos.x, newPos.y, newPos.z],
      effects: effects
    });

    // Store last position for rotation
    lastPosition.current = currentPos;
  });

  // Handle damage and effects
  useEffect(() => {
    if (health <= 0) {
      addMoney(creepRewards[type]);
    }
  }, [health, type, id, addMoney]);

  // Calculate rotation to face movement direction
  const rotation = useMemo(() => {
    if (!lastPosition.current) return [0, 0, 0];
    const currentPos = new Vector3(...position);
    const direction = currentPos.clone().sub(lastPosition.current).normalize();
    return [0, Math.atan2(direction.x, direction.z), 0];
  }, [position]);

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Creep model based on type */}
      <mesh castShadow>
        <boxGeometry args={creepSizes[type]} />
        <meshStandardMaterial color={creepColors[type]} />
      </mesh>

      {/* Health bar */}
      <Billboard position={[0, creepSizes[type][1] + 0.5, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[-(1 - health / maxHealth) / 2, 0, 0.01]} scale={[health / maxHealth, 1, 1]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="lime" />
        </mesh>
      </Billboard>

      {/* Effect indicators */}
      {Object.entries(effects).map(([effect, value], index) => 
        value ? (
          <Billboard key={effect} position={[0, creepSizes[type][1] + 0.7 + index * 0.2, 0]}>
            <mesh>
              <circleGeometry args={[0.1]} />
              <meshBasicMaterial color={effectColors[effect] || 'white'} />
            </mesh>
          </Billboard>
        ) : null
      )}
    </group>
  );
}
