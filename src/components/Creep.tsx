import { useRef, useEffect, useMemo } from 'react';
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
    slow: number;
    amplify: number;
    dot: number;
    armor: number;
    splash: number;
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
  dot: '#00ff00',
  armor: '#ff0000',
  splash: '#ff00ff',
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

  if (!creepData) {
    console.log('No creep data found for id:', id);
    return null;
  }

  const { position, type, health, maxHealth, effects } = creepData;

  // Movement
  useFrame((state, delta) => {
    if (!ref.current || pathIndex.current >= pathPoints.length) return;

    const currentPos = new Vector3(...position);
    const targetPos = pathPoints[pathIndex.current];
    const direction = targetPos.clone().sub(currentPos).normalize();
    
    // Calculate speed with effects
    const slowEffect = effects.slow || 0;
    const baseSpeed = (creepSpeeds[type] || 0.1) * SPEED_MULTIPLIER;
    const currentSpeed = baseSpeed * (1 - slowEffect);

    // Move towards next point
    const newPos = currentPos.clone().add(direction.multiplyScalar(currentSpeed * delta));
    newPos.y = 1; // Maintain constant height
    
    // Check if reached target
    const distanceToTarget = newPos.distanceTo(targetPos);
    if (distanceToTarget < 0.5) {
      console.log(`Creep ${id} reached point ${pathIndex.current}, moving to next point`);
      pathIndex.current++;
      
      // Reached end of path
      if (pathIndex.current >= pathPoints.length) {
        console.log(`Creep ${id} reached end of path`);
        loseLife();
        removeCreep(id);
        return;
      }
    }

    // Update position
    updateCreep(id, { 
      position: [newPos.x, newPos.y, newPos.z],
      effects: {
        ...effects,
        slow: Math.max(0, (effects.slow || 0) - 0.1 * delta),
        amplify: Math.max(0, (effects.amplify || 0) - 0.2 * delta),
        poison: Math.max(0, (effects.poison || 0) - 5 * delta),
        armor: Math.max(0, (effects.armor || 0) - 0.1 * delta)
      }
    });

    // Store last position for rotation
    lastPosition.current = currentPos;
  });

  // Handle damage and effects
  useEffect(() => {
    if (health <= 0) {
      addMoney(creepRewards[type]);
      removeCreep(id);
    }
  }, [health, type, id, addMoney, removeCreep]);

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
