import { Vector3 } from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Boomerang } from './Boomerang';

const ATTACK_RANGE = 12;
const ATTACK_COOLDOWN = 2000; // ms

interface Enemy {
  position: Vector3;
  distance: number;
}

export function BoomerangTower({ position }: { position: Vector3 }) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [activeBoomerangs, setActiveBoomerangs] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
  }>>([]);
  const nextBoomerangId = useRef(0);
  const towerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (phase !== 'combat') return;

    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      // Find enemies group
      const enemiesGroup = state.scene.getObjectByName('enemies');
      if (!enemiesGroup) return;

      // Get all enemies in range
      const enemiesInRange: Enemy[] = [];
      enemiesGroup.children.forEach(enemy => {
        const enemyPos = enemy.position;
        const towerPos = new Vector3(position.x, position.y + 1, position.z);
        const distance = towerPos.distanceTo(enemyPos);
        
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

        // Create new boomerang
        const boomerangId = nextBoomerangId.current++;
        setActiveBoomerangs(prev => [...prev, {
          id: boomerangId,
          position: spawnPos.clone(),
          direction: direction.clone()
        }]);

        lastAttackTime.current = now;
      }
    }
  });

  return (
    <group position={position} ref={towerRef}>
      <RigidBody type="fixed" colliders="hull">
        {/* Base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.8, 1, 8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* Rotating turret */}
        <group rotation={[0, rotation, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshStandardMaterial color="#6a6a6a" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </RigidBody>

      {/* Active boomerangs */}
      {activeBoomerangs.map(({ id, position, direction }) => (
        <Boomerang
          key={id}
          position={position}
          direction={direction}
          returnPosition={new Vector3(position.x, position.y + 1, position.z)}
          onComplete={() => {
            setActiveBoomerangs(prev => prev.filter(b => b.id !== id));
          }}
        />
      ))}
    </group>
  );
}
