import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MeshBasicMaterial, Color } from 'three';
import { useGameStore } from '../../store/gameStore';

interface SkillEffect {
  id: string;
  type: string;
  position: Vector3;
  startTime: number;
  duration: number;
  radius: number;
  damage?: number;
  color: string;
}

// Store for active skill effects
let activeEffects: SkillEffect[] = [];

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

export function SkillEffects() {
  const { creeps, updateCreep, damageCreep } = useGameStore();
  const materialRef = useRef<MeshBasicMaterial>();

  useFrame(() => {
    const now = Date.now();
    const remainingEffects: SkillEffect[] = [];

    for (const effect of activeEffects) {
      const age = (now - effect.startTime) / 1000;
      if (age > effect.duration) continue;

      // Process effect based on type
      for (const creep of creeps) {
        const creepPos = new Vector3(...creep.position);
        const distance = creepPos.distanceTo(effect.position);

        if (distance <= effect.radius) {
          switch (effect.type) {
            case 'lightning':
              damageCreep(creep.id, effect.damage || 0);
              break;

            case 'inferno':
              damageCreep(creep.id, (effect.damage || 0) * (1/60)); // Damage per frame
              break;

            case 'timeDilation':
              updateCreep(creep.id, {
                speed: creep.speed * 0.5,
                effects: {
                  ...creep.effects,
                  slow: {
                    value: 0.5,
                    duration: 0.5,
                    startTime: now
                  }
                }
              });
              break;
          }
        }
      }

      remainingEffects.push(effect);
    }

    activeEffects = remainingEffects;
  });

  return (
    <>
      {activeEffects.map(effect => (
        <group key={effect.id} position={[effect.position.x, 0.1, effect.position.z]}>
          <mesh>
            <cylinderGeometry args={[effect.radius, effect.radius, 0.1, 32]} />
            <meshBasicMaterial
              ref={materialRef}
              color={effect.color}
              transparent
              opacity={0.3}
            />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.1, effect.radius, 4, 32]} />
            <meshBasicMaterial
              color={effect.color}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
