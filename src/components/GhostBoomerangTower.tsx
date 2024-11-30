import { Vector3 } from 'three';

interface GhostBoomerangTowerProps {
  position: Vector3;
}

export function GhostBoomerangTower({ position }: GhostBoomerangTowerProps) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, 1, 8]} />
        <meshStandardMaterial color="#4a4a4a" transparent opacity={0.5} />
      </mesh>

      {/* Rotating turret */}
      <group position={[0, 1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#6a6a6a" transparent opacity={0.5} />
        </mesh>
        
        {/* Boomerang holder */}
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.5, 0.1, 8, 4, Math.PI]} />
          <meshStandardMaterial color="#8B4513" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}
