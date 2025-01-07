import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D } from 'three';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ArcaneNovaShaderMaterial } from './shaders/ArcaneNovaShader';
import { updateMagicMissile } from './effectHandlers/magicMissileHandler';
import { updateTimeDilation } from './effectHandlers/timeDilationHandler';
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
  const ringRef = useRef<InstancedMesh>();

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
    const { creeps, damageCreep } = useGameStore.getState();

    // Update effects
    activeEffects = activeEffects.filter(effect => {
      if (effect.type === 'magicMissile') {
        return updateMagicMissile(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'magicBoomerang') {
        return updateBoomerang(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'timeDilation') {
        return updateTimeDilation(effect, now, creeps);
      } else if (effect.type === 'arcaneNova') {
        return updateArcaneNova(effect, now, creeps, damageCreep);
      } else if (effect.type === 'lightning') {
        return updateLightning(effect, now, creeps, damageCreep);
      }
      return false;
    });

    // Update instanced mesh
    if (trailInstancesRef.current && totalTrailParticles > 0) {
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

    setTotalTrailParticles(trailsRef.current.size * 20);
  });

  return (
    <group>
      {/* Trail particles */}
      {trailInstancesRef.current && (
        <instancedMesh
          ref={trailInstancesRef}
          args={[trailGeometry, trailMaterial, totalTrailParticles]}
        />
      )}

      {/* Render effects */}
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
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - progress * 2); // Faster fade out
          const scale = progress < 0.1 ? progress * 10 : 1; // Quick scale up

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
        } else if (effect.type === 'timeDilation') {
          const age = (currentTime - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.min(1, Math.max(0, 1.5 - progress * 1.5));

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[effect.radius, effect.radius, 1]}
              >
                <ringGeometry args={[0.8, 1, 32]} />
                <meshBasicMaterial
                  color={effect.color}
                  transparent
                  opacity={opacity * 0.7}
                  side={THREE.DoubleSide}
                />
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
              <pointLight
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                color={effect.color}
                intensity={3 * opacity}
                distance={effect.radius * 2}
                decay={2}
              />
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
        }
        return null;
      })}
    </group>
  );
}
