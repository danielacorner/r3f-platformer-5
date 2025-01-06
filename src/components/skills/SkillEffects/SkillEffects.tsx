import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D } from 'three';
import { useGameStore } from '../../../store/gameStore';
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
  phase?: 'rising' | 'seeking' | 'falling' | 'outward' | 'return';
  initialVelocity?: Vector3;
  timeOffset?: number;
  spawnDir?: Vector3;
  spawnPos?: Vector3;
  curve?: number;
  age?: number;
  level?: number;
  hasHitEnemy?: boolean;
  expansionSpeed?: number;
}

export let activeEffects: SkillEffect[] = [];

export const MISSILE_COLOR = '#6bb7c8';  // Light blue
const GRAVITY = new Vector3(0, -9.8 * 3, 0);
const MAX_SEEK_DISTANCE = 50;  // Increased from 15
const BOOMERANG_COLOR = '#8B4513';  // Saddle brown for wooden look
const BOOMERANG_HIGHLIGHT = '#DEB887';  // Burlywood for wood grain
const BOOMERANG_GLOW = '#87CEFA';  // Light blue for magic effect
const BOOMERANG_LENGTH = 0.4;  // Reduced to 1/4 of previous size
const BOOMERANG_WIDTH = 0.1;  // Reduced to 1/4 of previous size
const BOOMERANG_THICKNESS = 0.05;  // Reduced to 1/4 of previous size
const BOOMERANG_SPIN_SPEED = 15;     // Slightly slower for more magical feel
const BOOMERANG_CURVE = 15; // Reduced for smoother arc
const BOOMERANG_RETURN_RADIUS = 2.5; // Increased catch radius
const BOOMERANG_RETURN_SPEED = 30; // Faster return speed
const BOOMERANG_MAX_DURATION = 8; // Maximum duration before forced removal
const BOOMERANG_SEEK_STRENGTH = 8; // How strongly it seeks enemies
const BOOMERANG_MAX_DISTANCE = 20; // Maximum distance from player
const SEEK_FORCE = 60;  // Increased from 35
const MAX_SPEED = 30;  // Increased from 25
const HORIZONTAL_SEEK_HEIGHT = 2;
const HIT_RADIUS = 2.5;  // Increased hit radius with small explosion effect
const BOOMERANG_SCALE = 2
const BOOMERANG_MIN_HEIGHT = 1.0; // Minimum height above ground
const NOVA_CONFIG = {
  geometry: new THREE.RingGeometry(0.9, 1, 24),
  material: new THREE.MeshBasicMaterial({
    color: '#8A2BE2',
    transparent: true,
    side: THREE.DoubleSide
  })
};
const LIGHTNING_CONFIG = {
  geometry: new THREE.CylinderGeometry(0.1, 0.3, 15, 8),
  material: new THREE.MeshBasicMaterial({
    color: '#7c3aed',
    transparent: true,
    side: THREE.DoubleSide
  })
};
const INFERNO_CONFIG = {
  particleCount: 50,
  geometry: new THREE.SphereGeometry(0.2, 8, 8),
  material: new THREE.MeshBasicMaterial({
    color: '#dc2626',
    transparent: true,
    side: THREE.DoubleSide
  })
};
const TIME_DILATION_CONFIG = {
  geometry: new THREE.TorusGeometry(1, 0.1, 16, 32),
  material: new THREE.MeshBasicMaterial({
    color: '#0891b2',
    transparent: true,
    side: THREE.DoubleSide
  })
};

