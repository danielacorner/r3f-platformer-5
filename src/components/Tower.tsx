import { Vector3, Color, Euler, Matrix4, Object3D, InstancedMesh, Group } from 'three';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float, Trail } from '@react-three/drei';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ProjectileSystem } from './ProjectileSystem';
import { createShaderMaterial } from '../utils/shaders';
import { ObjectPool } from '../utils/objectPool';

const TOWER_GEOMETRY = new THREE.BoxGeometry(1, 2, 1);
const PROJECTILE_GEOMETRY = new THREE.SphereGeometry(0.1, 8, 8);

const tempObject = new Object3D();
const tempVector = new Vector3();
const tempMatrix = new Matrix4();

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

interface TowerManagerProps {
  towers: TowerProps[];
}

export function TowerManager({ towers }: TowerManagerProps) {
  const towerMeshRef = useRef<InstancedMesh>();
  const projectileMeshRef = useRef<InstancedMesh>();
  const activeTowers = useRef<Map<string, { props: TowerProps; instanceId: number }>>(new Map());
  const projectilePool = useRef<ObjectPool<Object3D>>();

  // Create shader materials
  const towerMaterial = useMemo(() => createShaderMaterial('tower', {
    time: { value: 0 },
    powerLevel: { value: 1.0 }
  }), []);

  const projectileMaterial = useMemo(() => createShaderMaterial('tower', {
    time: { value: 0 },
    color: { value: new Vector3(1, 0.5, 0) }
  }), []);

  // Initialize instance attributes
  const { levelArray, typeArray, activeArray } = useMemo(() => {
    const maxInstances = 100;
    return {
      levelArray: new Float32Array(maxInstances),
      typeArray: new Float32Array(maxInstances),
      activeArray: new Float32Array(maxInstances)
    };
  }, []);

  useEffect(() => {
    if (!towerMeshRef.current) return;

    // Set up instance attributes
    const geometry = towerMeshRef.current.geometry as THREE.BufferGeometry;
    geometry.setAttribute('instanceLevel', new THREE.BufferAttribute(levelArray, 1));
    geometry.setAttribute('instanceType', new THREE.BufferAttribute(typeArray, 1));
    geometry.setAttribute('instanceActive', new THREE.BufferAttribute(activeArray, 1));

    // Initialize projectile pool
    projectilePool.current = new ObjectPool(() => new Object3D(), 1000);
  }, []);

  useFrame((state, delta) => {
    if (!towerMeshRef.current || !projectileMeshRef.current) return;

    // Update time uniform for shader effects
    towerMaterial.uniforms.time.value += delta;
    projectileMaterial.uniforms.time.value += delta;

    // Update towers
    activeTowers.current.forEach(({ props, instanceId }) => {
      const { position, type, level, target } = props;

      // Update tower transform
      tempObject.position.set(...(position instanceof Vector3 ? position.toArray() : position));
      if (target) {
        tempVector.set(...target.position).sub(tempObject.position);
        tempObject.lookAt(tempVector.add(tempObject.position));
      }
      tempObject.updateMatrix();
      towerMeshRef.current?.setMatrixAt(instanceId, tempObject.matrix);

      // Update instance attributes
      levelArray[instanceId] = level;
      typeArray[instanceId] = ['basic', 'advanced', 'ultimate'].indexOf(type);
      activeArray[instanceId] = target ? 1 : 0;
    });

    // Update instance matrices and attributes
    towerMeshRef.current.instanceMatrix.needsUpdate = true;
    towerMeshRef.current.geometry.attributes.instanceLevel.needsUpdate = true;
    towerMeshRef.current.geometry.attributes.instanceType.needsUpdate = true;
    towerMeshRef.current.geometry.attributes.instanceActive.needsUpdate = true;
  });

  // Handle tower lifecycle
  useEffect(() => {
    // Add new towers
    towers.forEach(towerProps => {
      const key = towerProps.position instanceof Vector3 ? towerProps.position.toArray().join(',') : towerProps.position.join(',');
      if (!activeTowers.current.has(key)) {
        const instanceId = activeTowers.current.size;
        activeTowers.current.set(key, { props: towerProps, instanceId });
      }
    });

    // Remove inactive towers
    activeTowers.current.forEach(({ props }, key) => {
      if (!towers.find(t => (t.position instanceof Vector3 ? t.position.toArray().join(',') : t.position.join(',')) === key)) {
        activeTowers.current.delete(key);
      }
    });
  }, [towers]);

  return (
    <>
      <instancedMesh
        ref={towerMeshRef}
        args={[TOWER_GEOMETRY, towerMaterial, 100]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={projectileMeshRef}
        args={[PROJECTILE_GEOMETRY, projectileMaterial, 1000]}
        castShadow
      />
    </>
  );
}

export function Tower({ position, type, level = 1, preview = false, onDamageEnemy, canAfford = true }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const creeps = useGameStore(state => state.creeps);
  const stats = TOWER_STATS[type] ?? TOWER_STATS.dark1;
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2);
  const damage = stats.damage * (1 + (level - 1) * 0.3);

  const lastAttackTime = useRef(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const PROJECTILE_SPEED = 15;
  const MAX_PROJECTILES = 10;
  const [time, setTime] = useState(0);
  const [orbs, setOrbs] = useState<Array<{ angle: number }>>([]);

  const projectilesRef = useRef<Projectile[]>([]);
  const towerRef = useRef<THREE.Group>(null);

  // Extract actual level from tower type (e.g., "fire5" -> 5)
  const actualLevel = parseInt(type.slice(-1)) || 1;
  const elementType = type.replace(/[0-9]/g, '');

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  useFrame((_, delta) => {
    setTime(t => t + delta);
  });

  const getOrbStyle = () => {
    const baseStyle = {
      size: 0.12,
      emissiveIntensity: 3,
      opacity: 0.9
    };

    switch (elementType) {
      case 'light':
        return { ...baseStyle, emissiveIntensity: 4, opacity: 0.95 };
      case 'fire':
        return { ...baseStyle, emissiveIntensity: 5 };
      case 'ice':
        return { ...baseStyle, opacity: 0.7, emissiveIntensity: 2.5 };
      case 'nature':
        return { ...baseStyle, emissiveIntensity: 2.8 };
      case 'water':
        return { ...baseStyle, opacity: 0.8, emissiveIntensity: 2.2 };
      case 'dark':
        return { ...baseStyle, emissiveIntensity: 3.5 };
      default:
        return baseStyle;
    }
  };

  // Element-specific shape generation
  const ElementShape = ({ index, position, rotation }: { index: number; position: [number, number, number], rotation: number }) => {
    const orbStyle = getOrbStyle();
    const scale = 0.12;
    
    const getElementalEffect = () => {
      switch(elementType) {
        case 'fire':
          // Aggressive, sharp shapes with intense glow
          return (
            <group position={position} rotation={[time * 0.8, rotation + time, time * 0.5]}>
              {index > 0 && ( // Additional effects for higher levels
                <mesh scale={1 + (index * 0.1)}>
                  <octahedronGeometry args={[scale * (1 + index * 0.1)]} />
                  <meshStandardMaterial
                    color="orange"
                    emissive="red"
                    emissiveIntensity={3 + index}
                    transparent
                    opacity={0.3}
                    wireframe
                  />
                </mesh>
              )}
              <mesh castShadow>
                <octahedronGeometry args={[scale * (1 + index * 0.1)]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity * (1 + index * 0.5)}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
              {index > 1 && ( // Flame-like effects for level 3+
                <group rotation={[time, -time, time * 0.5]}>
                  <mesh scale={1.2 + (index * 0.1)}>
                    <tetrahedronGeometry args={[scale * 0.8]} />
                    <meshStandardMaterial
                      color="yellow"
                      emissive="orange"
                      emissiveIntensity={2 + index}
                      transparent
                      opacity={0.4}
                    />
                  </mesh>
                </group>
              )}
            </group>
          );

        case 'ice':
          // Crystalline, faceted shapes with transparency
          return (
            <group position={position} rotation={[time * 0.2, rotation, time * 0.1]}>
              <mesh castShadow>
                <polyhedronGeometry args={[scale * (1 + index * 0.15)]} />
                <meshPhysicalMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity}
                  metalness={0.9}
                  roughness={0.1}
                  transparent
                  opacity={0.7}
                  transmission={0.5}
                  thickness={1.5}
                />
              </mesh>
              {index > 0 && ( // Crystal formations for higher levels
                <Edges
                  scale={1.05}
                  threshold={15}
                  color="white"
                />
              )}
              {index > 1 && ( // Frost effect for level 3+
                <mesh scale={1.2}>
                  <icosahedronGeometry args={[scale * 1.2]} />
                  <meshPhysicalMaterial
                    color="white"
                    emissive="lightblue"
                    emissiveIntensity={1}
                    transparent
                    opacity={0.2}
                    roughness={0}
                    transmission={0.9}
                  />
                </mesh>
              )}
            </group>
          );

        case 'nature':
          // Organic, flowing shapes with leaf-like elements
          return (
            <group position={position} rotation={[time * 0.3, rotation + time * 0.2, time * 0.1]}>
              <mesh castShadow>
                <torusKnotGeometry args={[scale * 0.8, scale * 0.3, 64, 8]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity}
                  metalness={0.4}
                  roughness={0.6}
                />
              </mesh>
              {index > 0 && Array.from({ length: index * 2 }).map((_, i) => (
                // Leaf-like formations that increase with level
                <mesh
                  key={i}
                  rotation={[
                    Math.sin(time + i) * 0.5,
                    (i * Math.PI * 2) / (index * 2) + time * 0.2,
                    Math.cos(time + i) * 0.5
                  ]}
                  position={[0, scale * 0.5, 0]}
                >
                  <coneGeometry args={[scale * 0.3, scale * 0.8, 3]} />
                  <meshStandardMaterial
                    color="green"
                    emissive="lightgreen"
                    emissiveIntensity={1}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              ))}
            </group>
          );

        case 'water':
          // Smooth, flowing shapes with ripple effects
          return (
            <group position={position} rotation={[time * 0.2, rotation, time * 0.3]}>
              <mesh castShadow>
                <sphereGeometry args={[scale, 32, 32]} />
                <meshPhysicalMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity}
                  metalness={0.9}
                  roughness={0.1}
                  transparent
                  opacity={0.6}
                  transmission={0.5}
                  thickness={1.5}
                />
              </mesh>
              {index > 0 && Array.from({ length: index }).map((_, i) => (
                // Ripple effects that increase with level
                <mesh
                  key={i}
                  scale={1 + (i * 0.15) + Math.sin(time * 2 + i) * 0.1}
                  rotation={[Math.PI / 2, 0, time * (0.1 + i * 0.1)]}
                >
                  <torusGeometry args={[scale * 1.2, scale * 0.05, 16, 32]} />
                  <meshStandardMaterial
                    color="blue"
                    emissive="lightblue"
                    emissiveIntensity={1}
                    transparent
                    opacity={0.3 - (i * 0.05)}
                  />
                </mesh>
              ))}
            </group>
          );

        case 'light':
          // Radiant, geometric shapes with intense glow
          return (
            <group position={position} rotation={[time * 0.5, rotation + time * 0.3, time * 0.2]}>
              <mesh castShadow>
                <dodecahedronGeometry args={[scale]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity * (1 + index * 0.5)}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
              {index > 0 && Array.from({ length: index * 2 }).map((_, i) => (
                // Light rays that increase with level
                <mesh
                  key={i}
                  rotation={[
                    0,
                    (i * Math.PI * 2) / (index * 2),
                    Math.PI / 4 + Math.sin(time * 2 + i) * 0.2
                  ]}
                >
                  <boxGeometry args={[scale * 0.1, scale * (2 + index * 0.5), scale * 0.1]} />
                  <meshStandardMaterial
                    color="white"
                    emissive="yellow"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.3}
                  />
                </mesh>
              ))}
            </group>
          );

        case 'dark':
          // Void-like, abstract shapes with shadow effects
          return (
            <group position={position} rotation={[time * 0.3, rotation - time * 0.2, time * 0.1]}>
              <mesh castShadow>
                <icosahedronGeometry args={[scale * (1 + index * 0.1)]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={orbStyle.emissiveIntensity}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
              {index > 0 && Array.from({ length: index * 3 }).map((_, i) => (
                // Void tendrils that increase with level
                <mesh
                  key={i}
                  position={[
                    Math.sin(time + i) * scale * 0.3,
                    Math.cos(time * 2 + i) * scale * 0.3,
                    Math.sin(time * 1.5 + i) * scale * 0.3
                  ]}
                  rotation={[time + i, time * 0.5 + i, time * 0.3 + i]}
                >
                  <octahedronGeometry args={[scale * 0.2]} />
                  <meshStandardMaterial
                    color="black"
                    emissive="purple"
                    emissiveIntensity={1 + index * 0.5}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              ))}
            </group>
          );

        default:
          return (
            <mesh position={position} rotation={[0, rotation, 0]} castShadow>
              <sphereGeometry args={[scale, 16, 16]} />
              <meshStandardMaterial
                color={stats.color}
                emissive={stats.emissive}
                emissiveIntensity={orbStyle.emissiveIntensity}
                transparent
                opacity={orbStyle.opacity}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          );
      }
    };

    return getElementalEffect();
  };
  
  const orbStyle = getOrbStyle();

  useFrame(() => {
    if (preview || !onDamageEnemy || phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current < attackCooldown) return;

    // Find closest creep in range
    let closestCreep = null;
    let closestDistance = Infinity;

    for (const creep of creeps) {
      if (!creep.position) continue;

      const creepPos = new Vector3(...creep.position);
      const towerPos = towerRef.current ? towerRef.current.position : (position instanceof Vector3 ? position : new Vector3(...position));
      const distance = creepPos.distanceTo(towerPos);

      if (distance <= range && distance < closestDistance) {
        closestCreep = creep;
        closestDistance = distance;
      }
    }

    if (closestCreep) {
      const towerHeight = 1.2 + (level - 1) * 0.2;
      const towerPos = towerRef.current ? towerRef.current.position : (position instanceof Vector3 ? position : new Vector3(...position));
      const startPos = towerPos.clone();
      startPos.y += towerHeight;

      const targetPos = new Vector3(...closestCreep.position);
      targetPos.y += 0.5;

      // Add new projectile
      if (projectilesRef.current.length < MAX_PROJECTILES) {
        setProjectiles(prev => [
          ...prev,
          {
            id: Math.random(),
            startPos,
            targetPos,
            targetCreepId: closestCreep.id
          }
        ]);
      }

      lastAttackTime.current = now;
    }
  });

  // Safely parse tower type
  const baseWidth = 0.8 + (level - 1) * 0.1;
  const baseHeight = 1.2 + (level - 1) * 0.2;

  return (
    <group ref={towerRef} position={position instanceof Vector3 ? position.toArray() : position}>
      {/* Base platform for all towers */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[baseWidth * 0.7, baseWidth * 0.8, 0.2, 8]} />
        <meshStandardMaterial color={stats.color} />
      </mesh>

      {/* Element-specific main structure */}
      {elementType === 'light' && (
        <>
          {/* Crystal spire design */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.2, baseWidth * 0.5, baseHeight, 6]} />
            <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
          </mesh>
          {/* Floating crystals */}
          {[...Array(level)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / level, 0]}>
              <mesh position={[0.4, baseHeight * 0.7 + i * 0.2, 0]} castShadow>
                <octahedronGeometry args={[0.15]} />
                <meshStandardMaterial color={stats.color} emissive={stats.emissive} emissiveIntensity={1} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {elementType === 'fire' && (
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

      {elementType === 'ice' && (
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
          {[...Array(level + 2)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / (level + 2), Math.PI * 0.1]}>
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

      {elementType === 'nature' && (
        <>
          {/* Organic trunk */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.3, baseWidth * 0.4, baseHeight, 6]} />
            <meshStandardMaterial color="#4B3621" />
          </mesh>
          {/* Leaves and vines */}
          {[...Array(level + 1)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / (level + 1), 0]}>
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

      {elementType === 'water' && (
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
          {[...Array(level)].map((_, i) => (
            <group key={i} position={[0, baseHeight * (0.3 + i * 0.25), 0]}>
              <mesh castShadow>
                <torusGeometry args={[0.3, 0.1, 8, 16]} />
                <meshBasicMaterial
                  color={stats.color}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          ))}
        </>
      )}

      {elementType === 'dark' && (
        <>
          {/* Dark obelisk */}
          <mesh position={[0, baseHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[baseWidth * 0.2, baseWidth * 0.4, baseHeight, 4]} />
            <meshStandardMaterial color="#1a1a1a" emissive={stats.emissive} emissiveIntensity={0.7} />
          </mesh>
          {/* Floating dark orbs */}
          {[...Array(level)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / level, 0]}>
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

      {/* Orbiting Indicator Orbs */}
      <group position={[0, baseHeight + 0.5, 0]}>
        {Array.from({ length: actualLevel }).map((_, index) => {
          const angle = (time * 0.8) + (index * (2 * Math.PI / actualLevel));
          const radius = 0.5;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          const y = Math.sin(time * 2 + index * (Math.PI / actualLevel)) * 0.1;
          
          return (
            <ElementShape
              key={`shape-${index}`}
              index={index}
              position={[x, y, z]}
              rotation={angle}
            />
          );
        })}
      </group>

      {/* Projectiles */}
      {projectiles.map(({ id, startPos, targetPos, targetCreepId }) => (
        <Projectile
          key={id}
          startPos={startPos}
          targetPos={targetPos}
          targetId={targetCreepId}
          color={stats.emissive}
          onHit={(targetId) => {
            onDamageEnemy(targetId, damage, stats.special);
            setProjectiles(prev => prev.filter(p => p.id !== id));
          }}
        />
      ))}

      {/* Range indicator (only in preview) */}
      {preview && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, range, 32]} />
          <meshBasicMaterial color={canAfford ? "#4ade80" : "#ef4444"} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
