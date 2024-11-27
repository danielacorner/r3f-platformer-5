import { Vector3 } from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Arrow } from './Arrow';

const ATTACK_RANGE = 15;
const ATTACK_COOLDOWN = 1000; // ms

export function Tower({ position, onArrowSpawn }: { 
  position: Vector3;
  onArrowSpawn: (arrow: { position: Vector3; direction: Vector3; id: number }) => void;
}) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const nextArrowId = useRef(0);

  // Debug sphere to show tower position
  const debugSphere = (
    <mesh position={[0, 2, 0]}>
      <sphereGeometry args={[0.5]} />
      <meshBasicMaterial color="#00ff00" />
    </mesh>
  );

  useFrame((state) => {
    if (phase !== 'combat') {
      return;
    }

    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Find enemies group
      const enemiesGroup = state.scene.getObjectByName('enemies');
      console.log('Found enemies group:', enemiesGroup?.name, 'Children:', enemiesGroup?.children.length);
      if (!enemiesGroup) return;

      // Get all enemies and their positions
      const enemies = enemiesGroup.children
        .map(obj => ({
          position: obj.position,
          distance: new Vector3(position.x, position.y + 2, position.z)
            .distanceTo(obj.position)
        }))
        .filter(enemy => enemy.distance <= ATTACK_RANGE)
        .sort((a, b) => a.distance - b.distance);

      console.log('Enemies in range:', enemies.length, 'Total enemies:', enemiesGroup.children.length);

      if (enemies.length > 0) {
        const target = enemies[0]; // Target closest enemy
        console.log('Tower position:', position.toArray());
        console.log('Enemy position:', target.position.toArray());
        console.log('Targeting enemy at distance:', target.distance);
        
        const spawnPos = new Vector3(position.x, position.y + 2, position.z);
        const direction = new Vector3()
          .subVectors(target.position, spawnPos)
          .normalize();

        console.log('Spawning arrow at:', spawnPos.toArray(), 'with direction:', direction.toArray());

        // Spawn new arrow
        onArrowSpawn({
          position: spawnPos,
          direction: direction,
          id: nextArrowId.current++
        });

        lastAttackTime.current = now;
        console.log('Fired arrow at enemy');
      }
    }
  });

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        {/* Base */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 2, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        {/* Top */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.7, 0.6, 0.4, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        {/* Arrow slots */}
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, index) => (
          <mesh key={index} position={[0, 2, 0]} rotation={[0, rotation, 0]}>
            <boxGeometry args={[0.2, 0.3, 1]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
        ))}
      </RigidBody>

      {/* Debug sphere */}
      {debugSphere}

      {/* Range indicator (only in prep phase) */}
      {phase === 'prep' && (
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ATTACK_RANGE - 0.1, ATTACK_RANGE, 64]} />
          <meshBasicMaterial color="#4444ff" transparent opacity={0.2} />
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
