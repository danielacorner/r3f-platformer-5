import { useRef } from 'react';
import { Vector3, Quaternion } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

const FIREBALL_SPEED = 25;
const LIFETIME = 2; // seconds

export function Fireball({ position, direction, splashRadius, onComplete }: { 
  position: Vector3;
  direction: Vector3;
  splashRadius: number;
  onComplete: () => void;
}) {
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const hasExploded = useRef(false);

  // Calculate rotation to face direction
  const rotation = new Quaternion();
  rotation.setFromUnitVectors(new Vector3(0, 0, 1), direction);

  useFrame((state, delta) => {
    if (!ref.current || hasExploded.current) return;

    // Move fireball
    const pos = ref.current.translation();
    ref.current.setTranslation({
      x: pos.x + direction.x * FIREBALL_SPEED * delta,
      y: pos.y + direction.y * FIREBALL_SPEED * delta,
      z: pos.z + direction.z * FIREBALL_SPEED * delta
    });

    // Check lifetime
    if (Date.now() - startTime.current > LIFETIME * 1000) {
      explode(new Vector3(pos.x, pos.y, pos.z));
    }
  });

  const explode = (position: Vector3) => {
    if (hasExploded.current) return;
    hasExploded.current = true;

    // Find all enemies in splash radius
    const enemies = Array.from(document.querySelectorAll('[data-enemy]')).map(elem => {
      const enemyObject = (window as any)._three.getObjectByProperty('uuid', elem.id);
      return enemyObject?.parent;
    }).filter(Boolean);

    enemies.forEach(enemy => {
      const distance = position.distanceTo(enemy.position);
      if (distance <= splashRadius) {
        // Calculate damage based on distance (more damage closer to center)
        const damage = Math.ceil(3 * (1 - distance / splashRadius));
        enemy.userData.takeDamage?.(damage);
      }
    });

    onComplete();
  };

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      position={position}
      colliders={false}
      sensor
      onIntersectionEnter={({ other }) => {
        if (other.rigidBody?.userData?.isEnemy && !hasExploded.current) {
          explode(other.rigidBody.translation());
        }
      }}
    >
      <group quaternion={rotation}>
        {/* Fireball core */}
        <mesh>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff4400"
            emissiveIntensity={2}
          />
        </mesh>
        {/* Fire particles */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(150).map(() => (Math.random() - 0.5) * 0.5)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color="#ff8800"
            transparent
            opacity={0.8}
          />
        </points>
      </group>
      <CuboidCollider args={[0.3, 0.3, 0.3]} sensor />
    </RigidBody>
  );
}
