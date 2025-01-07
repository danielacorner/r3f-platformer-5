import { useRef, useEffect } from 'react';
import { Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';
import { LightningStormShaderMaterial } from './SkillEffects/shaders/LightningStormShader';
import { extend } from '@react-three/fiber';

extend({ LightningStormShaderMaterial });

interface LightningStormProps {
  position: Vector3;
  radius: number;
  level: number;
}

export function LightningStorm({ position, radius, level }: LightningStormProps) {
  const cloudRef = useRef();
  const shaderRef = useRef();
  const lightRef = useRef();
  const time = useRef(0);

  // Create range indicator
  const rangeIndicator = useRef();
  const segments = 64;
  const rangeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        0.1, // Slightly above ground
        Math.sin(theta) * radius
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [radius]);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      time.current += delta;
      shaderRef.current.uniforms.time.value = time.current;
      
      // Animate cloud rotation
      if (cloudRef.current) {
        cloudRef.current.rotation.y += delta * 0.2;
      }

      // Animate range indicator
      if (rangeIndicator.current) {
        rangeIndicator.current.material.dashOffset -= delta * 2;
      }
    }
  });

  return (
    <group position={position}>
      {/* Storm cloud */}
      <Cloud
        ref={cloudRef}
        opacity={0.5}
        speed={0.4} // Rotation speed
        width={10}
        depth={2.5}
        segments={20}
      >
        <meshStandardMaterial
          ref={shaderRef}
          transparent
          opacity={0.6}
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.5}
        />
      </Cloud>

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
