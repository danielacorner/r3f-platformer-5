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
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';

interface StormBoltProps {
  startPosition: Vector3;
  endPosition: Vector3;
  onComplete?: () => void;
}

const COLORS = {
  bolt: new Color('#60a5fa').multiplyScalar(0.5), // Dimmer blue
  sparks: new Color('#93c5fd').multiplyScalar(0.3), // Even dimmer light blue
};

const SPARK_COUNT = 15; // Fewer sparks than levelup effect
const DURATION = 200; // Shorter duration

export function StormBolt({ startPosition, endPosition, onComplete }: StormBoltProps) {
  const groupRef = useRef<Group>(null);
  const boltRef = useRef<Mesh>(null);
  const sparksRef = useRef<Points>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!groupRef.current) return;

    // Create main bolt
    const height = startPosition.distanceTo(endPosition);
    const direction = endPosition.clone().sub(startPosition).normalize();

    // Simple cylinder for the main bolt
    const boltGeometry = new CylinderGeometry(0.02, 0.05, height, 4);
    const boltMaterial = new MeshBasicMaterial({
      color: COLORS.bolt,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
    });

    const bolt = new Mesh(boltGeometry, boltMaterial);
    bolt.position.copy(startPosition);
    bolt.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
    boltRef.current = bolt;
    groupRef.current.add(bolt);

    // Create spark particles
    const sparksGeometry = new BufferGeometry();
    const positions = new Float32Array(SPARK_COUNT * 3);
    const velocities = new Float32Array(SPARK_COUNT * 3);

    // Distribute sparks along the bolt
    for (let i = 0; i < SPARK_COUNT; i++) {
      const t = i / SPARK_COUNT;
      const pos = startPosition.clone().lerp(endPosition, t);
      const offset = 0.1;
      
      positions[i * 3] = pos.x + (Math.random() - 0.5) * offset;
      positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * offset;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * offset;

      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    sparksGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    sparksGeometry.setAttribute('velocity', new Float32BufferAttribute(velocities, 3));

    const sparksMaterial = new PointsMaterial({
      color: COLORS.sparks,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });

    const sparks = new Points(sparksGeometry, sparksMaterial);
    sparksRef.current = sparks;
    groupRef.current.add(sparks);

    return () => {
      boltGeometry.dispose();
      boltMaterial.dispose();
      sparksGeometry.dispose();
      sparksMaterial.dispose();
      if (bolt.parent) bolt.parent.remove(bolt);
      if (sparks.parent) sparks.parent.remove(sparks);
    };
  }, [startPosition, endPosition]);

  useFrame((_, delta) => {
    if (!boltRef.current || !sparksRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / DURATION, 1);

    // Update bolt
    if (boltRef.current.material) {
      const mat = boltRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.6 * (1 - progress);
    }

    // Update sparks
    if (sparksRef.current.geometry && sparksRef.current.material) {
      const positions = sparksRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = sparksRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * delta * 10;
        positions[i + 1] += velocities[i + 1] * delta * 10;
        positions[i + 2] += velocities[i + 2] * delta * 10;
      }

      sparksRef.current.geometry.attributes.position.needsUpdate = true;
      (sparksRef.current.material as PointsMaterial).opacity = 0.8 * (1 - progress);
    }

    if (progress >= 1 && onComplete) {
      onComplete();
    }
  });

  return <group ref={groupRef} />;
}
