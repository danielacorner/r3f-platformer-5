import { useRef, useEffect } from 'react';
import { Vector3, Float32BufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';

const ARROW_SPEED = 30;
const LIFETIME = 2; // seconds
const ARROW_DAMAGE = 20;

export function Arrow({ position, direction, onComplete }: { 
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}) {
  // Store initial position
  const pos = useRef(position.clone());
  const dir = useRef(direction.clone());
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    console.log('Arrow mounted at world position:', pos.current.toArray());
  }, []);

  useFrame((state, delta) => {
    // Update position
    const movement = dir.current.clone().multiplyScalar(ARROW_SPEED * delta);
    pos.current.add(movement);
    
    console.log('Arrow frame update, world position:', pos.current.toArray());

    // Check for enemies
    const enemiesGroup = state.scene.getObjectByName('enemies');
    if (enemiesGroup) {
      for (const enemy of enemiesGroup.children) {
        const distance = pos.current.distanceTo(enemy.position);
        if (distance < 1) {
          console.log('Hit enemy at distance:', distance);
          if (enemy.userData?.takeDamage) {
            enemy.userData.takeDamage(ARROW_DAMAGE, dir.current.clone().multiplyScalar(5));
          }
          onComplete();
          return;
        }
      }
    }

    // Check lifetime
    if (Date.now() - startTime.current > LIFETIME * 1000) {
      console.log('Arrow expired');
      onComplete();
    }
  });

  return (
    <>
      {/* Super large debug sphere */}
      <mesh position={pos.current.toArray()}>
        <sphereGeometry args={[3]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
      </mesh>

      {/* Direction line */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              pos.current.x, pos.current.y, pos.current.z,
              pos.current.x + dir.current.x * 10,
              pos.current.y + dir.current.y * 10,
              pos.current.z + dir.current.z * 10
            ])}
            itemSize={3}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffff00" linewidth={5} />
      </line>
    </>
  );
}
