import { Vector3, Color, Euler } from 'three';
import { useRef, useState, useEffect } from 'react';
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

  // Handle attacking
  useFrame((state) => {
    if (phase !== 'combat' || preview) return;

    const currentTime = state.clock.getElapsedTime() * 1000;
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
        onDamageEnemy(closestCreep.id, damage, {
          slow: type === 'ice' ? 0.5 : 0,
          amplify: type === 'arcane' ? 0.3 : 0,
          poison: type === 'nature' ? damage * 0.2 : 0,
          armor: type === 'void' ? 0.2 : 0,
        });
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
