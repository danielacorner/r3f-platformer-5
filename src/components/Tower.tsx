import { Vector3, Color, Euler, Matrix4, Object3D } from 'three';
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
  const towerMeshRef = useRef<THREE.InstancedMesh>();
  const projectileMeshRef = useRef<THREE.InstancedMesh>();
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

  const projectilesRef = useRef<Projectile[]>([]);
  const towerRef = useRef<THREE.Group>(null);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  useFrame((_, delta) => {
    setTime(t => t + delta);
  });

  // Create array of orbs based on level
  const createOrbs = (level: number) => {
    const orbs = [];
    // Create level * level orbs
    const totalOrbs = level * level;
    const orbsPerRing = Math.ceil(Math.sqrt(totalOrbs));
    const numRings = Math.ceil(totalOrbs / orbsPerRing);

    for (let ring = 0; ring < numRings; ring++) {
      const ringRadius = 0.4 + ring * 0.2; // Larger spacing between rings
      const orbsInThisRing = Math.min(orbsPerRing, totalOrbs - ring * orbsPerRing);
      
      for (let i = 0; i < orbsInThisRing; i++) {
        orbs.push({
          id: orbs.length, // Unique ID for each orb
          ring,
          angle: (2 * Math.PI * i) / orbsInThisRing,
          radius: ringRadius
        });
      }
    }
    console.log(`Created ${orbs.length} orbs for level ${level}`); // Debug log
    return orbs;
  };

  // Get orb style based on element type
  const getOrbStyle = () => {
    const baseStyle = {
      size: 0.08, // Much larger orbs
      emissiveIntensity: 3, // More glow
      opacity: 0.9
    };

    switch (type) {
      case 'light1': case 'light2': case 'light3': case 'light4': case 'light5':
        return { ...baseStyle, emissiveIntensity: 4, opacity: 0.95 };
      case 'fire1': case 'fire2': case 'fire3': case 'fire4': case 'fire5':
        return { ...baseStyle, emissiveIntensity: 5 };
      case 'ice1': case 'ice2': case 'ice3': case 'ice4': case 'ice5':
        return { ...baseStyle, opacity: 0.7, emissiveIntensity: 2.5 };
      case 'nature1': case 'nature2': case 'nature3': case 'nature4': case 'nature5':
        return { ...baseStyle, emissiveIntensity: 2.8 };
      case 'water1': case 'water2': case 'water3': case 'water4': case 'water5':
        return { ...baseStyle, opacity: 0.8, emissiveIntensity: 2.2 };
      default:
        return { ...baseStyle, emissiveIntensity: 3.5 };
    }
  };

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
  const [element, tierNum] = useMemo(() => {
    const match = type?.match(/([a-z]+)(\d+)/);
    if (!match) return ['dark', 1]; // Default values
    const [, el, tier] = match;
    return [el, parseInt(tier)];
  }, [type]);

  const baseWidth = 0.8 + (tierNum - 1) * 0.1;
  const baseHeight = 1.2 + (tierNum - 1) * 0.2;

  return (
    <group ref={towerRef} position={position instanceof Vector3 ? position.toArray() : position}>
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

      {/* Orbiting Indicator Orbs */}
      <group position={[0, baseHeight + 0.3, 0]}>
        {createOrbs(level).map((orb, index) => {
          const orbStyle = getOrbStyle();
          const speed = 1 - (orb.ring * 0.15); // Outer rings move slower
          const angle = orb.angle + time * speed;
          const verticalOffset = Math.sin(time * 2 + orb.angle) * 0.1;
          
          return (
            <mesh 
              key={orb.id}
              position={[
                orb.radius * Math.cos(angle),
                verticalOffset + (orb.ring * 0.1),
                orb.radius * Math.sin(angle)
              ]} 
              castShadow
            >
              <sphereGeometry args={[orbStyle.size, 12, 12]} />
              <meshStandardMaterial
                color={stats.color}
                emissive={stats.emissive}
                emissiveIntensity={orbStyle.emissiveIntensity}
                transparent
                opacity={orbStyle.opacity}
                metalness={0.8}
                roughness={0.1}
              />
            </mesh>
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
