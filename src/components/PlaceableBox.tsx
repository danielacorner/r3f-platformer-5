import { RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useState } from 'react';
import { useGameStore, ObjectType } from '../store/gameStore';
import { Tower } from './Tower';
import { Cannon } from './Cannon';

interface PlaceableBoxProps {
  position: [number, number, number];
  onRemove: () => void;
  objectType: ObjectType;
}

export function PlaceableBox({ position, onRemove, objectType }: PlaceableBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const phase = useGameStore(state => state.phase);

  const handleClick = () => {
    if (phase === 'prep') {
      onRemove();
    }
  };

  const renderObject = () => {
    switch (objectType) {
      case 'tower':
        return <Tower position={position} />;
      case 'cannon':
        return <Cannon position={position} />;
      default:
        return (
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
        );
    }
  };

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      userData={{ isPlaceableBox: true, objectType }}
    >
      {renderObject()}
    </RigidBody>
  );
}