import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MeshBasicMaterial } from 'three';

interface ImpactRippleProps {
  position: Vector3;
}

export function ImpactRipple({ position }: ImpactRippleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const timeRef = useRef(0);
  const duration = 1;

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.transparent = true;
      materialRef.current.opacity = 0.8;
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    timeRef.current += delta;
    const progress = timeRef.current / duration;

    if (progress >= 1) {
      if (meshRef.current.parent) {
        meshRef.current.parent.remove(meshRef.current);
      }
      return;
    }

    // Scale up the ring
    const scale = 1 + progress * 2;
    meshRef.current.scale.set(scale, scale, scale);

    // Fade out
    materialRef.current.opacity = 0.8 * (1 - progress);
  });

  return (
    <mesh
      ref={meshRef}
      position={position.clone().add(new Vector3(0, 0.01, 0))}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0, 0.5, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={0x00ffff}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}