import { Vector3, Color, Euler, Matrix4 } from 'three';
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
  position: Vector3;
  velocity: Vector3;
  creepId: number;
  timeAlive: number;
}

export function Tower({ position, type, level = 1, preview = false, onDamageEnemy, canAfford = true }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const creeps = useGameStore(state => state.creeps);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2);
  const damage = stats.damage * (1 + (level - 1) * 0.3);

  const lastAttackTime = useRef(0);
  const projectileRef = useRef<THREE.InstancedMesh>(null);
  const [projectiles, setProjectiles] = useState<{
    id: number;
    position: Vector3;
    target: Vector3;
    progress: number;
  }[]>([]);

  const MAX_PROJECTILES = 20; // Limit max projectiles for performance

  // Initialize instanced mesh
  useEffect(() => {
    if (!projectileRef.current) return;
    
    const matrix = new Matrix4();
    const color = new Color(stats.emissive);
    
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      matrix.makeScale(0, 0, 0); // Hide initially
      projectileRef.current.setMatrixAt(i, matrix);
      projectileRef.current.setColorAt(i, color);
    }
    
    projectileRef.current.instanceMatrix.needsUpdate = true;
    if (projectileRef.current.instanceColor) {
      projectileRef.current.instanceColor.needsUpdate = true;
    }
  }, [stats.emissive]);

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

    if (closestCreep && projectiles.length < MAX_PROJECTILES) {
      const towerHeight = 1.2 + (parseInt(type.match(/\d+/)[0]) - 1) * 0.2;
      const startPos = new Vector3(
        towerPos.x,
        towerPos.y + towerHeight + 0.2,
        towerPos.z
      );

      const targetPos = new Vector3(
        closestCreep.position[0],
        closestCreep.position[1] + 0.5,
        closestCreep.position[2]
      );

      setProjectiles(prev => [...prev, {
        id: Date.now(),
        position: startPos,
        target: targetPos,
        progress: 0
      }]);

      useGameStore.getState().damageCreep(closestCreep.id, stats.damage, type);
      lastAttackTime.current = currentTime;
    }
  });

  // Update projectile positions
  useFrame((state, delta) => {
    if (phase !== 'combat' || preview || !projectileRef.current) return;

    const matrix = new Matrix4();
    let needsUpdate = false;

    // Update active projectiles
    projectiles.forEach((proj, index) => {
      if (index >= MAX_PROJECTILES) return;

      const newPosition = new Vector3().lerpVectors(proj.position, proj.target, proj.progress);
      matrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
      matrix.scale(new Vector3(1, 1, 1));
      projectileRef.current!.setMatrixAt(index, matrix);
      needsUpdate = true;
    });

    // Hide unused instances
    for (let i = projectiles.length; i < MAX_PROJECTILES; i++) {
      matrix.makeScale(0, 0, 0);
      projectileRef.current.setMatrixAt(i, matrix);
      needsUpdate = true;
    }

    if (needsUpdate) {
      projectileRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update projectile progress
    setProjectiles(current => 
      current.map(proj => {
        const newProgress = proj.progress + delta * 4;
        return newProgress >= 1 ? null : {
          ...proj,
          progress: newProgress
        };
      }).filter(Boolean)
    );
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

      {/* Instanced projectiles */}
      <instancedMesh
        ref={projectileRef}
        args={[null, null, MAX_PROJECTILES]}
        castShadow
      >
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial
          emissive={stats.emissive}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Range indicator */}
      {preview && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, stats.range, 32]} />
          <meshBasicMaterial color={stats.color} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
