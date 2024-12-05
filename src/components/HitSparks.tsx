import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface HitSparksProps {
  position: THREE.Vector3;
  onComplete: () => void;
}

export function HitSparks({ position, onComplete }: HitSparksProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());
  const DURATION = 500; // Duration in milliseconds
  const NUM_PARTICLES = 20;

  // Create particles with initial positions and velocities
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(NUM_PARTICLES * 3);
    const velocities = new Float32Array(NUM_PARTICLES * 3);
    const colors = new Float32Array(NUM_PARTICLES * 3);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      // Random direction for each particle
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 3;

      // Convert spherical to cartesian coordinates for velocity
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed;
      const vz = Math.sin(phi) * Math.sin(theta) * speed;

      const idx = i * 3;
      // All particles start at the hit position
      positions[idx] = position.x;
      positions[idx + 1] = position.y;
      positions[idx + 2] = position.z;

      velocities[idx] = vx;
      velocities[idx + 1] = vy;
      velocities[idx + 2] = vz;

      // Orange-yellow color with slight variation
      colors[idx] = 1;  // R
      colors[idx + 1] = 0.5 + Math.random() * 0.3;  // G
      colors[idx + 2] = 0;  // B
    }

    return { positions, velocities, colors };
  }, [position]);

  // Animation loop
  useFrame(() => {
    if (!particlesRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / DURATION;

    if (progress >= 1) {
      onComplete();
      return;
    }

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Update each particle position
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const idx = i * 3;
      positions[idx] += velocities[idx] * 0.016; // Apply velocity (assuming 60fps)
      positions[idx + 1] += velocities[idx + 1] * 0.016;
      positions[idx + 2] += velocities[idx + 2] * 0.016;

      // Add gravity effect
      velocities[idx + 1] -= 9.8 * 0.016;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={NUM_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={NUM_PARTICLES}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
