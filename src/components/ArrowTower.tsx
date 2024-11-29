import { useRef, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Arrow } from './Arrow';

const ARROW_RANGE = 15;
const ARROW_DAMAGE = 5;
const ATTACK_COOLDOWN = 300; // Very fast repeat rate (300ms)

export function ArrowTower({ position }: { position: Vector3 }) {
  const [target, setTarget] = useState<Vector3 | null>(null);
  const lastAttackTime = useRef(0);
  const towerRef = useRef<THREE.Group>(null);
  const [arrows, setArrows] = useState<{ id: number; position: Vector3; direction: Vector3 }[]>([]);
  const nextArrowId = useRef(0);

  // Animation for tower rotation
  const { rotation } = useSpring({
    rotation: target ? [0, Math.atan2(
      target.x - position.x,
      target.z - position.z
    ), 0] : [0, 0, 0],
    config: { tension: 120, friction: 14 }
  });

  useFrame((state) => {
    const currentTime = Date.now();
    if (currentTime - lastAttackTime.current < ATTACK_COOLDOWN) {
      return;
    }

    // Find closest enemy
    const enemiesGroup = state.scene.getObjectByName('enemies');
    if (!enemiesGroup) return;

    let closestEnemy = null;
    let closestDistance = Infinity;

    enemiesGroup.children.forEach((enemy) => {
      const distance = position.distanceTo(enemy.position);
      if (distance < ARROW_RANGE && distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      const targetPos = closestEnemy.position.clone();
      setTarget(targetPos);

      // Calculate spawn position at the tip of the launcher
      const spawnOffset = new Vector3(0, 1.2, 0.3);
      const spawnPos = position.clone().add(spawnOffset);

      // Calculate direction for the arrow
      const direction = targetPos.clone()
        .sub(spawnPos)
        .normalize();

      // Create new arrow
      const arrowId = nextArrowId.current++;
      setArrows(prev => [...prev, {
        id: arrowId,
        position: spawnPos,
        direction: direction
      }]);

      lastAttackTime.current = currentTime;
    } else {
      setTarget(null);
    }
  });

  // Handle arrow cleanup
  const handleArrowComplete = (arrowId: number) => {
    setArrows(prev => prev.filter(arrow => arrow.id !== arrowId));
  };

  return (
    <group position={position}>
      <animated.group ref={towerRef} rotation={rotation}>
        {/* Base */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 1]} />
          <meshStandardMaterial color="#8B4513" metalness={0.4} roughness={0.7} />
        </mesh>

        {/* Upper platform */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#A0522D" metalness={0.3} roughness={0.8} />
        </mesh>

        {/* Arrow launcher */}
        <mesh position={[0, 1.2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6]} />
          <meshStandardMaterial color="#6B4423" metalness={0.5} roughness={0.6} />
        </mesh>
      </animated.group>

      {/* Active Arrows */}
      {arrows.map(arrow => (
        <Arrow
          key={arrow.id}
          position={arrow.position}
          direction={arrow.direction}
          onComplete={() => handleArrowComplete(arrow.id)}
          damage={ARROW_DAMAGE}
          speed={40}
          scale={0.6}
        />
      ))}

      {/* Range Indicator (only visible during placement) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0, ARROW_RANGE, 32]} />
        <meshBasicMaterial color="#8B4513" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
