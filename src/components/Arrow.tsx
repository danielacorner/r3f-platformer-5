import { useRef } from 'react';
import { Vector3, Quaternion } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

const ARROW_SPEED = 30;
const LIFETIME = 2; // seconds

export function Arrow({ position, direction, onComplete }: { 
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}) {
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const hitEnemy = useRef(false);

  // Calculate rotation to face direction
  const rotation = new Quaternion();
  rotation.setFromUnitVectors(new Vector3(0, 0, 1), direction);

  useFrame((state, delta) => {
    if (!ref.current || hitEnemy.current) return;

    // Move arrow
    const pos = ref.current.translation();
    ref.current.setTranslation({
      x: pos.x + direction.x * ARROW_SPEED * delta,
      y: pos.y + direction.y * ARROW_SPEED * delta,
      z: pos.z + direction.z * ARROW_SPEED * delta
    });

    // Check lifetime
    if (Date.now() - startTime.current > LIFETIME * 1000) {
      onComplete();
    }
  });

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      position={position}
      colliders={false}
      sensor
      onIntersectionEnter={({ other }) => {
        if (other.rigidBody?.userData?.isEnemy && !hitEnemy.current) {
          hitEnemy.current = true;
          // Apply damage to enemy
          other.rigidBody.userData.takeDamage?.(1);
          onComplete();
        }
      }}
    >
      <group quaternion={rotation}>
        {/* Arrow head */}
        <mesh position={[0, 0, 0.4]}>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        {/* Arrow shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Arrow fletching */}
        <mesh position={[0, 0, -0.3]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.01]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </group>
      <CuboidCollider args={[0.1, 0.1, 0.5]} sensor />
    </RigidBody>
  );
}
