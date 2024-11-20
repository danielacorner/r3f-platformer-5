import { RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';

interface StaticBoxProps {
  position: Vector3;
}

export function StaticBox({ position }: StaticBoxProps) {
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}