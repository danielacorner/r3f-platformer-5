import { Vector3, Color, Euler } from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float, Trail } from '@react-three/drei';
import { Html } from '@react-three/drei';

interface TowerProps {
  position: Vector3 | [number, number, number];
  type: string;
  level?: number;
  preview?: boolean;
  onDamageEnemy?: (enemyId: number, damage: number, effects: any) => void;
  canAfford?: boolean;
}

interface Arrow {
  id: number;
  startPosition: Vector3;
  direction: Vector3;
  startTime: number;
}

export function Tower({ position, type, level = 1, preview, onDamageEnemy, canAfford = true }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const creeps = useGameStore(state => state.creeps);
  const lastAttackTime = useRef(0);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2);
  const damage = stats.damage * (1 + (level - 1) * 0.3);
  const [projectiles, setProjectiles] = useState<{
    id: number;
    position: [number, number, number];
    target: [number, number, number];
    progress: number;
  }[]>([]);
  const time = useRef(0);
  const lastPhoenixTime = useRef(0);

  // Linear interpolation helper
  function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
  }

  // Handle projectile movement
  useFrame((state, delta) => {
    setProjectiles(current => 
      current.map(proj => {
        // Super fast movement like Element TD
        const newProgress = proj.progress + delta * 15;
        
        if (newProgress >= 1) {
          return null;
        }

        // Completely straight line path
        const x = lerp(proj.position[0], proj.target[0], newProgress);
        const z = lerp(proj.position[2], proj.target[2], newProgress);
        const y = 0.5; // Fixed low height

        return {
          ...proj,
          position: [x, y, z] as [number, number, number],
          progress: newProgress
        };
      }).filter(Boolean)
    );
  });

  const handleAttack = useCallback((creep: { id: number, position: [number, number, number] }) => {
    if (!stats.special) return;

    const { applyEffectToCreep, damageCreep } = useGameStore.getState();

    switch (stats.special.type) {
      // Light Tower Effects
      case 'amplify':
        applyEffectToCreep(creep.id, 'amplify', stats.special.value, 2.5);
        break;
      case 'chain_amplify':
        applyEffectToCreep(creep.id, 'amplify', stats.special.value, 2.5);
        const nearbyCreeps = findNearbyCreeps(creep.position, 3);
        nearbyCreeps.slice(0, stats.special.bounces || 2).forEach(nearby => {
          applyEffectToCreep(nearby.id, 'amplify', stats.special.value * 0.8, 2);
        });
        break;
      case 'aura_amplify':
        const auraCreeps = findNearbyCreeps(position, stats.special.radius || 4);
        auraCreeps.forEach(nearby => {
          applyEffectToCreep(nearby.id, 'amplify', stats.special.value, 1);
        });
        break;
      case 'purify':
        applyEffectToCreep(creep.id, 'amplify', stats.special.value, 3);
        applyEffectToCreep(creep.id, 'heal_block', stats.special.heal_block || 5, 3);
        break;
      case 'divine_mark':
        applyEffectToCreep(creep.id, 'amplify', stats.special.value, 3);
        applyEffectToCreep(creep.id, 'mark', stats.special.explosion || 100, 5);
        break;

      // Fire Tower Effects
      case 'burn':
        applyEffectToCreep(creep.id, 'burn', stats.special.value, 3);
        break;
      case 'meteor':
        if (Math.random() < 0.2) {
          const meteorTargets = findNearbyCreeps(creep.position, stats.special.radius || 2);
          meteorTargets.forEach(target => {
            applyEffectToCreep(target.id, 'burn', stats.special.value, 2);
            damageCreep(target.id, stats.special.value);
          });
        }
        break;
      case 'inferno':
        const creepState = useGameStore.getState().creeps.find(c => c.id === creep.id);
        const stacks = creepState?.effects?.burn?.stacks || 0;
        applyEffectToCreep(creep.id, 'burn', stats.special.value * Math.pow(stats.special.stack_multiplier || 1.5, stacks), 3);
        break;
      case 'phoenix':
        applyEffectToCreep(creep.id, 'burn', stats.special.value, 2);
        if (!lastPhoenixTime.current || time.current - lastPhoenixTime.current > (stats.special.cooldown || 10) * 1000) {
          const phoenixTargets = findNearbyCreeps(position, range);
          phoenixTargets.forEach(target => damageCreep(target.id, stats.special.value));
          lastPhoenixTime.current = time.current;
        }
        break;

      // Ice Tower Effects
      case 'slow':
        applyEffectToCreep(creep.id, 'slow', stats.special.value, 2);
        break;
      case 'frozen_ground':
        const groundTargets = findNearbyCreeps(position, stats.special.radius || 3);
        groundTargets.forEach(target => {
          applyEffectToCreep(target.id, 'slow', stats.special.value, stats.special.duration || 3);
        });
        break;
      case 'shatter':
        const creepData = useGameStore.getState().creeps.find(c => c.id === creep.id);
        if (creepData?.effects?.slow?.value >= (stats.special.shatter_threshold || 0.5)) {
          damageCreep(creep.id, stats.damage * 2);
        }
        applyEffectToCreep(creep.id, 'slow', stats.special.value, 2);
        break;

      // Add other effects similarly...
    }

    // Apply base damage
    damageCreep(creep.id, stats.damage);
  }, [stats, position, range, time]);

  // Handle attacking
  useFrame((state) => {
    time.current = state.clock.getElapsedTime() * 1000;
    if (phase !== 'combat' || preview) return;

    const currentTime = time.current;
    if (currentTime - lastAttackTime.current < attackCooldown) return;

    const towerPos = position instanceof Vector3 ? position : new Vector3(...position);
    let closestCreep = null;
    let closestDistance = Infinity;

    for (const creep of creeps) {
      const creepPos = new Vector3(creep.position[0], creep.position[1], creep.position[2]);
      const distance = towerPos.distanceTo(creepPos);

      if (distance <= range && distance < closestDistance) {
        closestDistance = distance;
        closestCreep = creep;
      }
    }

    if (closestCreep) {
      const startPos: [number, number, number] = [
        towerPos.x, 
        0.5, // Fixed low height
        towerPos.z
      ];
      
      const targetPos: [number, number, number] = [
        closestCreep.position[0],
        0.5, // Same height for straight line
        closestCreep.position[2]
      ];

      setProjectiles(prev => [...prev, {
        id: Date.now(),
        position: startPos,
        target: targetPos,
        progress: 0
      }]);

      if (onDamageEnemy) {
        handleAttack(closestCreep);
        onDamageEnemy(closestCreep.id, damage, {});
      }

      lastAttackTime.current = currentTime;
    }
  });

  return (
    <group position={position instanceof Vector3 ? position.toArray() : position}>
      {/* Base Tower */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 2, 8]} />
        <meshStandardMaterial
          color={stats.color}
          emissive={stats.emissive}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
          transparent={preview}
          opacity={preview ? (canAfford ? 0.7 : 0.3) : 1}
        />
      </mesh>

      {/* Top */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.6, 0.4, 8]} />
        <meshStandardMaterial
          color={stats.color}
          emissive={stats.emissive}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
          transparent={preview}
          opacity={preview ? (canAfford ? 0.7 : 0.3) : 1}
        />
      </mesh>

      {/* Range Indicator */}
      {(phase === 'prep' || preview) && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, range, 32]} />
          <meshBasicMaterial color={stats.emissive} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Projectiles */}
      {projectiles.map(proj => (
        <group key={proj.id} position={proj.position}>
          {/* Main projectile */}
          <mesh castShadow>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial 
              color={stats.emissive} 
              emissive={stats.emissive}
              emissiveIntensity={5}
              toneMapped={false}
            />
          </mesh>
          
          {/* Bright core */}
          <pointLight color={stats.emissive} intensity={2} distance={0.5} />
          
          {/* Very tight trail */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 0.01,
                -(i * 0.02),
                (Math.random() - 0.5) * 0.01
              ]}
              scale={(4 - i) / 4}
            >
              <sphereGeometry args={[0.08]} />
              <meshStandardMaterial 
                color={stats.emissive} 
                emissive={stats.emissive}
                emissiveIntensity={4}
                transparent 
                opacity={(4 - i) / 4}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
