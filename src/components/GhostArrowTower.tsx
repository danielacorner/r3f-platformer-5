import { Vector3 } from 'three';

export function GhostArrowTower({ position }: { position: Vector3 }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 1]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.5} />
      </mesh>

      {/* Upper platform */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#A0522D" transparent opacity={0.5} />
      </mesh>

      {/* Arrow launcher */}
      <mesh position={[0, 1.2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4]} />
        <meshStandardMaterial color="#6B4423" transparent opacity={0.5} />
      </mesh>

      {/* Range indicator */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 15, 32]} />
        <meshBasicMaterial color="#8B4513" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
