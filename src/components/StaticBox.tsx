import { RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';

interface StaticBoxProps {
  position: [number, number, number];
  dimensions?: [number, number, number];
  rotation?: number;
}

export function StaticBox({ position, dimensions = [1, 1, 1], rotation = 0 }: StaticBoxProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}