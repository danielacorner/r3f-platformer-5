import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D } from 'three';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

interface SkillEffect {
  id: string;
  type: string;
  position: Vector3;
  startTime: number;
  duration: number;
  radius: number;
  damage?: number;
  color: string;
  velocity?: Vector3;
  phase?: 'rising' | 'seeking' | 'falling';
  initialVelocity?: Vector3;
  timeOffset?: number;
  spawnDir?: Vector3;
}

let activeEffects: SkillEffect[] = [];

const GRAVITY = new Vector3(0, -9.8 * 3, 0);
const MAX_SEEK_DISTANCE = 50;  // Increased from 15
const MISSILE_COLOR = '#6bb7c8';  // Light blue
const SEEK_FORCE = 60;  // Increased from 35
const MAX_SPEED = 30;  // Increased from 25
const INITIAL_SPEED = 15;
const HORIZONTAL_SEEK_HEIGHT = 2;
const HIT_RADIUS = 2.5;  // Increased hit radius with small explosion effect

export function castShieldBurst(position: Vector3, level: number) {
  const effect = {
    id: Math.random().toString(),
    type: 'shield',
    position: position.clone(),
    startTime: Date.now(),
    duration: 3 + level,
    radius: 5,
    color: '#3b82f6'
  };
  activeEffects.push(effect);
}

export function castLightningStorm(position: Vector3, level: number) {
  const strikeCount = 3 + level;
  const radius = 5 + level;
  const damage = 50 + level * 25;

  for (let i = 0; i < strikeCount; i++) {
    setTimeout(() => {
      const angle = (i / strikeCount) * Math.PI * 2;
      const x = position.x + Math.cos(angle) * (radius / 2);
      const z = position.z + Math.sin(angle) * (radius / 2);

      const effect = {
        id: Math.random().toString(),
        type: 'lightning',
        position: new Vector3(x, position.y, z),
        startTime: Date.now(),
        duration: 0.5,
        radius: 2,
        damage,
        color: '#7c3aed'
      };
      activeEffects.push(effect);
    }, i * 200);
  }
}

export function castInferno(position: Vector3, level: number) {
  const effect = {
    id: Math.random().toString(),
    type: 'inferno',
    position: position.clone(),
    startTime: Date.now(),
    duration: 3 + level,
    radius: 4 + level * 0.5,
    damage: 20 + level * 15,
    color: '#dc2626'
  };
  activeEffects.push(effect);
}

export function castTimeDilation(position: Vector3, level: number) {
  const effect = {
    id: Math.random().toString(),
    type: 'timeDilation',
    position: position.clone(),
    startTime: Date.now(),
    duration: 5 + level,
    radius: 6 + level,
    color: '#0891b2'
  };
  activeEffects.push(effect);
}

export function castMagicMissiles(position: Vector3, level: number) {
  console.log('Casting Magic Missiles at position:', position.toArray());

  const missileCount = Math.floor(3 + level * 2);
  const baseDamage = 30;
  const damagePerLevel = 5;
  const damage = baseDamage + (level * damagePerLevel);
  const missileRadius = 0.2;

  const angleStep = (2 * Math.PI) / missileCount;

  for (let i = 0; i < missileCount; i++) {
    const angle = i * angleStep;
    const horizontalDir = new Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    ).normalize();

    // Create initial velocity with upward and outward components
    const initialVelocity = new Vector3(
      horizontalDir.x * INITIAL_SPEED * 0.7,  // Horizontal component
      INITIAL_SPEED,  // Vertical component
      horizontalDir.z * INITIAL_SPEED * 0.7   // Horizontal component
    );

    const timeOffset = i * 0.1;
    const startPos = position.clone();
    startPos.y += 1;

    const effect = {
      id: Math.random().toString(),
      type: 'magicMissile',
      position: startPos.clone(),
      startTime: Date.now() + timeOffset * 1000,
      duration: 8,
      radius: missileRadius,
      damage,
      color: MISSILE_COLOR,
      velocity: initialVelocity,
      phase: 'rising' as const,
      timeOffset,
      spawnDir: horizontalDir
    };

    console.log('Created missile:', i, 'at position:', effect.position.toArray(), 'with velocity:', effect.velocity.toArray());
    activeEffects.push(effect);
  }

  window.dispatchEvent(new CustomEvent('effectsChanged'));
}

