import { Vector3 } from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Fireball } from './Fireball';

const ATTACK_RANGE = 12;
const ATTACK_COOLDOWN = 2000; // ms
const SPLASH_RADIUS = 5;

export function Cannon({ position }: { position: Vector3 }) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const activeFireballs = useRef<{ position: Vector3; direction: Vector3; id: number }[]>([]);
  const nextFireballId = useRef(0);

  useFrame((state) => {
    if (phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Find enemies in range
      const enemies = Array.from(state.scene.getObjectByName('enemies')?.children || [])
        .filter(obj => obj.userData.type === 'enemy')
        .map(obj => ({
          position: obj.position,
          distance: new Vector3(position.x, position.y + 1, position.z)
            .distanceTo(obj.position)
        }))
        .filter(enemy => enemy.distance <= ATTACK_RANGE);

      if (enemies.length > 0) {
        // Group enemies by proximity
        const enemyGroups: Vector3[][] = [];
        enemies.forEach(enemy => {
          let addedToGroup = false;
          for (const group of enemyGroups) {
            if (group[0].distanceTo(enemy.position) < SPLASH_RADIUS) {
              group.push(enemy.position);
              addedToGroup = true;
              break;
            }
          }
          if (!addedToGroup) {
            enemyGroups.push([enemy.position]);
          }
        });

        // Find largest group
        let targetGroup = enemyGroups.reduce((largest, current) => 
          current.length > largest.length ? current : largest
        , [] as Vector3[]);

        if (targetGroup.length > 0) {
          // Calculate center of group
          const center = targetGroup.reduce((sum, pos) => sum.add(pos), new Vector3())
            .divideScalar(targetGroup.length);

          // Calculate direction to target
          const direction = new Vector3()
            .subVectors(center, new Vector3(position.x, position.y + 1, position.z))
            .normalize();

          // Add new fireball
          activeFireballs.current.push({
            position: new Vector3(position.x, position.y + 1, position.z),
            direction,
            id: nextFireballId.current++
          });

          lastAttackTime.current = now;
        }
      }
    }

    // Clean up completed fireballs
    activeFireballs.current = activeFireballs.current.filter(fireball => {
      const age = now - fireball.id * ATTACK_COOLDOWN;
      return age < 2000; // Remove fireballs after 2 seconds
    });
  });

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        {/* Base */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.7, 0.8, 1, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        {/* Cannon barrel */}
        <mesh position={[0, 1, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.3, 0.4, 1.5, 8]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        {/* Reinforcement rings */}
        {[0.2, 0.6, 1].map((pos, index) => (
          <mesh key={index} position={[0, 1, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <torusGeometry args={[0.4, 0.05, 8, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        ))}
      </RigidBody>

      {/* Range indicators (only in prep phase) */}
      {phase === 'prep' && (
        <>
          {/* Attack range indicator */}
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ATTACK_RANGE - 0.1, ATTACK_RANGE, 64]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.2} />
          </mesh>
          {/* Splash radius indicator */}
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[SPLASH_RADIUS - 0.1, SPLASH_RADIUS, 32]} />
            <meshBasicMaterial color="#ff8844" transparent opacity={0.1} />
          </mesh>
        </>
      )}

      {/* Active Fireballs */}
      {activeFireballs.current.map((fireball) => (
        <Fireball
          key={fireball.id}
          position={fireball.position}
          direction={fireball.direction}
          splashRadius={SPLASH_RADIUS}
          onComplete={() => {
            activeFireballs.current = activeFireballs.current.filter(f => f.id !== fireball.id);
          }}
        />
      ))}
    </group>
  );
}
