import { Vector3, Color } from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import type { ElementType } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Arrow } from './Arrow';
import { Edges, Float } from '@react-three/drei';

export interface TowerProps {
  position: Vector3;
  type: ElementType;
  level?: number;
  onDamageEnemy?: (enemyId: number, damage: number, effects: any) => void;
}

export function Tower({ position, type, level = 1, onDamageEnemy }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2); // 20% range increase per level
  const damage = stats.damage * (1 + (level - 1) * 0.3); // 30% damage increase per level

  useFrame((state) => {
    if (phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current >= attackCooldown) {
      // Find enemies group
      const enemiesGroup = state.scene.getObjectByName('enemies');
      if (!enemiesGroup) return;

      // Get all enemies and their positions
      const enemies = enemiesGroup.children
        .map(obj => ({
          id: obj.userData.enemyId,
          position: obj.position,
          distance: new Vector3(position.x, position.y + 2, position.z)
            .distanceTo(obj.position)
        }))
        .filter(enemy => enemy.distance <= range)
        .sort((a, b) => a.distance - b.distance);

      if (enemies.length > 0) {
        const target = enemies[0];
        
        // Apply damage and effects based on tower type
        const effects = {
          slow: type === 'ice' ? 0.5 : 0,
          amplify: type === 'light' ? 1.3 : 1,
          dot: type === 'nature' ? damage * 0.2 : 0,
          splash: type === 'water' ? 0.6 : 0,
          armor: type === 'dark' ? -2 : 0
        };

        onDamageEnemy?.(target.id, damage, effects);
        lastAttackTime.current = now;

        // Visual feedback
        // TODO: Add particle effects based on tower type
      }
    }
  });

  return (
    <group position={position}>
      <Float 
        speed={2} 
        rotationIntensity={0.2} 
        floatIntensity={0.5}
      >
        <RigidBody type="fixed" colliders="hull">
          {/* Base */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.8, 2, 8]} />
            <meshStandardMaterial 
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
            <Edges color={stats.emissive} />
          </mesh>

          {/* Top */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.6, 0.4, 8]} />
            <meshStandardMaterial 
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.8}
              metalness={0.9}
              roughness={0.1}
            />
            <Edges color={stats.emissive} />
          </mesh>

          {/* Element-specific decorations */}
          {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, index) => (
            <mesh 
              key={index} 
              position={[0, 2, 0]} 
              rotation={[0, rotation, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 0.3, 1]} />
              <meshStandardMaterial 
                color={stats.emissive}
                emissive={stats.emissive}
                emissiveIntensity={1}
                metalness={1}
                roughness={0}
              />
              <Edges color={stats.color} />
            </mesh>
          ))}
        </RigidBody>
      </Float>

      {/* Range indicator (only in prep phase) */}
      {phase === 'prep' && (
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[range - 0.1, range, 64]} />
          <meshBasicMaterial 
            color={stats.emissive} 
            transparent 
            opacity={0.2} 
          />
        </mesh>
      )}
    </group>
  );
}

// Render arrows at root level to avoid local group transform
export function ArrowManager({ position, arrows, onArrowComplete }: {
  position: Vector3;
  arrows: { position: Vector3; direction: Vector3; id: number }[];
  onArrowComplete: (id: number) => void;
}) {
  return (
    <>
      {arrows.map((arrow) => (
        <Arrow
          key={arrow.id}
          position={arrow.position}
          direction={arrow.direction}
          onComplete={() => onArrowComplete(arrow.id)}
        />
      ))}
    </>
  );
}
