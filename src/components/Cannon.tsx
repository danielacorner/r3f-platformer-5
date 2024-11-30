import { Vector3 } from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Fireball } from './Fireball';

const ATTACK_RANGE = 15;
const ATTACK_COOLDOWN = 2000; // ms
const SPLASH_RADIUS = 5;

interface Enemy {
  position: Vector3;
  distance: number;
}

export function Cannon({ position }: { position: Vector3 }) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [activeFireballs, setActiveFireballs] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    targetPosition: Vector3;
  }>>([]);
  const nextFireballId = useRef(0);
  const cannonRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Find enemies group
      const enemiesGroup = state.scene.getObjectByName('enemies');
      if (!enemiesGroup) {
        return;
      }

      // Get all enemies in range
      const enemiesInRange: Enemy[] = [];
      enemiesGroup.children.forEach(enemy => {
        const enemyPos = enemy.position;
        const cannonPos = new Vector3(position.x, position.y + 1, position.z);
        const distance = cannonPos.distanceTo(enemyPos);
        
        if (distance <= ATTACK_RANGE) {
          enemiesInRange.push({
            position: enemyPos,
            distance: distance
          });
        }
      });

      // Sort by distance and take closest
      enemiesInRange.sort((a, b) => a.distance - b.distance);

      if (enemiesInRange.length > 0) {
        const target = enemiesInRange[0];
        const spawnPos = new Vector3(position.x, position.y + 1, position.z);
        
        // Calculate direction to target
        const direction = target.position.clone()
          .sub(spawnPos)
          .normalize();

        // Calculate rotation to face target
        const angle = Math.atan2(direction.x, direction.z);
        setRotation(angle);

        // Create new fireball
        const fireballId = nextFireballId.current++;
        setActiveFireballs(prev => [...prev, {
          id: fireballId,
          position: spawnPos.clone(),
          direction: direction.clone(),
          targetPosition: target.position.clone()
        }]);

        lastAttackTime.current = now;
      }
    }
  });

  return (
    <group position={position} ref={cannonRef}>
      <RigidBody type="fixed" colliders="hull">
        {/* Base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.8, 1, 8]} />
          <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* Rotating turret */}
        <group rotation={[0, rotation, 0]}>
          {/* Cannon barrel */}
          <mesh position={[0, 1, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 1.5, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.2} />
          </mesh>

          {/* Reinforcement rings */}
          {[0.2, 0.6, 1].map((pos, index) => (
            <mesh 
              key={index} 
              position={[0, 1, 0]} 
              rotation={[0, 0, -Math.PI / 4]}
              castShadow
            >
              <torusGeometry args={[0.4, 0.05, 8, 16]} />
              <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.1} />
            </mesh>
          ))}

          {/* Decorative details */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </RigidBody>

      {/* Range indicator (only in prep phase) */}
      {phase === 'prep' && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, ATTACK_RANGE, 32]} />
          <meshBasicMaterial color="#ff8844" transparent opacity={0.1} />
        </mesh>
      )}

      {/* Active fireballs */}
      {activeFireballs.map(({ id, position: pos, direction, targetPosition }) => (
        <Fireball
          key={id}
          position={pos}
          direction={direction}
          targetPosition={targetPosition}
          splashRadius={SPLASH_RADIUS}
          onComplete={() => {
            setActiveFireballs(prev => prev.filter(f => f.id !== id));
          }}
        />
      ))}
    </group>
  );
}
