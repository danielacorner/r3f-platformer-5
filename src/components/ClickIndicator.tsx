import { useEffect, useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface ClickIndicatorProps {
  position: Vector3;
  onComplete?: () => void;
}

export function ClickIndicator({ position, onComplete }: ClickIndicatorProps) {
  const ringRef = useRef<Mesh>(null);
  const cylinderRef = useRef<Mesh>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // Animation duration in milliseconds

  useFrame(() => {
    if (!ringRef.current || !cylinderRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Ring animation
    const ringScale = 1 + progress * 0.5; // Expand outward
    ringRef.current.scale.set(ringScale, ringScale, ringScale);
    if (ringRef.current.material) {
      (ringRef.current.material as any).opacity = 1 - progress;
    }

    // Cylinder animation
    const cylinderScale = 1 - progress * 0.5; // Contract inward
    const cylinderHeight = 2 * (1 - progress); // Shrink height
    cylinderRef.current.scale.set(cylinderScale, cylinderHeight, cylinderScale);
    if (cylinderRef.current.material) {
      (cylinderRef.current.material as any).opacity = 1 - progress;
    }

    // Cleanup when animation is complete
    if (progress === 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group position={position}>
      {/* Expanding ring on ground */}
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial
          color="#7e57c2"
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Rising cylinder effect */}
      <mesh ref={cylinderRef} position-y={1}>
        <cylinderGeometry args={[0.1, 0.2, 2, 16]} />
        <meshBasicMaterial
          color="#7e57c2"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Glow sphere at base */}
      <mesh position-y={0.1}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color="#7e57c2"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
