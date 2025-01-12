import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Constants for performance
const MAX_ACTIVE_EFFECTS = 50;  // Maximum number of simultaneous hit effects
const PARTICLES_PER_EFFECT = 8; // Reduced from original 20 for performance
const TOTAL_PARTICLES = MAX_ACTIVE_EFFECTS * PARTICLES_PER_EFFECT;
const EFFECT_DURATION = 400; // Duration in milliseconds
const PARTICLE_SIZE = 0.08;

interface HitEffect {
  startTime: number;
  baseIndex: number;
  position: THREE.Vector3;
}

export function MissileHitEffects() {
  const particlesRef = useRef<THREE.Points>(null);
  const activeEffects = useRef<HitEffect[]>([]);
  const nextEffectIndex = useRef(0);

  // Create shared geometry for all particles
  const { positions, velocities, colors, geometry } = useMemo(() => {
    const positions = new Float32Array(TOTAL_PARTICLES * 3);
    const velocities = new Float32Array(TOTAL_PARTICLES * 3);
    const colors = new Float32Array(TOTAL_PARTICLES * 3);
    const geometry = new THREE.BufferGeometry();

    // Initialize all particles at origin with zero velocity
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const idx = i * 3;
      positions[idx] = 0;
      positions[idx + 1] = 0;
      positions[idx + 2] = 0;

      // Light blue color with slight variation
      colors[idx] = 0.42;     // R
      colors[idx + 1] = 0.72; // G
      colors[idx + 2] = 0.78; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { positions, velocities, colors, geometry };
  }, []);

  // Function to spawn a new hit effect
  const spawnEffect = (position: THREE.Vector3) => {
    const baseIndex = (nextEffectIndex.current * PARTICLES_PER_EFFECT) % TOTAL_PARTICLES;
    nextEffectIndex.current = (nextEffectIndex.current + 1) % MAX_ACTIVE_EFFECTS;

    // Initialize particles for this effect
    for (let i = 0; i < PARTICLES_PER_EFFECT; i++) {
      const idx = (baseIndex + i) * 3;

      // Set position
      positions[idx] = position.x;
      positions[idx + 1] = position.y;
      positions[idx + 2] = position.z;

      // Random direction for each particle
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1.5 + Math.random() * 2;

      // Convert spherical to cartesian coordinates for velocity
      velocities[idx] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[idx + 1] = Math.cos(phi) * speed;
      velocities[idx + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    // Add to active effects
    activeEffects.current.push({
      startTime: Date.now(),
      baseIndex,
      position: position.clone()
    });
  };

  // Animation loop
  useFrame((_, delta) => {
    if (!particlesRef.current) return;

    const now = Date.now();
    const positionAttr = particlesRef.current.geometry.attributes.position;
    const positions = positionAttr.array as Float32Array;

    // Update and filter active effects
    activeEffects.current = activeEffects.current.filter(effect => {
      const elapsed = now - effect.startTime;
      if (elapsed >= EFFECT_DURATION) return false;

      const progress = elapsed / EFFECT_DURATION;
      const fadeOut = 1 - progress;

      // Update particles for this effect
      for (let i = 0; i < PARTICLES_PER_EFFECT; i++) {
        const idx = (effect.baseIndex + i) * 3;

        // Update position based on velocity
        positions[idx] += velocities[idx] * delta;
        positions[idx + 1] += velocities[idx + 1] * delta;
        positions[idx + 2] += velocities[idx + 2] * delta;

        // Apply gravity
        velocities[idx + 1] -= 9.8 * delta;
      }

      return true;
    });

    positionAttr.needsUpdate = true;
  });

  // Expose the spawn function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).spawnMissileHitEffect = spawnEffect;
    }
  }, []);

  return (
    <points ref={particlesRef}>
      <primitive object={geometry} />
      <pointsMaterial
        size={PARTICLE_SIZE}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
