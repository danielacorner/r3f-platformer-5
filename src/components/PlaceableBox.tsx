import { RigidBody } from '@react-three/rapier';
import { Vector3, Object3D } from 'three';
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface PlaceableBoxProps {
  position: [number, number, number];
  onRemove: () => void;
}

export function PlaceableBox({ position, onRemove }: PlaceableBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const phase = useGameStore(state => state.phase);

  const handleClick = () => {
    if (phase === 'prep') {
      onRemove();
    }
  };

  return (
    <RigidBody 
      type="fixed" 
      position={position}
      colliders="cuboid"
      userData={{ isPlaceableBox: true }}
    >
      <mesh
        name="placed-box"
        onPointerEnter={() => phase === 'prep' && setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onClick={handleClick}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={isHovered && phase === 'prep' ? "red" : "orange"} />
      </mesh>
    </RigidBody>
  );
}