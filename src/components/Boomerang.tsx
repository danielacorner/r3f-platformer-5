import { useRef, useState } from 'react';
import { Vector3, Quaternion } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

const BOOMERANG_SPEED = 20;
const LIFETIME = 2;
const BOOMERANG_DAMAGE = 25;
const ROTATION_SPEED = 15;
const CURVE_STRENGTH = 8;
const RETURN_SPEED_MULTIPLIER = 1.5;

interface BoomerangProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  returnPosition: Vector3;
}

export function Boomerang({ position, direction, onComplete, returnPosition }: BoomerangProps) {
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const currentPosition = useRef(position.clone());
  const rotationAngle = useRef(0);
  const hasHitEnemies = useRef(new Set<string>());
  const phase = useRef<'outward' | 'return'>('outward');
  
  // Calculate perpendicular vector for curved path
  const perpendicular = direction.clone().cross(new Vector3(0, 1, 0)).normalize();
  const initialVelocity = direction.clone().multiplyScalar(BOOMERANG_SPEED);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    // Update rotation
    rotationAngle.current += ROTATION_SPEED * delta;
    
    // Calculate position based on phase
    if (phase.current === 'outward') {
      // Add curved path during outward phase
      const curveOffset = perpendicular.clone().multiplyScalar(
        Math.sin(elapsed * Math.PI) * CURVE_STRENGTH
      );
      
      const movement = initialVelocity.clone()
        .multiplyScalar(delta)
        .add(curveOffset.multiplyScalar(delta));
      
      currentPosition.current.add(movement);
      
      // Check if it's time to return
      if (elapsed >= LIFETIME / 2) {
        phase.current = 'return';
      }
    } else {
      // Return phase - move towards return position
      const toReturn = returnPosition.clone()
        .sub(currentPosition.current)
        .normalize()
        .multiplyScalar(BOOMERANG_SPEED * RETURN_SPEED_MULTIPLIER * delta);
      
      currentPosition.current.add(toReturn);
      
      // Check if returned
      if (currentPosition.current.distanceTo(returnPosition) < 1) {
        onComplete();
        return;
      }
    }
    
    // Update boomerang position and rotation
    ref.current.setTranslation(currentPosition.current);
    const rotation = new Quaternion().setFromAxisAngle(direction, rotationAngle.current);
    ref.current.setRotation(rotation);
    
    // Check for enemies
    const enemiesGroup = state.scene.getObjectByName('enemies');
    if (enemiesGroup) {
      for (const enemy of enemiesGroup.children) {
        if (!hasHitEnemies.current.has(enemy.uuid) && 
            currentPosition.current.distanceTo(enemy.position) < 1.5) {
          
          // Apply damage and mark as hit
          if (enemy.userData?.takeDamage) {
            const knockbackDir = direction.clone().normalize();
            enemy.userData.takeDamage(BOOMERANG_DAMAGE, knockbackDir.multiplyScalar(5));
            hasHitEnemies.current.add(enemy.uuid);
          }
        }
      }
    }
    
    // Check lifetime
    if (elapsed > LIFETIME) {
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
      name="boomerang"
    >
      <group>
        <mesh castShadow>
          {/* Boomerang shape */}
          <torusGeometry args={[0.5, 0.1, 8, 4, Math.PI]} />
          <meshStandardMaterial color="#8B4513" metalness={0.6} roughness={0.2} />
        </mesh>
      </group>
    </RigidBody>
  );
}
