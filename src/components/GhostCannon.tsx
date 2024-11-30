import { Vector3 } from 'three';

export function GhostCannon({ position }: { position: Vector3 }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 1, 8]} />
        <meshStandardMaterial color="#666666" transparent opacity={0.5} />
      </mesh>
      {/* Cannon barrel */}
      <mesh position={[0, 1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.3, 0.4, 1.5, 8]} />
        <meshStandardMaterial color="#444444" transparent opacity={0.5} />
      </mesh>
      {/* Reinforcement rings */}
      {[0.2, 0.6, 1].map((pos, index) => (
        <mesh key={index} position={[0, 1, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <torusGeometry args={[0.4, 0.05, 8, 16]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
