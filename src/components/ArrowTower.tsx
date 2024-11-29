import { useRef, useState, useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Arrow } from './Arrow';

interface ArrowTowerProps {
  position: Vector3;
}

export function ArrowTower({ position }: ArrowTowerProps) {
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [arrows, setArrows] = useState<{ id: number; position: Vector3; direction: Vector3; }[]>([]);
  const nextArrowId = useRef(0);
  const lastAttackTime = useRef(0);
  const towerRef = useRef<THREE.Group>(null);
  const ATTACK_COOLDOWN = 300; // ms
  const ATTACK_RANGE = 15;
  const ARROW_DAMAGE = 5;

  // Spring animation for tower rotation
  const { rotation } = useSpring({
    rotation: target ? [0, Math.atan2(
      target.x - position.x,
      target.z - position.z
    ), 0] : [0, 0, 0],
    config: { tension: 100, friction: 10 }
  });

  useFrame((state) => {
    const currentTime = Date.now();
    if (currentTime - lastAttackTime.current < ATTACK_COOLDOWN) return;

    // Find closest enemy
    const enemiesGroup = state.scene.getObjectByName('enemies');
    let closestEnemy = null;
    let closestDistance = Infinity;

    if (enemiesGroup) {
      for (const enemy of enemiesGroup.children) {
        const distance = position.distanceTo(enemy.position);
        if (distance < closestDistance && distance < ATTACK_RANGE) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
    }

    if (closestEnemy) {
      const targetPos = closestEnemy.position.clone();
      setTarget(targetPos);

      // Get current tower rotation
      const currentRotation = towerRef.current?.rotation.y || 0;

      // Calculate spawn position relative to tower
      const spawnPos = position.clone();
      spawnPos.y += 1.4; // Height offset to top of tower
      
      // Calculate forward offset based on current rotation
      const forwardOffset = new Vector3(0, 0, 0);
      forwardOffset.applyEuler(new Euler(0, currentRotation, 0));
      spawnPos.add(forwardOffset);

      // Calculate direction to target
      const direction = targetPos.clone().sub(spawnPos).normalize();

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

  // Remove arrows that have completed their flight
  const removeArrow = (arrowId: number) => {
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
        <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.3]} />
          <meshStandardMaterial color="#6B4423" metalness={0.5} roughness={0.6} />
        </mesh>
      </animated.group>

      {/* Active Arrows */}
      {arrows.map(arrow => (
        <Arrow
          key={arrow.id}
          position={arrow.position}
          direction={arrow.direction}
          onComplete={() => removeArrow(arrow.id)}
          damage={ARROW_DAMAGE}
          speed={40}
          scale={1.0}
        />
      ))}
    </group>
  );
}
