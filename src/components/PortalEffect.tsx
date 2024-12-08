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
  });

  return (
    <group position={position}>
      {/* Main portal disc */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
      >
        <planeGeometry args={[3, 3, 32, 32]} />
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

      {/* Outer glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Light source */}
      <pointLight
        color={color}
        intensity={2}
        distance={5}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}
