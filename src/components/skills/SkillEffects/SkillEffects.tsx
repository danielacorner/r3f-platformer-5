import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D } from 'three';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ArcaneNovaShaderMaterial } from './shaders/ArcaneNovaShader';
import { updateMagicMissile } from './effectHandlers/magicMissileHandler';
import { updateArcaneNova } from './effectHandlers/arcaneNovaHandler';
import { updateLightning } from './effectHandlers/lightningHandler';
import { updateBoomerang } from './effectHandlers/boomerangHandler';
import { SkillEffect } from './types';

extend({ ArcaneNovaShaderMaterial });

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
  const { creeps, damageCreep } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Trail particle setup
  const trailGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), []);
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#9F7AEA',
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  const trailInstancesRef = useRef<InstancedMesh>();
  const trailsRef = useRef<Map<string, Vector3[]>>(new Map());
  const [totalTrailParticles, setTotalTrailParticles] = useState(100);
  const matrix = useMemo(() => new Matrix4(), []);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    const handleEffectsChanged = () => {
      setEffectsCount(activeEffects.length);
    };

    // Cleanup function
    return () => {
      activeEffects = [];
    };
  }, []);

  useFrame((state, delta) => {
    setFrameCount(prev => (prev + 1) % 1000000);

    const now = Date.now();
    const { creeps, damageCreep } = useGameStore.getState();

    // Update effects
    activeEffects = activeEffects.filter(effect => {
      if (effect.type === 'magicMissile') {
        return updateMagicMissile(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'magicBoomerang') {
        return updateBoomerang(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'arcaneNova') {
        return updateArcaneNova(effect, now, creeps, damageCreep);
      } else if (effect.type === 'lightning') {
        return updateLightning(effect, now, creeps, damageCreep);
      }
      return false;
    });

    // Update instanced mesh
    if (trailInstancesRef.current) {
      let instanceIndex = 0;

      // Update trail particles
      for (const [_, trail] of trailsRef.current.entries()) {
        for (let i = 0; i < trail.length; i++) {
          const pos = trail[i];
          const scale = 1.5 * (1 - (i / trail.length));

          dummy.position.copy(pos);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();

          trailInstancesRef.current.setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex++;
        }
      }

      trailInstancesRef.current.instanceMatrix.needsUpdate = true;
      setTotalTrailParticles(Math.max(100, instanceIndex));
    }
  });

  return (
    <group>
      {/* Trail particles */}
      <instancedMesh
        ref={trailInstancesRef}
        args={[trailGeometry, trailMaterial, Math.max(100, totalTrailParticles)]}
      />

      {/* Render effects */}
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
        } else if (effect.type === 'magicBoomerang') {
          // Horizontal spin with slight tilt for more dynamic look
          const wobble = Math.sin(effect.age * 5) * 0.05;
          const rotation = [0, effect.age * 15, wobble];

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <group scale={2}
                position={effect.position.toArray()}
                rotation={rotation}
              >
                {/* Main L-shaped body */}
                <group rotation={[Math.PI / 2, 0, 0]}>  {/* Rotate to horizontal orientation */}
                  {/* Vertical arm */}
                  <mesh>
                    <boxGeometry args={[0.1, 0.4, 0.05]} />
                    <meshStandardMaterial
                      color="#8B4513"
                      metalness={0.1}
                      roughness={0.7}
                    />
                  </mesh>

                  {/* Horizontal arm */}
                  <mesh position={[0.4 / 2 - 0.1 / 2, 0.4 / 2 - 0.1 / 2, 0]}>
                    <boxGeometry args={[0.4, 0.1, 0.05]} />
                    <meshStandardMaterial
                      color="#8B4513"
                      metalness={0.1}
                      roughness={0.7}
                    />
                  </mesh>

                  {/* Wood grain highlights */}
                  <mesh position={[0, 0, 0.05 / 2 + 0.001]}>
                    <boxGeometry args={[0.1 * 0.8, 0.4 * 0.9, 0.001]} />
                    <meshBasicMaterial
                      color="#DEB887"
                      transparent
                      opacity={0.3}
                    />
                  </mesh>
                </group>

                {/* Magic effect */}
                <pointLight
                  color="#87CEFA"
                  intensity={1}
                  distance={2}
                />
              </group>
            </group>
          );
        } else if (effect.type === 'arcaneNova') {
          const age = (Date.now() - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - (progress - 0.5) * 2);
          const scale = Math.min(progress * 2, 1) * effect.radius;

          // Apply damage during expansion phase
          if (progress < 0.5) {
            creeps.forEach(creep => {
              if (!creep.isDead) {
                const creepPos = new Vector3(...creep.position);
                const distance = effect.position.distanceTo(creepPos);
                if (distance < scale) {
                  damageCreep(creep.id, effect.damage);
                }
              }
            });
          }

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[scale, scale, 1]}
              >
                <ringGeometry args={[0.8, 1, 32]} />
                <arcaneNovaShaderMaterial
                  time={age}
                  scale={scale}
                  opacity={opacity}
                  transparent
                  depthWrite={false}
                  depthTest={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 1, effect.position.z]}
                color="#8B5CF6"
                intensity={5 * opacity}
                distance={scale * 2}
                decay={2}
              />
            </group>
          );
        } else if (effect.type === 'lightning') {
          const age = (Date.now() - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - progress * 2);
          const scale = progress < 0.1 ? progress * 10 : 1;

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                scale={[0.2 * scale, 4 * scale, 0.2 * scale]}
              >
                <cylinderGeometry args={[1, 0, 1, 6]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity} />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                color="#00ffff"
                intensity={10 * opacity}
                distance={5}
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
