import { useRef, useEffect } from 'react';
import { Vector3, BufferGeometry, Line, LineBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

const TRAIL_LENGTH = 20;
const TRAIL_OPACITY_DECAY = 0.95;

interface OrbTrailProps {
  isAttacking: boolean;
}

export function OrbTrail({ isAttacking }: OrbTrailProps) {
  const points = useRef<Vector3[]>([]);
  const geometryRef = useRef<BufferGeometry>();
  const materialRef = useRef<LineBasicMaterial>();
  const opacityRef = useRef(1);

  useEffect(() => {
    if (isAttacking) {
      opacityRef.current = 1;
    }
  }, [isAttacking]);

  useFrame(() => {
    if (!geometryRef.current || !materialRef.current) return;

    if (isAttacking) {
      // Keep trail at full opacity during attack
      materialRef.current.opacity = 1;
    } else {
      // Fade out trail when not attacking
      opacityRef.current *= TRAIL_OPACITY_DECAY;
      materialRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <line>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial
        ref={materialRef}
        color="#7e57c2"
        transparent
        opacity={1}
        linewidth={2}
      />
    </line>
  );
}