export function findNearestCreep(position: Vector3, creeps: any[]): { creep: any, position: Vector3 } | null {
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
  const { creeps, damageCreep, setTimeDilation } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const trailsRef = useRef(new Map<string, Vector3[]>());
  const timeDilationRef = useRef<{
    lastUpdate: number;
    activeEffects: Set<string>;
  }>({ lastUpdate: 0, activeEffects: new Set() });

  // Create reusable geometries and materials
  const trailGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: MISSILE_COLOR,
    transparent: true,
  }), []);
  const trailInstancesRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const tempMatrix = useMemo(() => new Matrix4(), []);
  const novaGeometry = useMemo(() => NOVA_CONFIG.geometry, []);
  const novaMaterial = useMemo(() => NOVA_CONFIG.material, []);

  // Track total number of trail particles
  const [totalTrailParticles, setTotalTrailParticles] = useState(0);

  useEffect(() => {
    const handleEffectsChanged = () => {
      setEffectsCount(prev => prev + 1);
    };
    window.addEventListener('effectsChanged', handleEffectsChanged);
    return () => window.removeEventListener('effectsChanged', handleEffectsChanged);
  }, []);

  useEffect(() => {
    const checkTimeDilation = () => {
      const now = Date.now();
      const hasActiveEffects = timeDilationRef.current.activeEffects.size > 0;
      const isRecent = now - timeDilationRef.current.lastUpdate < 100; // 100ms threshold

      if (hasActiveEffects && isRecent) {
        setTimeDilation(0.3); // Apply slowdown
      } else {
        setTimeDilation(1); // Reset to normal speed
      }
    };

    const interval = setInterval(checkTimeDilation, 100);
    return () => clearInterval(interval);
  }, [setTimeDilation]);

  useFrame((state, delta) => {
    setFrameCount(prev => (prev + 1) % 1000000);

    const now = Date.now();
    const remainingEffects: SkillEffect[] = [];
    let particleCount = 0;

    // Update trails
    for (const effect of activeEffects) {
      if (effect.type === 'magicMissile') {
        // Get or create trail
        if (!trailsRef.current.has(effect.id)) {
          trailsRef.current.set(effect.id, []);
        }
        const trail = trailsRef.current.get(effect.id)!;

        // Update trail
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
          // Clean up trail when effect expires
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
                spawnDir.x * MAX_SPEED * 0.5,
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

                // Clear existing trail and add explosion particles
                trail.length = 0;
                for (let i = 0; i < 3; i++) {
                  trail.push(explosionPos.clone().add(new Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                  )));
                }

                // Remove trail and effect after a short delay to show explosion
                setTimeout(() => {
                  trailsRef.current.delete(effect.id);
                  activeEffects = activeEffects.filter(e => e.id !== effect.id);
                }, 100);

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
      } else if (effect.type === 'magicBoomerang') {
        // Update trail
        if (!trailsRef.current.has(effect.id)) {
          trailsRef.current.set(effect.id, []);
        }
        const trail = trailsRef.current.get(effect.id)!;

        trail.unshift(effect.position.clone());
        if (trail.length > 15) {
          trail.pop();
        }

        effect.age += delta;

        // Remove if max duration exceeded
        if (effect.age > BOOMERANG_MAX_DURATION) {
          trailsRef.current.delete(effect.id);
          activeEffects = activeEffects.filter(e => e.id !== effect.id);
          continue;
        }

        if (effect.velocity) {
          const frameVelocity = effect.velocity.clone().multiplyScalar(delta);
          effect.position.add(frameVelocity);

          // Clamp height to minimum
          if (effect.position.y < BOOMERANG_MIN_HEIGHT) {
            effect.position.y = BOOMERANG_MIN_HEIGHT;
            // Reflect any downward velocity
            if (effect.velocity.y < 0) {
              effect.velocity.y = Math.abs(effect.velocity.y) * 0.5;
            }
          }

          if (effect.phase === 'outward') {
            // Calculate distance from spawn
            const distanceFromSpawn = effect.position.distanceTo(effect.spawnPos);

            if (distanceFromSpawn >= BOOMERANG_MAX_DISTANCE) {
              effect.phase = 'return';
            } else {
              // Only seek if we haven't hit any enemies yet
              if (!effect.hasHitEnemy) {
                // Find nearest enemy
                const creeps = useGameStore.getState().creeps;
                let nearestCreep = null;
                let nearestDist = Infinity;

                for (const creep of creeps) {
                  if (!creep || !creep.position) continue;
                  const creepPos = new Vector3(...creep.position);
                  const dist = effect.position.distanceTo(creepPos);
                  if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestCreep = creep;
                  }
                }

                // Add curved path and enemy seeking
                const forward = effect.velocity.clone().normalize();
                const right = new Vector3(forward.z, 0, -forward.x).normalize();

                // Base curve
                effect.velocity.add(right.multiplyScalar(BOOMERANG_CURVE * effect.curve * delta));

                // Add enemy seeking if we have a target
                if (nearestCreep) {
                  const toEnemy = new Vector3(...nearestCreep.position).sub(effect.position).normalize();
                  effect.velocity.lerp(toEnemy.multiplyScalar(BOOMERANG_SPEED), delta * BOOMERANG_SEEK_STRENGTH);
                }
              } else {
                // Just continue on curved path without seeking
                const forward = effect.velocity.clone().normalize();
                const right = new Vector3(forward.z, 0, -forward.x).normalize();
                effect.velocity.add(right.multiplyScalar(BOOMERANG_CURVE * effect.curve * delta));
              }
            }
          } else if (effect.phase === 'return') {
            // Get current player position for tracking
            const playerRef = useGameStore.getState().playerRef;
            if (playerRef) {
              const playerPos = playerRef.translation();
              const returnTarget = new Vector3(playerPos.x, playerPos.y + 1, playerPos.z);

              // Calculate path to player
              const toPlayer = returnTarget.clone().sub(effect.position);
              const distanceToPlayer = toPlayer.length();

              // Only remove if very close to player
              if (distanceToPlayer < BOOMERANG_RETURN_RADIUS) {
                trailsRef.current.delete(effect.id);
                activeEffects = activeEffects.filter(e => e.id !== effect.id);
                continue;
              }

              // Stronger return force when close
              const returnStrength = Math.min(1, BOOMERANG_RETURN_RADIUS / Math.max(1, distanceToPlayer));
              const toPlayerDir = toPlayer.normalize();
              const right = new Vector3(toPlayerDir.z, 0, -toPlayerDir.x).normalize();
              const returnForce = toPlayerDir.multiplyScalar(BOOMERANG_RETURN_SPEED * (1 + returnStrength))
                .add(right.multiplyScalar(BOOMERANG_CURVE * effect.curve * 0.3));

              // More aggressive lerping when close
              effect.velocity.lerp(returnForce, 0.2 + returnStrength * 0.4);

              // Maintain speed based on phase
              const currentSpeed = effect.velocity.length();
              effect.velocity.normalize().multiplyScalar(BOOMERANG_RETURN_SPEED);
            }
          }

          // Check for enemy hits
          for (const creep of creeps) {
            if (!creep || !creep.position) continue;

            const creepPos = new Vector3(...creep.position);
            const hitDistance = effect.position.distanceTo(creepPos);

            if (hitDistance <= HIT_RADIUS) {
              const damageMultiplier = 1 - (hitDistance / HIT_RADIUS) * 0.3;
              const finalDamage = Math.floor((effect.damage || 0) * damageMultiplier);

              damageCreep(creep.id, finalDamage);

              // Mark that we've hit an enemy to stop seeking behavior
              effect.hasHitEnemy = true;

              // Don't change phase, let it continue on its path
              // Only start returning if we've gone too far from spawn
              const distanceFromSpawn = effect.position.distanceTo(effect.spawnPos);
              if (distanceFromSpawn >= BOOMERANG_MAX_DISTANCE) {
                effect.phase = 'return';
              }

              // Add hit effect to the trail
              const trail = trailsRef.current.get(effect.id)!;
              const hitPos = effect.position.clone();
              for (let i = 0; i < 2; i++) {
                trail.push(hitPos.clone().add(new Vector3(
                  (Math.random() - 0.5) * 0.3,
                  (Math.random() - 0.5) * 0.3,
                  (Math.random() - 0.5) * 0.3
                )));
              }
              // Trim trail to prevent it from growing too long
              while (trail.length > 15) {
                trail.pop();
              }
            }
          }

          remainingEffects.push(effect);
        }
      } else if (effect.type === 'arcaneNova') {
        const age = (now - effect.startTime) / 1000;
        const progress = Math.min(age / effect.duration, 1);
        const currentRadius = effect.radius + (effect.expansionSpeed * age);
        const opacity = 1 - progress;

        // Check for enemy hits
        for (const creep of creeps) {
          if (!creep || !creep.position) continue;
          const creepPos = new Vector3(...creep.position);
          const distanceToCreep = creepPos.distanceTo(effect.position);
          const hitRange = 0.5; // Width of the damage ring

          if (Math.abs(distanceToCreep - currentRadius) < hitRange) {
            damageCreep(creep.id, effect.damage);
          }
        }

        remainingEffects.push(effect);
      } else if (effect.type === 'lightning') {
        const age = (now - effect.startTime) / 1000;
        const progress = Math.min(age / effect.duration, 1);
        const opacity = Math.max(0, 1 - progress * 2); // Faster fade out
        const scale = progress < 0.1 ? progress * 10 : 1; // Quick scale up

        // Check for enemy hits if the lightning just appeared
        if (progress < 0.1) {
          for (const creep of creeps) {
            if (!creep || !creep.position) continue;
            const creepPos = new Vector3(...creep.position);
            const distanceToCreep = creepPos.distanceTo(effect.position);
            if (distanceToCreep < effect.radius) {
              damageCreep(creep.id, effect.damage);
            }
          }
        }

        remainingEffects.push(effect);
      } else if (effect.type === 'inferno') {
        const age = (now - effect.startTime) / 1000;
        const progress = Math.min(age / effect.duration, 1);
        const opacity = Math.min(1, Math.max(0, 1.5 - progress * 1.5));

        // Check for enemy hits every frame
        for (const creep of creeps) {
          if (!creep || !creep.position) continue;
          const creepPos = new Vector3(...creep.position);
          const distanceToCreep = creepPos.distanceTo(effect.position);
          if (distanceToCreep < effect.radius) {
            damageCreep(creep.id, effect.damage / 20); // Damage per frame (DPS = damage)
          }
        }

        remainingEffects.push(effect);
      } else if (effect.type === 'timeDilation') {
        const age = (now - effect.startTime) / 1000;
        const progress = Math.min(age / effect.duration, 1);
        const opacity = Math.min(1, Math.max(0, 1.5 - progress * 1.5));
        const dilationFactor = 0.3 + (effect.level * 0.1); // 30% - 80% slowdown based on level

        // Track time dilation effect
        if (!timeDilationRef.current.activeEffects.has(effect.id)) {
          timeDilationRef.current.activeEffects.add(effect.id);
        }

        // Check if any enemies are in range
        let enemiesInRange = false;
        for (const creep of creeps) {
          if (!creep || !creep.position) continue;
          const creepPos = new Vector3(...creep.position);
          const distanceToCreep = creepPos.distanceTo(effect.position);
          if (distanceToCreep < effect.radius) {
            enemiesInRange = true;
            break;
          }
        }

        // Store the effect state for useEffect to handle
        if (enemiesInRange) {
          timeDilationRef.current.lastUpdate = Date.now();
        }

        // Remove expired effects
        if (progress >= 1) {
          timeDilationRef.current.activeEffects.delete(effect.id);
        }

        // Visual effect
        return (
          <group key={`${effect.id}-${frameCount}`}>
            {/* Outer ring */}
            <mesh
              position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[effect.radius, effect.radius, 1]}
            >
              <primitive object={TIME_DILATION_CONFIG.geometry} />
              <primitive object={TIME_DILATION_CONFIG.material} transparent opacity={opacity * 0.7} />
            </mesh>
            {/* Inner rings */}
            {Array.from({ length: 3 }).map((_, i) => {
              const ringProgress = (age * (1 - i * 0.2)) % 1;
              const ringScale = effect.radius * ringProgress;
              return (
                <mesh
                  key={i}
                  position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={[ringScale, ringScale, 1]}
                >
                  <ringGeometry args={[0.9, 1, 32]} />
                  <meshBasicMaterial
                    color={effect.color}
                    transparent
                    opacity={opacity * (1 - ringProgress)}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              );
            })}
            {/* Area light */}
            <pointLight
              position={[effect.position.x, effect.position.y + 2, effect.position.z]}
              color={effect.color}
              intensity={3 * opacity}
              distance={effect.radius * 2}
              decay={2}
            />
          </group>
        );
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
        const currentTime = Date.now();

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
        } else if (effect.type === 'magicBoomerang') {
          // Horizontal spin with slight tilt for more dynamic look
          const wobble = Math.sin(effect.age * 5) * 0.05;
          const rotation = [0, effect.age * BOOMERANG_SPIN_SPEED, wobble];

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <group scale={BOOMERANG_SCALE}
                position={effect.position.toArray()}
                rotation={rotation}
              >
                {/* Main L-shaped body */}
                <group rotation={[Math.PI / 2, 0, 0]}>  {/* Rotate to horizontal orientation */}
                  {/* Vertical arm */}
                  <mesh>
                    <boxGeometry args={[BOOMERANG_WIDTH, BOOMERANG_LENGTH, BOOMERANG_THICKNESS]} />
                    <meshStandardMaterial
                      color={BOOMERANG_COLOR}
                      metalness={0.1}
                      roughness={0.7}
                    />
                  </mesh>

                  {/* Horizontal arm */}
                  <mesh position={[BOOMERANG_LENGTH / 2 - BOOMERANG_WIDTH / 2, BOOMERANG_LENGTH / 2 - BOOMERANG_WIDTH / 2, 0]}>
                    <boxGeometry args={[BOOMERANG_LENGTH, BOOMERANG_WIDTH, BOOMERANG_THICKNESS]} />
                    <meshStandardMaterial
                      color={BOOMERANG_COLOR}
                      metalness={0.1}
                      roughness={0.7}
                    />
                  </mesh>

                  {/* Wood grain highlights */}
                  <mesh position={[0, 0, BOOMERANG_THICKNESS / 2 + 0.001]}>
                    <boxGeometry args={[BOOMERANG_WIDTH * 0.8, BOOMERANG_LENGTH * 0.9, 0.001]} />
                    <meshBasicMaterial
                      color={BOOMERANG_HIGHLIGHT}
                      transparent
                      opacity={0.3}
                    />
                  </mesh>
                </group>

                {/* Magic effect */}
                <pointLight
                  color={BOOMERANG_GLOW}
                  intensity={1}
                  distance={2}
                />
              </group>
            </group>
          );
        } else if (effect.type === 'arcaneNova') {
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const currentRadius = effect.radius + (effect.expansionSpeed * age);
          const opacity = 1 - progress;

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[currentRadius, currentRadius, 1]}
              >
                <primitive object={novaGeometry} />
                <primitive object={novaMaterial} transparent opacity={opacity} />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 0.5, effect.position.z]}
                color={effect.color}
                intensity={2 * (1 - progress)}
                distance={currentRadius * 2}
                decay={3}
              />
            </group>
          );
        } else if (effect.type === 'lightning') {
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - progress * 2); // Faster fade out
          const scale = progress < 0.1 ? progress * 10 : 1; // Quick scale up

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 7.5, effect.position.z]}
                scale={[scale, 1, scale]}
              >
                <primitive object={LIGHTNING_CONFIG.geometry} />
                <primitive object={LIGHTNING_CONFIG.material} transparent opacity={opacity} />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 1, effect.position.z]}
                color={effect.color}
                intensity={10 * (1 - progress)}
                distance={5}
                decay={2}
              />
              {/* Ground impact effect */}
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[effect.radius * scale * 2, effect.radius * scale * 2, 1]}
              >
                <ringGeometry args={[0.3, 1, 12]} />
                <meshBasicMaterial color={effect.color} transparent opacity={opacity} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        } else if (effect.type === 'inferno') {
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.min(1, Math.max(0, 1.5 - progress * 1.5));

          // Generate multiple flame particles
          return (
            <group key={`${effect.id}-${frameCount}`}>
              {Array.from({ length: INFERNO_CONFIG.particleCount }).map((_, i) => {
                const angle = (i / INFERNO_CONFIG.particleCount) * Math.PI * 2;
                const radius = effect.radius * (0.2 + Math.sin(age * 2 + i) * 0.8);
                const height = 2 + Math.sin(age * 3 + i * 0.5) * 1.5;
                const x = effect.position.x + Math.cos(angle) * radius;
                const z = effect.position.z + Math.sin(angle) * radius;
                const particleScale = 0.5 + Math.sin(age * 4 + i) * 0.5;

                return (
                  <mesh
                    key={i}
                    position={[x, effect.position.y + height, z]}
                    scale={[particleScale, particleScale, particleScale]}
                  >
                    <primitive object={INFERNO_CONFIG.geometry} />
                    <primitive object={INFERNO_CONFIG.material} transparent opacity={opacity * 0.7} />
                  </mesh>
                );
              })}
              {/* Central fire column */}
              <mesh
                position={[effect.position.x, effect.position.y + 3, effect.position.z]}
                scale={[effect.radius * 0.5, 6, effect.radius * 0.5]}
              >
                <cylinderGeometry args={[1, 0.5, 1, 8]} />
                <meshBasicMaterial color="#dc2626" transparent opacity={opacity * 0.3} />
              </mesh>
              {/* Ground fire ring */}
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[effect.radius, effect.radius, 1]}
              >
                <ringGeometry args={[0.5, 1, 16]} />
                <meshBasicMaterial color="#dc2626" transparent opacity={opacity * 0.5} side={THREE.DoubleSide} />
              </mesh>
              {/* Fire light */}
              <pointLight
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                color="#ff4444"
                intensity={8 * opacity}
                distance={effect.radius * 3}
                decay={2}
              />
            </group>
          );
        } else if (effect.type === 'timeDilation') {
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.min(1, Math.max(0, 1.5 - progress * 1.5));
          const dilationFactor = 0.3 + (effect.level * 0.1); // 30% - 80% slowdown based on level

          // Visual effect
          return (
            <group key={`${effect.id}-${frameCount}`}>
              {/* Outer ring */}
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[effect.radius, effect.radius, 1]}
              >
                <primitive object={TIME_DILATION_CONFIG.geometry} />
                <primitive object={TIME_DILATION_CONFIG.material} transparent opacity={opacity * 0.7} />
              </mesh>
              {/* Inner rings */}
              {Array.from({ length: 3 }).map((_, i) => {
                const ringProgress = (age * (1 - i * 0.2)) % 1;
                const ringScale = effect.radius * ringProgress;
                return (
                  <mesh
                    key={i}
                    position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={[ringScale, ringScale, 1]}
                  >
                    <ringGeometry args={[0.9, 1, 32]} />
                    <meshBasicMaterial
                      color={effect.color}
                      transparent
                      opacity={opacity * (1 - ringProgress)}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                );
              })}
              {/* Area light */}
              <pointLight
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                color={effect.color}
                intensity={3 * opacity}
                distance={effect.radius * 2}
                decay={2}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}

