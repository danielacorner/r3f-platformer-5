import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  Vector3,
  Group,
  Color,
  CylinderGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  SphereGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';

interface LevelUpEffectProps {
  onComplete: () => void;
}

const COLORS = {
  primary: new Color('#60a5fa'),
  secondary: new Color('#3b82f6'),
  accent: new Color('#93c5fd'),
};

const SCALE = 1.5;
const SPARK_COUNT = 50;
const LIGHTNING_SEGMENTS = 8;

export function LevelUpEffect({ onComplete }: LevelUpEffectProps) {
  const groupRef = useRef<Group>(null);
  const lightningRef = useRef<Mesh[]>([]);
  const sparksRef = useRef<Points>(null);
  const startTime = useRef(Date.now());
  const duration = 1500;

  // Create lightning bolt geometry
  const lightningGeometry = useMemo(() => {
    const geometry = new CylinderGeometry(0.02, 0.05, 2, 6, LIGHTNING_SEGMENTS);
    // Randomize vertices for jagged effect
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 3; i < positions.length - 3; i += 3) {
      positions[i] += (Math.random() - 0.5) * 0.1;
      positions[i + 2] += (Math.random() - 0.5) * 0.1;
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Create sparks geometry
  const sparksGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(SPARK_COUNT * 3);
    const velocities = new Float32Array(SPARK_COUNT * 3);
    const colors = new Float32Array(SPARK_COUNT * 3);

    for (let i = 0; i < SPARK_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 0.1 + Math.random() * 0.2;

      // Random position in sphere
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

      // Random velocity
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = Math.random() * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Color gradient
      const color = COLORS.accent.clone().lerp(COLORS.primary, Math.random());
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new Float32BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    return geometry;
  }, []);

  useEffect(() => {
    // Create lightning bolts
    lightningRef.current = Array(3).fill(null).map((_, i) => {
      const mesh = new Mesh(
        lightningGeometry,
        new MeshBasicMaterial({
          color: COLORS.primary,
          transparent: true,
          opacity: 0.8,
          blending: AdditiveBlending,
        })
      );
      const angle = (i / 3) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * 0.5,
        1,
        Math.sin(angle) * 0.5
      );
      mesh.rotation.x = Math.PI;
      mesh.rotation.y = angle;
      groupRef.current?.add(mesh);
      return mesh;
    });

    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timer);
      lightningRef.current.forEach(mesh => {
        mesh.parent?.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as MeshBasicMaterial).dispose();
      });
    };
  }, [lightningGeometry, onComplete]);

  useFrame((_, delta) => {
    if (!groupRef.current || !sparksRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Update lightning
    lightningRef.current.forEach((lightning, i) => {
      if (lightning && lightning.material) {
        const mat = lightning.material as MeshBasicMaterial;
        mat.opacity = Math.max(0, 1 - progress * 2);
        
        // Add some movement to lightning
        lightning.scale.x = 1 + Math.sin(elapsed * 0.01 + i) * 0.2;
        lightning.scale.z = 1 + Math.cos(elapsed * 0.01 + i) * 0.2;
      }
    });

    // Update sparks
    if (sparksRef.current && progress < 0.8) {
      const positions = sparksRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = sparksRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * delta;
        positions[i + 1] += velocities[i + 1] * delta;
        positions[i + 2] += velocities[i + 2] * delta;

        // Add gravity effect
        velocities[i + 1] -= delta * 2;
      }

      sparksRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Scale and rotate the entire effect
    const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
    groupRef.current.scale.setScalar(scale * SCALE);
    groupRef.current.rotation.y += delta * 2;
  });

  return (
    <group ref={groupRef}>
      {/* Core energy sphere */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={COLORS.primary}
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Energy rings */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2, 0, i * Math.PI / 4]}
          position={[0, i * 0.1, 0]}
        >
          <torusGeometry args={[0.3 + i * 0.1, 0.02, 16, 32]} />
          <meshBasicMaterial
            color={COLORS.secondary}
            transparent
            opacity={0.6}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Spark particles */}
      <points ref={sparksRef}>
        <primitive object={sparksGeometry} attach="geometry" />
        <pointsMaterial
          size={0.03}
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
          vertexColors
        />
      </points>

      {/* Ambient light for overall glow */}
      <pointLight color={COLORS.primary} intensity={2} distance={3} />
      <pointLight
        color={COLORS.accent}
        intensity={1}
        distance={2}
        position={[0, 1, 0]}
      />
    </group>
  );
}
