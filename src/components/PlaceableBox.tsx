import { RigidBody } from '@react-three/rapier';
import { useState } from 'react';
import { useGameStore, ElementType } from '../store/gameStore';
import { Tower } from './Tower';
import { Cannon } from './Cannon';
import { BoomerangTower } from './BoomerangTower';

interface PlaceableBoxProps {
  position: [number, number, number];
  onRemove: () => void;
  objectType: ElementType;
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
    // All tower types are ElementTypes, so we can pass them directly
    return <Tower position={position} type={objectType} />;
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