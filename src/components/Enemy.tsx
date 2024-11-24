import { useRef } from 'react';
import { Vector3 } from 'three';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

interface EnemyProps {
  position: Vector3;
  target: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, target, onDeath }: EnemyProps) {
  const rigidBodyRef = useRef<any>(null);
  const moveSpeed = 2;

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const currentPosition = rigidBodyRef.current.translation();
    const direction = new Vector3(
      target.x - currentPosition.x,
      0,
      target.z - currentPosition.z
    ).normalize();

    // Get current velocity
    const velocity = rigidBodyRef.current.linvel();

    // Apply horizontal movement while preserving vertical velocity
    rigidBodyRef.current.setLinvel(
      {
        x: direction.x * moveSpeed,
        y: velocity.y, // Preserve vertical velocity for gravity
        z: direction.z * moveSpeed
      },
      true
    );
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[position.x, position.y, position.z]}
      enabledRotations={[false, false, false]}
      lockRotations
      colliders="ball"
      mass={1}
      restitution={0.2}
      friction={1}
      linearDamping={0.5}
      gravityScale={1}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
}