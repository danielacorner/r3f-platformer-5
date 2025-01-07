import { useRef, useMemo } from 'react';
import { Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, BufferGeometry, Float32BufferAttribute, DoubleSide, AdditiveBlending } from 'three';
import * as THREE from 'three';

interface LightningStormEffectProps {
  position: Vector3;
  radius: number;
  level: number;
  color: string;
}

export function LightningStormEffect({ position, radius, level, color }: LightningStormEffectProps) {
  const cloudRef = useRef<THREE.Group>();
  const rangeRef = useRef<THREE.Line>();
  const time = useRef(0);
  const lightningMaterial = useRef<THREE.ShaderMaterial>();

  // Create range indicator geometry
  const rangeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const segments = 64;
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

  // Lightning shader material
  const lightningShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(color) },
        intensity: { value: 1.0 }
      },
      vertexShader: \`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      \`,
      fragmentShader: \`
        uniform float time;
        uniform vec3 color;
        uniform float intensity;
        varying vec2 vUv;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float t = time * 2.0;
          
          // Create electric arcs
          float noise = random(uv + vec2(t));
          float lightning = step(0.97, noise);
          
          // Add glow
          float glow = smoothstep(1.0, 0.0, length(uv)) * 0.5;
          
          // Flicker effect
          float flicker = sin(time * 30.0) * 0.5 + 0.5;
          
          vec3 finalColor = color * (lightning + glow) * intensity * flicker;
          float alpha = (lightning + glow) * intensity;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      \`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }, [color]);

  useFrame((state, delta) => {
    time.current += delta;

    // Rotate cloud
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.2;
    }

    // Animate range indicator
    if (rangeRef.current) {
      rangeRef.current.material.dashOffset -= delta * 2;
    }

    // Update lightning shader
    if (lightningMaterial.current) {
      lightningMaterial.current.uniforms.time.value = time.current;
    }
  });

  return (
    <group position={position}>
      {/* Storm cloud */}
      <group ref={cloudRef} position={[0, 8, 0]}>
        <Cloud
          opacity={0.8}
          speed={0.4}
          width={10}
          depth={2.5}
          segments={20}
        >
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </Cloud>
      </group>

      {/* Electric effect */}
      <mesh position={[0, 8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <primitive object={lightningShader} ref={lightningMaterial} />
      </mesh>

      {/* Range indicator */}
      <line ref={rangeRef}>
        <primitive object={rangeGeometry} />
        <lineDashedMaterial
          color={color}
          scale={2}
          dashSize={5}
          gapSize={3}
          opacity={0.5}
          transparent
          fog={false}
        />
      </line>

      {/* Ambient light */}
      <pointLight
        color={color}
        intensity={2}
        distance={radius * 2}
        decay={2}
        position={[0, 8, 0]}
      />
    </group>
  );
}
