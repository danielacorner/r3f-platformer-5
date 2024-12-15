import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

const LIFETIME = 2; // seconds

interface ArrowProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  damage?: number;
  speed?: number;
  scale?: number;
}

export function Arrow({ 
  position, 
  direction, 
  onComplete,
  damage = 20,
  speed = 30,
  scale = 1
}: ArrowProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const velocity = useRef(direction.clone().normalize().multiplyScalar(speed));
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
    }
  }, [position]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update position
    const movement = velocity.current.clone().multiplyScalar(delta);
    groupRef.current.position.add(movement);

    // Check for enemies
    const enemiesGroup = state.scene.getObjectByName('enemies');
    if (enemiesGroup) {
      for (const enemy of enemiesGroup.children) {
        const distance = groupRef.current.position.distanceTo(enemy.position);
        if (distance < 1) {
          if (enemy.userData?.takeDamage) {
            enemy.userData.takeDamage(damage, direction.clone().multiplyScalar(5));
          }
          onComplete();
          return;
        }
      }
    }

    // Check lifetime
    if (Date.now() - startTime.current > LIFETIME * 1000) {
      onComplete();
    }
  });

  return (
    <group 
      ref={groupRef}
      rotation={[0, Math.atan2(direction.x, direction.z), 0]}
      scale={[scale, scale, scale]}
    >
      {/* Rotate to align with direction */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Arrow shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Arrow head */}
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.16, 0.4]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>

        {/* Arrow fletching (feathers) */}
        <group position={[0, -0.5, 0]}>
          {/* Vertical fletching */}
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.15]} />
            <meshStandardMaterial color="#A0522D" />
          </mesh>
          {/* Horizontal fletching */}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.15]} />
            <meshStandardMaterial color="#A0522D" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
