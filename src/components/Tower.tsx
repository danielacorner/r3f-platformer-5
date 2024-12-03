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
  const elementType = type.replace(/[0-9]/g, '');

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

  const getOrbStyle = useCallback(() => {
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
  }, [elementType]);

  const ElementShape = useCallback(({ index, position, rotation }: { index: number; position: [number, number, number]; rotation: number }) => {
    const orbStyle = getOrbStyle();
    const scale = 0.12;

    const getElementalEffect = () => {
      switch (elementType) {
        case 'fire':
          return (
            <group position={position} rotation={[time * 0.8, rotation + time, time * 0.5]}>
              {index > 0 && (
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
            </group>
          );
        // ... rest of the element cases
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
  }, [elementType, time, stats, getOrbStyle]);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  useFrame((_, delta) => {
    setTime(t => t + delta);

    // Update projectiles
    setProjectiles(prev => prev.map(projectile => {
      projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));
      projectile.timeAlive += delta;
      return projectile;
    }).filter(projectile => projectile.timeAlive < 1));

    // Attack logic
    if (preview || !onDamageEnemy || phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current < attackCooldown) return;

    // Find closest creep
    let closestCreep = null;
    let closestDistance = range;

    creeps.forEach(creep => {
      if (!creep.position || creep.health <= 0) return;

      const creepPos = new Vector3(...creep.position);
      const towerPos = position instanceof Vector3 ? position : new Vector3(...position);
      const distance = towerPos.distanceTo(creepPos);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCreep = creep;
      }
    });

    if (closestCreep) {
      const towerHeight = 1.2 + (level - 1) * 0.2;
      const towerPos = position instanceof Vector3 ? position : new Vector3(...position);
      towerPos.y += towerHeight;

      const targetPos = new Vector3(...closestCreep.position);
      targetPos.y += 0.5;

      // Add new projectile
      if (projectilesRef.current.length < MAX_PROJECTILES) {
        setProjectiles(prev => [
          ...prev,
          {
            id: Math.random(),
            position: towerPos.clone(),
            velocity: targetPos.clone().sub(towerPos).normalize().multiplyScalar(PROJECTILE_SPEED),
            creepId: closestCreep.id,
            timeAlive: 0
          }
        ]);

        // Call onDamageEnemy with the tower's stats
        onDamageEnemy(closestCreep.id, stats.damage, {
          [elementType]: {
            value: stats.special?.value || 0,
            duration: stats.special?.duration || 3000,
            startTime: now,
            type: stats.special?.type
          }
        });
      }

      lastAttackTime.current = now;
    }
  });

  // Create range indicator geometry
  const rangeIndicator = useMemo(() => {
    const circleGeometry = new THREE.CircleGeometry(range, 64);
    const points = circleGeometry.attributes.position;
    const positions = [];
    
    for (let i = 1; i <= 64; i++) {
      positions.push(points.getX(i), 0, points.getY(i));
    }
    positions.push(points.getX(1), 0, points.getY(1));
    
    const geometry = new Float32Array(positions);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(geometry, 3));
    
    return lineGeometry;
  }, [range]);

  // Safely parse tower type
  const baseWidth = 0.8;
  const baseHeight = 2;
  const scale = {
    1: 0.6,
    2: 0.8,
    3: 1.0,
    4: 1.3,
    5: 1.8
  }[level] || 1.0;

  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  return (
    <group ref={towerRef} position={position instanceof Vector3 ? position.toArray() : position}>
      {/* Range indicator */}
      {preview && (
        <line geometry={rangeIndicator}>
          <lineBasicMaterial
            attach="material"
            color={canAfford ? "#60a5fa" : "#ef4444"}
            transparent
            opacity={0.3}
            linewidth={1}
          />
        </line>
      )}

      {/* Base platform for all towers */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[scaledWidth * 0.7, scaledWidth * 0.8, 0.2, 8]} />
        <meshStandardMaterial color={stats.color} />
      </mesh>

      {/* Projectiles */}
      {projectiles.map((projectile) => (
        <mesh
          key={projectile.id}
          position={projectile.position}
          scale={0.2}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={stats.color}
            emissive={stats.emissive}
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
          <Trail
            width={0.5}
            length={8}
            color={stats.emissive}
            attenuation={(t) => t * t}
          />
        </mesh>
      ))}

      {/* Element-specific main structure */}
      {elementType === 'light' && (
        <>
          {/* Crystal spire design */}
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.2, scaledWidth * 0.5, scaledHeight, 6]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={1}
            />
          </mesh>
          {/* Floating crystals */}
          {[...Array(level)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / level, 0]}>
              <mesh position={[0.4, scaledHeight * 0.7 + i * 0.2, 0]} castShadow>
                <octahedronGeometry args={[0.15]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={1}
                />
              </mesh>
            </group>
          ))}
        </>
      )}

      {elementType === 'fire' && (
        <>
          {/* Volcanic tower design */}
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[scaledWidth * 0.3, scaledWidth * 0.6, scaledHeight, 4]} />
            <meshStandardMaterial
              color="#8B0000"
              emissive={stats.emissive}
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Lava streams */}
          {[...Array(4)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / 4, 0]}>
              <mesh position={[0.2, scaledHeight * 0.6, 0]} castShadow>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial
                  color={stats.emissive}
                  emissive={stats.emissive}
                  emissiveIntensity={1}
                />
              </mesh>
            </group>
          ))}
          {/* Top flame */}
          <mesh position={[0, scaledHeight + 0.2, 0]} castShadow>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshStandardMaterial
              color={stats.emissive}
              emissive={stats.emissive}
              emissiveIntensity={1}
            />
          </mesh>
        </>
      )}

      {elementType === 'ice' && (
        <>
          {/* Crystalline ice structure */}
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[scaledWidth * 0.4, scaledWidth * 0.5, scaledHeight, 6]} />
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
              <mesh position={[0.3, scaledHeight * 0.6, 0]} castShadow>
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
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[scaledWidth * 0.3, scaledWidth * 0.4, scaledHeight, 6]} />
            <meshStandardMaterial color="#4B3621" />
          </mesh>
          {/* Leaves and vines */}
          {[...Array(level + 1)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / (level + 1), 0]}>
              <mesh position={[0.25, scaledHeight * (0.4 + i * 0.2), 0]} castShadow>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={0.3}
                />
              </mesh>
            </group>
          ))}
          {/* Top bloom */}
          <mesh position={[0, scaledHeight + 0.2, 0]} castShadow>
            <dodecahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color={stats.emissive}
              emissive={stats.emissive}
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      )}

      {elementType === 'water' && (
        <>
          {/* Flowing water column */}
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[scaledWidth * 0.3, scaledWidth * 0.4, scaledHeight, 8]} />
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
            <group key={i} position={[0, scaledHeight * (0.3 + i * 0.25), 0]}>
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
          <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[scaledWidth * 0.2, scaledWidth * 0.4, scaledHeight, 4]} />
            <meshStandardMaterial
              color="#1a1a1a"
              emissive={stats.emissive}
              emissiveIntensity={0.7}
            />
          </mesh>
          {/* Floating dark orbs */}
          {[...Array(level)].map((_, i) => (
            <group key={i} rotation={[0, (Math.PI * 2 * i) / level, 0]}>
              <mesh position={[0.3, scaledHeight * (0.3 + i * 0.2), 0]} castShadow>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial
                  color={stats.color}
                  emissive={stats.emissive}
                  emissiveIntensity={1}
                />
              </mesh>
            </group>
          ))}
          {/* Top crystal */}
          <mesh position={[0, scaledHeight + 0.2, 0]} castShadow>
            <octahedronGeometry args={[0.25]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={1}
            />
          </mesh>
        </>
      )}

      {/* Orbiting Indicator Orbs */}
      <group position={[0, scaledHeight + 0.5, 0]}>
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
    </group>
  );
}