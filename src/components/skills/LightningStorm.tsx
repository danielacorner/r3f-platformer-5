import { useRef, memo, useMemo } from 'react';
import { Vector3, Float32BufferAttribute } from 'three';
import { LightningStormShaderMaterial } from './SkillEffects/shaders/LightningStormShader';
import { extend } from '@react-three/fiber';

extend({ LightningStormShaderMaterial });

interface LightningStormProps {
  position: Vector3;
  radius: number;
  level: number;
}

export const MemoizedStorm = memo(function LightningStorm({ position, radius, level }: LightningStormProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>();
  const lightRef = useRef<THREE.PointLight>();

  // Create range indicator
  const rangeIndicator = useRef();
  const segments = 64;
  const rangeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        0.1, // Slightly above ground
        Math.sin(theta) * radius
      );
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [radius]);

  return (
    <group position={position}>

      {/* Electric effect overlay */}
      <mesh>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <lightningStormShaderMaterial
          ref={shaderRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ambient light */}
      <pointLight
        ref={lightRef}
        color="#7c3aed"
        intensity={2}
        distance={radius * 2}
        decay={2}
      />

      {/* Range indicator */}
      <line ref={rangeIndicator}>
        <primitive object={rangeGeometry} />
        <lineDashedMaterial
          color="#7c3aed"
          scale={2} // Dash size
          dashSize={5}
          gapSize={3}
          opacity={0.5}
          transparent
          fog={false}
        />
      </line>
    </group>
  );
}
);
