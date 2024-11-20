import { RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';
import { ThreeEvent } from '@react-three/fiber';

interface PlaceableBoxProps {
  position: Vector3;
  onRemove: () => void;
}

export function PlaceableBox({ position, onRemove }: PlaceableBoxProps) {
  const phase = useGameStore(state => state.phase);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (phase === 'prep') {
      e.stopPropagation();
      onRemove();
    }
  };

  return (
    <RigidBody type={phase === 'prep' ? 'fixed' : 'dynamic'} position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={(e) => {
          if (phase === 'prep') {
            e.stopPropagation();
          }
        }}
        userData={{ isPlaceableBox: true }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </RigidBody>
  );
}