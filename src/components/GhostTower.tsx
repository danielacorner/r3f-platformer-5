import { Vector3 } from 'three';

export function GhostTower({ position }: { position: Vector3 }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 2, 8]} />
        <meshStandardMaterial color="#666666" transparent opacity={0.5} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.7, 0.6, 0.4, 8]} />
        <meshStandardMaterial color="#666666" transparent opacity={0.5} />
      </mesh>
      {/* Arrow slots */}
      {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, index) => (
        <mesh key={index} position={[0, 2, 0]} rotation={[0, rotation, 0]}>
          <boxGeometry args={[0.2, 0.3, 1]} />
          <meshStandardMaterial color="#444444" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
