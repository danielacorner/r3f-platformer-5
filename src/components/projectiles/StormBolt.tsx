import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  Vector3,
  Group,
  Color,
  CylinderGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
} from 'three';

interface StormBoltProps {
  startPosition: Vector3;
  endPosition: Vector3;
  onComplete?: () => void;
}

const COLORS = {
  bolt: new Color('#93c5fd').multiplyScalar(0.4), // Dimmer light blue
};

const DURATION = 150; // Very short duration

export function StormBolt({ startPosition, endPosition, onComplete }: StormBoltProps) {
  const groupRef = useRef<Group>(null);
  const boltRef = useRef<Mesh>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!groupRef.current) return;

    const height = startPosition.distanceTo(endPosition);
    const direction = endPosition.clone().sub(startPosition).normalize();

    // Create simple bolt geometry
    const boltGeometry = new CylinderGeometry(0.02, 0.04, height, 4);
    const boltMaterial = new MeshBasicMaterial({
      color: COLORS.bolt,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
    });

    const bolt = new Mesh(boltGeometry, boltMaterial);
    bolt.position.copy(startPosition);
    bolt.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
    boltRef.current = bolt;
    groupRef.current.add(bolt);

    return () => {
      boltGeometry.dispose();
      boltMaterial.dispose();
      if (bolt.parent) bolt.parent.remove(bolt);
    };
  }, [startPosition, endPosition]);

  useFrame(() => {
    if (!boltRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / DURATION, 1);

    // Update opacity and add slight jitter
    if (boltRef.current.material) {
      const mat = boltRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.5 * (1 - progress);

      // Very subtle jitter
      boltRef.current.position.x = startPosition.x + (Math.random() - 0.5) * 0.01;
      boltRef.current.position.z = startPosition.z + (Math.random() - 0.5) * 0.01;
    }

    if (progress >= 1 && onComplete) {
      onComplete();
    }
  });

  return <group ref={groupRef} />;
}
