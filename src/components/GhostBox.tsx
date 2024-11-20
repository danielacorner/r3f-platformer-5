import { Vector3, BoxGeometry } from 'three';

interface GhostBoxProps {
  position: Vector3;
  isRemoveMode: boolean;
}

export function GhostBox({ position, isRemoveMode }: GhostBoxProps) {
  const color = isRemoveMode ? "#ff0000" : "#00ff00";
  
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(1.01, 1.01, 1.01)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </mesh>
  );
}