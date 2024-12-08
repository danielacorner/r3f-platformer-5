import { Vector3, Color, Euler, Matrix4, Object3D, InstancedMesh, Group } from 'three';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore, isTowerOnPath } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float, Trail } from '@react-three/drei';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ProjectileSystem } from './ProjectileSystem';
import { createShaderMaterial } from '../utils/shaders';
import { ObjectPool } from '../utils/objectPool';
import { TowerSellMenu } from './TowerSellMenu';
import { GridMarker } from './GridMarker';
import { Lightning } from './Lightning';

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
  id: number;
  opacity?: number;
  isPreview?: boolean;
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

export function Tower({ position, type = 'dark1', level = 1, preview = false, onDamageEnemy, canAfford = true, id, opacity = 1, isPreview = false }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const creeps = useGameStore(state => state.creeps);
  const stats = TOWER_STATS[type] ?? TOWER_STATS.dark1;
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2);
  const damage = stats.damage * (1 + (level - 1) * 0.3);
  const elementType = type?.replace(/[0-9]/g, '') || 'dark';

  const lastAttackTime = useRef(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [lightnings, setLightnings] = useState<{ start: Vector3, end: Vector3, id: number }[]>([]);
  const PROJECTILE_SPEED = 15;
  const towerRef = useRef<THREE.Group>(null);

  const isStormTower = elementType === 'storm';

  useFrame((_, delta) => {
    if (preview) return;

    // Update existing projectiles
    if (!isStormTower) {
      setProjectiles(prev => 
        prev
          .map(projectile => ({
            ...projectile,
            position: projectile.position.clone().add(
              projectile.velocity.clone().multiplyScalar(delta)
            ),
            timeAlive: projectile.timeAlive + delta
          }))
          .filter(projectile => projectile.timeAlive < 1)
      );
    }

    // Check if we can fire
    const now = Date.now();
    if (now - lastAttackTime.current < attackCooldown) return;

    // Find target
    const towerPos = new Vector3(...(position instanceof Vector3 ? position.toArray() : position));
    const target = creeps.find(creep => {
      if (!creep.position || creep.health <= 0) return false;
      const dist = new Vector3(...creep.position).distanceTo(towerPos);
      return dist <= range;
    });

    if (target) {
      const firePos = towerPos.clone();
      firePos.y += 0.8;
      const targetPos = new Vector3(...target.position);
      targetPos.y += 0.3;

      if (isStormTower) {
        // Create storm bolt from tower
        setLightnings(prev => [...prev, {
          start: firePos,
          end: targetPos,
          id: Math.random()
        }]);

        if (onDamageEnemy) {
          onDamageEnemy(target.id, damage, {
            [elementType]: {
              value: stats.special?.value || 0,
              duration: stats.special?.duration || 3000,
              startTime: now,
              type: stats.special?.type
            }
          });
        }
      } else {
        // Regular projectile for other towers
        const direction = targetPos.clone().sub(firePos).normalize();
        const adjustedFirePos = firePos.clone().add(new Vector3(0, 1, 0)); // Add height offset
        setProjectiles(prev => [...prev, {
          id: Math.random(),
          position: adjustedFirePos,
          velocity: direction.multiplyScalar(PROJECTILE_SPEED),
          creepId: target.id,
          timeAlive: 0
        }]);

        if (onDamageEnemy) {
          onDamageEnemy(target.id, damage, {
            [elementType]: {
              value: stats.special?.value || 0,
              duration: stats.special?.duration || 3000,
              startTime: now,
              type: stats.special?.type
            }
          });
        }
      }

      lastAttackTime.current = now;
    }
  });

  // Add hover and sell state
  const [isHovered, setIsHovered] = useState(false);
  const [showSellMenu, setShowSellMenu] = useState(false);
  const { addMoney, removePlacedTower, setHighlightedPathSegment } = useGameStore();

  useEffect(() => {
    if (preview) {
      const segment = isTowerOnPath(position as [number, number, number]);
      setHighlightedPathSegment(segment);
    } else {
      setHighlightedPathSegment(null);
    }
  }, [preview, position, setHighlightedPathSegment]);

  const isInvalidPlacement = Boolean(isTowerOnPath(position as [number, number, number]));
  const previewScale = isInvalidPlacement ? 1.2 : 1;
  const previewColor = isInvalidPlacement ? '#ff0000' : (canAfford ? '#ffffff' : '#ff0000');
  const previewOpacity = isInvalidPlacement ? 0.6 : 0.8;

  // Handle tower interactions
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (!preview) {
      document.body.style.cursor = 'pointer';
      setIsHovered(true);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    if (!e.relatedTarget?.closest('.tower-sell-menu')) {
      document.body.style.cursor = 'auto';
      setIsHovered(false);
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!preview) {
      setShowSellMenu(true);
    }
  };

  const handleSell = () => {
    const sellValue = Math.floor(stats.cost * 0.7);
    addMoney(sellValue);
    removePlacedTower(id);
    setShowSellMenu(false);
  };

  const handleClose = () => {
    setShowSellMenu(false);
  };

  // Extract actual level from tower type (e.g., "fire5" -> 5)
  const actualLevel = parseInt(type.slice(-1)) || 1;
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
    <group 
      ref={towerRef} 
      position={position instanceof Vector3 ? position.toArray() : position}
    >
      {/* Invisible click area */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        position={[0, scaledHeight / 2, 0]}
      >
        <cylinderGeometry args={[scaledWidth * 1.35, scaledWidth * 1.35, scaledHeight, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Grid marker (only shown during preview) */}
      {preview && (
        <GridMarker
          position={[0, 0.01, 0]}
          size={1.2}
          color={canAfford ? '#ffffff' : '#ff0000'}
          opacity={0.3}
        />
      )}

      {/* Base platform for all towers */}
      <group scale={preview ? previewScale : 1}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[scaledWidth * 0.7, scaledWidth * 0.8, 0.2, 8]} />
          <meshStandardMaterial 
            color={preview ? previewColor : stats.color} 
            emissive={preview ? previewColor : stats.emissive}
            emissiveIntensity={preview ? 0.5 : 0.2}
            transparent={preview}
            opacity={preview ? previewOpacity : 1}
          />
        </mesh>

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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
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
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
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
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
              />
            </mesh>
            {/* Ice shards */}
            {[...Array(level + 2)].map((_, i) => (
              <group key={i} rotation={[0, (Math.PI * 2 * i) / (level + 2), Math.PI * 0.1]}>
                <mesh position={[0.3, scaledHeight * 0.6, 0]} castShadow>
                  <coneGeometry args={[0.1, 0.4, 4]} />
                  <meshStandardMaterial
                    color={stats.color}
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
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
              <meshStandardMaterial
                color="#4B3621"
                transparent={preview}
                opacity={preview ? 0.5 : 1}
              />
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
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
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
                transparent={true}
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
                    transparent={true}
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
                transparent={preview}
                opacity={preview ? 0.5 : 1}
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
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
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
                transparent={preview}
                opacity={preview ? 0.1 : 1}
              />
            </mesh>
          </>
        )}

        {elementType === 'storm' && (
          <>
            {/* Lightning rod structure */}
            <mesh position={[0, scaledHeight / 2 + 0.2, 0]} castShadow>
              <cylinderGeometry args={[scaledWidth * 0.3, scaledWidth * 0.4, scaledHeight, 6]} />
              <meshStandardMaterial
                color={stats.color}
                emissive={stats.emissive}
                emissiveIntensity={1.5}
                transparent={preview}
                opacity={preview ? 0.5 : 1}
              />
            </mesh>
            {/* Energy orbs */}
            {[...Array(level + 2)].map((_, i) => (
              <group key={i} rotation={[0, (Math.PI * 2 * i) / (level + 2), Math.PI * 0.1]}>
                <mesh position={[0.3, scaledHeight * 0.6, 0]} castShadow>
                  <sphereGeometry args={[0.15]} />
                  <meshStandardMaterial
                    color={stats.emissive}
                    emissive={stats.emissive}
                    emissiveIntensity={2}
                    transparent={preview}
                    opacity={preview ? 0.5 : 1}
                  />
                </mesh>
              </group>
            ))}
            {/* Lightning crown */}
            <mesh position={[0, scaledHeight + 0.2, 0]} castShadow>
              <octahedronGeometry args={[0.3]} />
              <meshStandardMaterial
                color={stats.emissive}
                emissive={stats.emissive}
                emissiveIntensity={2}
                transparent={preview}
                opacity={preview ? 0.5 : 1}
              />
            </mesh>
          </>
        )}

        {/* Range indicator */}
        {(preview || phase === 'prep') && (
          <group>
            {/* Base ring */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[range-0.1, range, 32]} />
              <meshBasicMaterial 
                color={preview ? (canAfford ? "#44ff88" : "#ff4444") : "#ffffff"} 
                transparent 
                opacity={preview ? 0.3 : 0.1} 
              />
            </mesh>
            
            {/* Outer glow for preview */}
            {preview && (
              <>
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[range - 0.1, range, 32]} />
                  <meshBasicMaterial 
                    color={canAfford ? "#44ff88" : "#ff4444"}
                    transparent 
                    opacity={0.4} 
                  />
                </mesh>
                <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[range - 0.2, range + 0.2, 32]} />
                  <meshBasicMaterial 
                    color={canAfford ? "#ffffff" : "#ff6666"}
                    transparent 
                    opacity={0.2} 
                  />
                </mesh>
              </>
            )}
          </group>
        )}

        {/* Regular projectiles for non-storm towers */}
        {!isStormTower && projectiles.map(projectile => (
          <group key={projectile.id}>
            <mesh
              position={projectile.position}
              scale={elementType.startsWith('fire') ? 0.2 : 0.15}
            >
              {elementType.startsWith('fire') ? (
                <sphereGeometry args={[1, 8, 8]} />
              ) : (
                <sphereGeometry />
              )}
              <meshStandardMaterial 
                color={stats.emissive} 
                emissive={stats.emissive}
                emissiveIntensity={elementType.startsWith('fire') ? 4 : 2}
                toneMapped={false}
              />
            </mesh>
            <Trail
              width={elementType.startsWith('fire') ? 0.2 : 0.08}
              length={elementType.startsWith('fire') ? 12 : 6}
              decay={elementType.startsWith('fire') ? 0.6 : 1}
              local={false}
              stride={0}
              interval={1}
              attenuation={(t) => t * t}
              color={stats.emissive}
            >
              <meshBasicMaterial 
                color={stats.emissive} 
                toneMapped={false}
                transparent
                opacity={0.8}
              />
            </Trail>
          </group>
        ))}

        {/* Storm bolts */}
        {isStormTower && lightnings.map(bolt => (
          <Lightning
            key={bolt.id}
            startPosition={bolt.start}
            endPosition={bolt.end}
            onComplete={() => {
              setLightnings(prev => prev.filter(b => b.id !== bolt.id));
            }}
          />
        ))}
        
        {/* Sell menu */}
        {showSellMenu && !preview && (
          <TowerSellMenu
            onSell={handleSell}
            onClose={handleClose}
            sellValue={Math.floor(stats.cost * 0.7)}
          />
        )}
      </group>
    </group>
  );
}