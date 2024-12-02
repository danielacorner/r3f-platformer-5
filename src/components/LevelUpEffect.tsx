import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Group, AdditiveBlending } from 'three';
import { Trail } from '@react-three/drei';

interface LevelUpEffectProps {
  onComplete: () => void;
}

export function LevelUpEffect({ onComplete }: LevelUpEffectProps) {
  const groupRef = useRef<Group>(null);
  const ringsRef = useRef<Mesh[]>([]);
  const startTime = useRef(Date.now());
  const duration = 1500; // Animation duration in ms

  useEffect(() => {
    ringsRef.current = [];
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Rotate and scale the entire effect
    groupRef.current.rotation.y += 0.05;
    const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
    groupRef.current.scale.setScalar(scale);

    // Update each ring
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        // Move rings upward
        ring.position.y = i * 0.2 + progress * 2;
        
        // Expand rings outward
        const ringScale = 1 + progress * (i + 1) * 0.5;
        ring.scale.set(ringScale, ringScale, ringScale);
        
        // Fade out rings
        if (ring.material) {
          (ring.material as any).opacity = Math.max(0, 1 - progress);
        }
      }
    });
  });

  return (
    <group ref={groupRef} scale={2}>
      {/* Rising rings */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          ref={(ref) => {
            if (ref) ringsRef.current[i] = ref;
          }}
          position={[0, i * 0.2, 0]}
        >
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.8}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Central beam */}
      <Trail
        width={0.8}
        length={4}
        color="#60a5fa"
        attenuation={(t) => t * 0.5}
        decay={0.1}
      >
        <mesh>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
        </mesh>
      </Trail>

      {/* Sparkles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.5;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              0.5,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial
              color="#93c5fd"
              transparent
              opacity={0.8}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}

      {/* Point lights for extra glow */}
      <pointLight color="#60a5fa" intensity={2} distance={3} />
      <pointLight color="#93c5fd" intensity={1} distance={2} position={[0, 1, 0]} />
    </group>
  );
}
