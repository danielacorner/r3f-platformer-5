import { RigidBody } from '@react-three/rapier';
import { Vector3, Object3D } from 'three';
import { useState } from 'react';

interface PlaceableBoxProps {
  position: Vector3;
  onRemove: () => void;
}

export function PlaceableBox({ position, onRemove }: PlaceableBoxProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <RigidBody 
      type="fixed" 
      position={position}
      colliders="cuboid"
      userData={{ isPlaceableBox: true }}
    >
      <mesh
        name="placed-box"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onClick={onRemove}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={isHovered ? "red" : "orange"} />
      </mesh>
    </RigidBody>
  );
}