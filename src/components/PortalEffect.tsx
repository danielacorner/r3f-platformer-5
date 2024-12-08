import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const portalVertexShader = `
varying vec2 vUv;
varying float vTime;
uniform float time;

void main() {
  vUv = uv;
  vTime = time;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portalFragmentShader = `
varying vec2 vUv;
varying float vTime;
uniform vec3 color;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float dist = length(uv);
  float ripple = sin(dist * 10.0 - vTime * 2.0) * 0.5 + 0.5;
  float circle = smoothstep(1.0, 0.8, dist);
  float alpha = circle * (0.5 + ripple * 0.5);
  
  // Add swirling effect
  float angle = atan(uv.y, uv.x);
  float spiral = sin(angle * 4.0 + vTime * 3.0 + dist * 5.0) * 0.5 + 0.5;
  
  vec3 finalColor = mix(color, vec3(1.0), spiral * 0.3);
  gl_FragColor = vec4(finalColor, alpha * smoothstep(1.0, 0.5, dist));
}
`;

export function PortalEffect({ position, color = new THREE.Color("#4a9eff") }) {
  const meshRef = useRef<THREE.Mesh>();
  const materialRef = useRef<THREE.ShaderMaterial>();
  const portalSize = 5; // Increased size
  const portalHeight = 3; // Added height for 3D effect

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color: { value: color },
    }),
    [color]
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
    }
    // Rotate the portal slowly
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[portalSize * 1.5, portalSize * 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical portal ring */}
      <mesh position={[0, portalHeight/2, 0]}>
        <torusGeometry args={[portalSize/2, 0.3, 16, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Main portal disc */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
      >
        <planeGeometry args={[portalSize, portalSize, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={portalVertexShader}
          fragmentShader={portalFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical energy beams */}
      <mesh position={[0, portalHeight/2, 0]}>
        <cylinderGeometry args={[portalSize/2.2, portalSize/2.2, portalHeight, 32, 4, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Light sources */}
      <pointLight
        color={color}
        intensity={3}
        distance={8}
        position={[0, portalHeight/2, 0]}
      />
      <pointLight
        color={color}
        intensity={2}
        distance={6}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}