function findNearestCreep(position: Vector3, creeps: any[]): { creep: any, position: Vector3 } | null {
  if (!creeps || creeps.length === 0) return null;

  // First try to find a creep within MAX_SEEK_DISTANCE
  let nearestDistance = Infinity;
  let nearestCreep = null;
  let nearestPos = null;

  for (const creep of creeps) {
    if (!creep || !creep.position) continue;

    const creepPos = new Vector3(...creep.position);
    const distance = creepPos.distanceTo(position);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCreep = creep;
      nearestPos = creepPos;
    }
  }

  // If we found a creep, return it
  if (nearestCreep) {
    console.log('Found target at distance:', nearestDistance);
    return { creep: nearestCreep, position: nearestPos! };
  }

  return null;
}

export function SkillEffects() {
  const { creeps, damageCreep } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const trailsRef = useRef(new Map<string, Vector3[]>());

  // Create reusable geometries and materials
  const trailGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: MISSILE_COLOR,
    transparent: true,
  }), []);
  const trailInstancesRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const tempMatrix = useMemo(() => new Matrix4(), []);

  // Track total number of trail particles
  const [totalTrailParticles, setTotalTrailParticles] = useState(0);

  useEffect(() => {
    const handleEffectsChanged = () => {
      setEffectsCount(prev => prev + 1);
    };
    window.addEventListener('effectsChanged', handleEffectsChanged);
    return () => window.removeEventListener('effectsChanged', handleEffectsChanged);
  }, []);

  useFrame((state, delta) => {
    setFrameCount(prev => (prev + 1) % 1000000);

    const now = Date.now();
    const remainingEffects: SkillEffect[] = [];
    let particleCount = 0;

    // Update trails
    for (const effect of activeEffects) {
      if (effect.type === 'magicMissile') {
        if (!trailsRef.current.has(effect.id)) {
          trailsRef.current.set(effect.id, []);
        }
        const trail = trailsRef.current.get(effect.id)!;

        trail.unshift(effect.position.clone());
        if (trail.length > 20) {
          trail.pop();
        }

        particleCount += trail.length;

        if (now < effect.startTime) {
          remainingEffects.push(effect);
          continue;
        }

        const age = (now - effect.startTime) / 1000;

        if (age > effect.duration) {
          console.log('Effect expired:', effect.id);
          trailsRef.current.delete(effect.id);
          continue;
        }

        if (effect.velocity) {
          const frameVelocity = effect.velocity.clone().multiplyScalar(delta);
          effect.position.add(frameVelocity);

          if (effect.phase === 'rising') {
            // Full gravity during rising phase for parabolic arc
            effect.velocity.add(GRAVITY.clone().multiplyScalar(delta));

            // Transition to seeking when velocity points downward and we're above minimum height
            if (effect.velocity.y < 0 && effect.position.y > HORIZONTAL_SEEK_HEIGHT) {
              effect.phase = 'seeking';

              // Set horizontal velocity in spawn direction but slower
              const spawnDir = (effect as any).spawnDir || new Vector3(1, 0, 0);
              effect.velocity.set(
                spawnDir.x * MAX_SPEED * 0.5, // Reduced initial seeking speed
                0,
                spawnDir.z * MAX_SPEED * 0.5
              );

              console.log('Missile transitioning to seeking phase');
            }
          } else if (effect.phase === 'seeking') {
            const nearestCreepInfo = findNearestCreep(effect.position, creeps);
            if (nearestCreepInfo) {
              const { creep, position: creepPos } = nearestCreepInfo;

              // Target slightly above the creep
              const targetPos = creepPos.clone();
              targetPos.y = Math.max(HORIZONTAL_SEEK_HEIGHT, creepPos.y + 0.5);

              const toTarget = targetPos.clone().sub(effect.position);
              const distanceToTarget = toTarget.length();

              // Stronger seeking force overall and even stronger at close range
              const distanceMultiplier = Math.min(3, 5 / Math.max(1, distanceToTarget));
              const seekForce = toTarget.normalize()
                .multiplyScalar(SEEK_FORCE * distanceMultiplier * delta);

              // Apply seek force
              effect.velocity.add(seekForce);

              // More aggressive height adjustment
              const heightDiff = targetPos.y - effect.position.y;
              effect.velocity.y += heightDiff * 12 * delta;

              // Direct velocity more towards target when close
              const directness = Math.min(1, 3 / Math.max(1, distanceToTarget));
              effect.velocity.lerp(
                toTarget.normalize().multiplyScalar(MAX_SPEED),
                0.2 + directness * 0.4 // More direct steering at close range
              );

              // Ensure minimum speed towards target
              const currentSpeed = effect.velocity.length();
              if (currentSpeed < MAX_SPEED * 0.5) {
                effect.velocity.normalize().multiplyScalar(MAX_SPEED * 0.5);
              }
              // Cap maximum speed
              else if (currentSpeed > MAX_SPEED) {
                effect.velocity.normalize().multiplyScalar(MAX_SPEED);
              }

              // Check for hits with larger radius
              const hitDistance = effect.position.distanceTo(creepPos);
              if (hitDistance <= HIT_RADIUS) {
                // Apply damage with slight falloff based on distance
                const damageMultiplier = 1 - (hitDistance / HIT_RADIUS) * 0.3;
                const finalDamage = Math.floor((effect.damage || 0) * damageMultiplier);

                console.log('Missile hit creep:', effect.id, 'with damage:', finalDamage, 'at distance:', hitDistance.toFixed(2));
                damageCreep(creep.id, finalDamage);

                // Create a small explosion effect in the trail
                const explosionPos = effect.position.clone();
                const trail = trailsRef.current.get(effect.id)!;
                for (let i = 0; i < 3; i++) {
                  trail.unshift(explosionPos.clone().add(new Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                  )));
                }

                trailsRef.current.delete(effect.id);
                continue;
              }
            } else {
              // Keep moving in current direction if no target found
              const horizontalVel = effect.velocity.clone();
              horizontalVel.y = 0;
              if (horizontalVel.length() < 0.1) {
                effect.phase = 'falling';
              }
            }
          } else if (effect.phase === 'falling') {
            effect.velocity.add(GRAVITY.clone().multiplyScalar(delta));
            if (effect.position.y <= 0) {
              trailsRef.current.delete(effect.id);
              continue;
            }
          }

          remainingEffects.push(effect);
        }
      }
    }

    // Update instanced mesh
    if (trailInstancesRef.current && particleCount > 0) {
      let instanceIndex = 0;

      for (const [_, trail] of trailsRef.current.entries()) {
        trail.forEach((pos, index) => {
          const scale = 0.15 * (1 - index / trail.length);
          const opacity = (1 - index / trail.length) * 0.7;

          tempObject.position.copy(pos);
          tempObject.scale.set(scale, scale, scale);
          tempObject.updateMatrix();

          trailInstancesRef.current.setMatrixAt(instanceIndex, tempObject.matrix);
          if (trailInstancesRef.current.instanceColor) {
            trailInstancesRef.current.instanceColor.setXYZ(
              instanceIndex,
              1,
              1,
              1
            );
            trailInstancesRef.current.instanceColor.setW(instanceIndex, opacity);
          }

          instanceIndex++;
        });
      }

      trailInstancesRef.current.instanceMatrix.needsUpdate = true;
      if (trailInstancesRef.current.instanceColor) {
        trailInstancesRef.current.instanceColor.needsUpdate = true;
      }
    }

    setTotalTrailParticles(particleCount);
    activeEffects = remainingEffects;
  });

  return (
    <group>
      {/* Trail particles using instancing */}
      <instancedMesh
        ref={trailInstancesRef}
        args={[trailGeometry, trailMaterial, Math.max(100, totalTrailParticles)]}
      />

      {/* Missiles */}
      {activeEffects.map(effect => {
        if (effect.type === 'magicMissile') {
          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh position={effect.position.toArray()}>
                <sphereGeometry args={[effect.radius, 32, 32]} />
                <meshStandardMaterial
                  color={effect.color}
                  emissive={effect.color}
                  emissiveIntensity={2}
                />
              </mesh>
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}
