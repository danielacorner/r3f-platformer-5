import { Vector3 } from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Arrow } from './Arrow';

const ATTACK_RANGE = 15;
const ATTACK_COOLDOWN = 1000; // ms

export function Tower({ position }: { position: Vector3 }) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const activeArrows = useRef<{ position: Vector3; direction: Vector3; id: number }[]>([]);
  const nextArrowId = useRef(0);

  useFrame(() => {
    if (phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Find closest enemy
      const enemies = Array.from(document.querySelectorAll('[data-enemy]')).map(elem => {
        const enemyObject = (window as any)._three.getObjectByProperty('uuid', elem.id);
        return enemyObject?.parent;
      }).filter(Boolean);

      let closestEnemy = null;
      let closestDistance = Infinity;

      enemies.forEach(enemy => {
        const distance = position.distanceTo(enemy.position);
        if (distance < closestDistance && distance <= ATTACK_RANGE) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      });

      if (closestEnemy) {
        // Calculate direction to enemy
        const direction = new Vector3()
          .subVectors(closestEnemy.position, new Vector3(position.x, position.y + 2, position.z))
          .normalize();

        // Add new arrow
        activeArrows.current.push({
          position: new Vector3(position.x, position.y + 2, position.z),
          direction,
          id: nextArrowId.current++
        });

        lastAttackTime.current = now;
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

      {/* Active Arrows */}
      {activeArrows.current.map((arrow) => (
        <Arrow
          key={arrow.id}
          position={arrow.position}
          direction={arrow.direction}
          onComplete={() => {
            activeArrows.current = activeArrows.current.filter(a => a.id !== arrow.id);
          }}
        />
      ))}
    </group>
  );
}
