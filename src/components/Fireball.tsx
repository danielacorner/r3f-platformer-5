import { useRef, useMemo } from 'react';
import { Vector3, Quaternion } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

const FIREBALL_SPEED = 25;
const LIFETIME = 2; // seconds
const FIREBALL_DAMAGE = 30; // Base damage
const PARTICLE_COUNT = 100;

interface FireballProps {
  position: Vector3;
  direction: Vector3;
  splashRadius: number;
  onComplete: () => void;
}

export function Fireball({ position, direction, splashRadius, onComplete }: FireballProps) {
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const hasExploded = useRef(false);
  const particlesRef = useRef<any>();
  const currentPosition = useRef(position.clone());

  // Calculate rotation to face direction
  const rotation = useMemo(() => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 0, 1), direction);
    return q;
  }, [direction]);

  // Create random particles positions
  const particles = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      arr[i] = Math.cos(angle) * radius;
      arr[i + 1] = Math.sin(angle) * radius;
      arr[i + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (hasExploded.current) return;

    // Update position
    currentPosition.current.add(direction.clone().multiplyScalar(FIREBALL_SPEED * delta));
    
    // Update rigid body position if it exists
    if (ref.current) {
      ref.current.setTranslation(currentPosition.current);
    }

    // Rotate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.x += delta * 2;
      particlesRef.current.rotation.y += delta * 3;
    }

    // Check lifetime
    if (Date.now() - startTime.current > LIFETIME * 1000) {
      explode(currentPosition.current);
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
        const damage = Math.ceil(FIREBALL_DAMAGE * (1 - distance / splashRadius));
        enemy.userData.takeDamage?.(damage, direction.clone().multiplyScalar(10));
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
          explode(currentPosition.current);
        }
      }}
    >
      <group quaternion={rotation}>
        {/* Fireball core */}
        <mesh castShadow>
          <sphereGeometry args={[0.4]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff4400"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        {/* Inner glow */}
        <mesh scale={1.2}>
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Fire particles */}
        <group ref={particlesRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={PARTICLE_COUNT}
                array={particles}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.15}
              color="#ff8800"
              transparent
              opacity={0.8}
              sizeAttenuation
            />
          </points>
        </group>

        {/* Trail particles */}
        <points position={[0, 0, -1]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(150).map(() => (Math.random() - 0.5) * 0.3)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color="#ff4400"
            transparent
            opacity={0.5}
          />
        </points>
      </group>
      <CuboidCollider args={[0.3, 0.3, 0.3]} sensor />
    </RigidBody>
  );
}
