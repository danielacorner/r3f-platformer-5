import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
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
}

let activeEffects: SkillEffect[] = [];

const GRAVITY = new Vector3(0, -9.8, 0);
const MAX_SEEK_DISTANCE = 15;
const MISSILE_COLOR = '#ff0000';  // Bright red for testing

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
  const missileSpeed = 10;
  const missileRadius = 0.2;

  const angleStep = (2 * Math.PI) / missileCount;

  for (let i = 0; i < missileCount; i++) {
    const angle = i * angleStep;
    const horizontalDir = new Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    ).normalize().multiplyScalar(2);

    const initialVelocity = new Vector3(
      horizontalDir.x,
      missileSpeed * 0.5,
      horizontalDir.z
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
      velocity: initialVelocity.clone(),
      initialVelocity: initialVelocity.clone(),
      phase: 'rising' as const,
      timeOffset
    };

    console.log('Created missile:', i, 'at position:', effect.position.toArray(), 'with velocity:', effect.velocity.toArray());
    activeEffects.push(effect);
  }

  // Force a re-render
  window.dispatchEvent(new CustomEvent('effectsChanged'));
}

function findNearestCreep(position: Vector3, creeps: any[]): Vector3 | null {
  let nearestDistance = Infinity;
  let nearestPos: Vector3 | null = null;

  for (const creep of creeps) {
    const creepPos = new Vector3(...creep.position);
    const distance = creepPos.distanceTo(position);

    if (distance < nearestDistance && distance < MAX_SEEK_DISTANCE) {
      nearestDistance = distance;
      nearestPos = creepPos;
    }
  }

  return nearestPos;
}

export function SkillEffects() {
  const { creeps, damageCreep } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Listen for new effects
  useEffect(() => {
    const handleEffectsChanged = () => {
      setEffectsCount(prev => prev + 1);
    };
    window.addEventListener('effectsChanged', handleEffectsChanged);
    return () => window.removeEventListener('effectsChanged', handleEffectsChanged);
  }, []);

  useFrame((state, delta) => {
    // Force continuous updates
    setFrameCount(prev => (prev + 1) % 1000000);

    const now = Date.now();
    const remainingEffects: SkillEffect[] = [];

    for (const effect of activeEffects) {
      if (effect.type === 'magicMissile') {
        if (now < effect.startTime) {
          remainingEffects.push(effect);
          continue;
        }

        const age = (now - effect.startTime) / 1000;

        if (age > effect.duration) {
          console.log('Effect expired:', effect.id);
          continue;
        }

        if (effect.velocity) {
          const frameVelocity = effect.velocity.clone().multiplyScalar(delta);
          effect.position.add(frameVelocity);

          if (effect.phase === 'rising') {
            effect.velocity.add(GRAVITY.clone().multiplyScalar(delta * 0.3));

            if (effect.velocity.y < 0) {
              effect.phase = 'seeking';
              console.log('Missile transitioning to seeking phase');
            }
          } else if (effect.phase === 'seeking') {
            effect.velocity.add(GRAVITY.clone().multiplyScalar(delta * 0.3));

            const nearestCreep = findNearestCreep(effect.position, creeps);
            if (nearestCreep) {
              const toTarget = nearestCreep.clone().sub(effect.position).normalize();
              const seekForce = toTarget.multiplyScalar(20 * delta);
              effect.velocity.add(seekForce);

              if (effect.velocity.length() > 15) {
                effect.velocity.normalize().multiplyScalar(15);
              }
            } else {
              effect.phase = 'falling';
            }
          }
        }

        if (effect.position.y <= 0) continue;

        let hitCreep = false;
        for (const creep of creeps) {
          const creepPos = new Vector3(...creep.position);
          const distance = creepPos.distanceTo(effect.position);

          if (distance <= effect.radius + 0.5) {
            console.log('Missile hit creep:', effect.id);
            damageCreep(creep.id, effect.damage || 0);
            hitCreep = true;
            break;
          }
        }

        if (hitCreep) continue;
        remainingEffects.push(effect);
      }
    }

    activeEffects = remainingEffects;
  });

  return (
    <group>
      {activeEffects.map(effect => {
        if (effect.type === 'magicMissile') {
          return (
            <mesh
              key={`${effect.id}-${frameCount}`}
              position={effect.position.toArray()}
            >
              <sphereGeometry args={[effect.radius, 32, 32]} />
              <meshStandardMaterial
                color={effect.color}
                emissive={effect.color}
                emissiveIntensity={2}
              />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}
