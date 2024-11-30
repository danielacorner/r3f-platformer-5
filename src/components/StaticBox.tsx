import { RigidBody } from '@react-three/rapier';

interface StaticBoxProps {
  position: [number, number, number];
  dimensions?: [number, number, number];
  rotation?: number;
}

export function StaticBox({ position, dimensions = [1, 1, 1], rotation = 0 }: StaticBoxProps) {
  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      rotation={[0, rotation, 0]}
    >
      <mesh
        castShadow
        receiveShadow
        rotation={[0, rotation, 0]}
      >
        <boxGeometry args={dimensions} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}