import { Vector3, Color, Euler } from 'three';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float, Trail } from '@react-three/drei';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

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

interface Projectile {
  id: number;
  position: [number, number, number];
  target: [number, number, number];
  direction: [number, number, number];
  speed: number;
  lifetime: number;
}

export function Tower({ position, type, level = 1, preview = false, onDamageEnemy, canAfford = true }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const creeps = useGameStore(state => state.creeps);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2);
  const damage = stats.damage * (1 + (level - 1) * 0.3);

  const lastAttackTime = useRef(0);
  const [projectiles, setProjectiles] = useState<{
    id: number;
    startPos: [number, number, number];
    targetPos: [number, number, number];
    progress: number;
  }[]>([]);

  // Handle projectile movement
  useFrame((state, delta) => {
    if (phase !== 'combat' || preview) return;

    setProjectiles(current => 
      current.map(proj => {
        const newProgress = proj.progress + delta * 5; // Slower speed for better visibility
        if (newProgress >= 1) return null;

        return {
          ...proj,
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
      const dx = creep.position[0] - towerPos.x;
      const dz = creep.position[2] - towerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= range && distance < closestDistance) {
        closestDistance = distance;
        closestCreep = creep;
      }
    }

    if (closestCreep) {
      const startPos: [number, number, number] = [
        towerPos.x,
        1.5, // Start from tower top
        towerPos.z
      ];

      const targetPos: [number, number, number] = [
        closestCreep.position[0],
        1.0, // Fixed height for better visibility
        closestCreep.position[2]
      ];

      setProjectiles(prev => [...prev, {
        id: Date.now(),
        startPos,
        targetPos,
        progress: 0
      }]);

      useGameStore.getState().damageCreep(closestCreep.id, stats.damage, type);
      lastAttackTime.current = currentTime;
    }
  });

  const [element, tier] = type.match(/([a-z]+)(\d+)/).slice(1);
  const tierNum = parseInt(tier);
  const baseWidth = 0.8 + (tierNum - 1) * 0.1;
  const baseHeight = 1.2 + (tierNum - 1) * 0.2;

  return (
    <group position={position instanceof Vector3 ? position.toArray() : position}>
      {/* Base platform for all towers */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[baseWidth * 0.7, baseWidth * 0.8, 0.2, 8]} />
        <meshStandardMaterial color={stats.color} />
      </mesh>

      {/* Element-specific main structure */}
      {element === 'light' && (
        <>
          {/* Crystal spire design */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.2, baseWidth * 0.5, baseHeight, 6]} />
            <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
          </mesh>
          {/* Floating crystals */}
          {[...Array(tierNum)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / tierNum, 0]}>
              <mesh position={[0.4, baseHeight * 0.7 + i * 0.2, 0]} castShadow>
                <octahedronGeometry args={[0.15]} />
                <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {element === 'fire' && (
        <>
          {/* Volcanic tower design */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.3, baseWidth * 0.6, baseHeight, 4]} />
            <meshStandardMaterial color="#8B0000" emissive={stats.emissive} emissiveIntensity={0.5} />
          </mesh>
          {/* Lava streams */}
          {[...Array(4)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / 4, 0]}>
              <mesh position={[0.2, baseHeight * 0.6, 0]} castShadow>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={stats.emissive} emissive={stats.emissive} emissiveIntensity={1} />
              </mesh>
            </group>
          ))}
          {/* Top flame */}
          <mesh position={[0, baseHeight + 0.2, 0]} castShadow>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshStandardMaterial color={stats.emissive} emissive={stats.emissive} emissiveIntensity={1} />
          </mesh>
        </>
      )}

      {element === 'ice' && (
        <>
          {/* Crystalline ice structure */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.4, baseWidth * 0.5, baseHeight, 6]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Ice shards */}
          {[...Array(tierNum + 2)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / (tierNum + 2), Math.PI * 0.1]}>
              <mesh position={[0.3, baseHeight * 0.6, 0]} castShadow>
                <coneGeometry args={[0.1, 0.4, 4]} />
                <meshStandardMaterial
                  color={stats.color}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          ))}
        </>
      )}

      {element === 'nature' && (
        <>
          {/* Organic trunk */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.3, baseWidth * 0.4, baseHeight, 6]} />
            <meshStandardMaterial color="#4B3621" />
          </mesh>
          {/* Leaves and vines */}
          {[...Array(tierNum + 1)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / (tierNum + 1), 0]}>
              <mesh position={[0.25, baseHeight * (0.4 + i * 0.2), 0]} castShadow>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
          {/* Top bloom */}
          <mesh position={[0, baseHeight + 0.2, 0]} castShadow>
            <dodecahedronGeometry args={[0.3]} />
            <meshStandardMaterial color={stats.emissive} emissive={stats.emissive} emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {element === 'water' && (
        <>
          {/* Flowing water column */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.3, baseWidth * 0.4, baseHeight, 8]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Water rings */}
          {[...Array(tierNum)].map((_, i) => (
            <group key={i} position={[0, baseHeight * (0.3 + i * 0.25), 0]}>
              <mesh castShadow>
                <torusGeometry args={[0.3, 0.1, 8, 16]} />
                <meshStandardMaterial
                  color={stats.color}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          ))}
        </>
      )}

      {element === 'dark' && (
        <>
          {/* Dark obelisk */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.2, baseWidth * 0.4, baseHeight, 4]} />
            <meshStandardMaterial color="#1a1a1a" emissive={stats.emissive} emissiveIntensity={0.7} />
          </mesh>
          {/* Floating dark orbs */}
          {[...Array(tierNum)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / tierNum, 0]}>
              <mesh position={[0.3, baseHeight * (0.3 + i * 0.2), 0]} castShadow>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
              </mesh>
            </group>
          ))}
          {/* Top crystal */}
          <mesh position={[0, baseHeight + 0.2, 0]} castShadow>
            <octahedronGeometry args={[0.25]} />
            <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
          </mesh>
        </>
      )}

      {/* Projectiles */}
      {projectiles.map(proj => {
        // Interpolate position
        const x = proj.startPos[0] + (proj.targetPos[0] - proj.startPos[0]) * proj.progress;
        const y = proj.startPos[1] + (proj.targetPos[1] - proj.startPos[1]) * proj.progress;
        const z = proj.startPos[2] + (proj.targetPos[2] - proj.startPos[2]) * proj.progress;

        return (
          <group key={proj.id}>
            {/* Main projectile */}
            <mesh position={[x, y, z]}>
              <sphereGeometry args={[0.2]} />
              <meshBasicMaterial 
                color={stats.emissive} 
                toneMapped={false}
              />
            </mesh>
            
            {/* Glow effect */}
            <pointLight
              position={[x, y, z]}
              color={stats.emissive}
              intensity={2}
              distance={2}
            />
          </group>
        );
      })}

      {/* Range indicator (only show in preview) */}
      {preview && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, stats.range, 32]} />
          <meshBasicMaterial color={stats.color} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
