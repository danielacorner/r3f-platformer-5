import { Vector3, BoxGeometry } from 'three';
import { ObjectType } from '../store/gameStore';

interface GhostBoxProps {
  position: Vector3;
  isRemoveMode: boolean;
  objectType: ObjectType;
}

export function GhostBox({ position, isRemoveMode, objectType }: GhostBoxProps) {
  const color = isRemoveMode ? "#ff0000" : "#00ff00";
  
  const getObjectGeometry = () => {
    switch (objectType) {
      case 'tower':
        return [0.8, 2, 0.8] as [number, number, number];
      case 'cannon':
        return [1.2, 1, 1.2] as [number, number, number];
      default:
        return [1, 1, 1] as [number, number, number];
    }
  };

  const dimensions = getObjectGeometry();

  return (
    <mesh position={position}>
      <boxGeometry args={dimensions} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(...dimensions)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </mesh>
  );
}