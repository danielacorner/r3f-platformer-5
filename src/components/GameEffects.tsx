import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud } from '@react-three/drei';
import { Vector3, Color, BufferGeometry, Float32BufferAttribute, DoubleSide, AdditiveBlending } from 'three';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function GameEffects() {
  const effects = useGameStore(state => state.effects);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta;
  });

  return (
    <group>
      {effects.map(effect => {
        if (effect.type === 'lightningStorm') {
          return (
            <group key={effect.id} position={effect.position.toArray()}>
              {/* Storm cloud */}
              <group position={[0, 8, 0]}>
                <Cloud
                  opacity={0.8}
                  speed={0.4}
                  width={10}
                  depth={2.5}
                  segments={20}
                >
                  <meshStandardMaterial 
                    color={effect.color} 
                    emissive={effect.color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.6}
                  />
                </Cloud>
              </group>

              {/* Electric effect */}
              <mesh position={[0, 8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[effect.radius * 2, effect.radius * 2]} />
                <shaderMaterial
                  transparent
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  uniforms={{
                    time: { value: time.current },
                    color: { value: new Color(effect.color) },
                    intensity: { value: 1.0 }
                  }}
                  vertexShader={\`
                    varying vec2 vUv;
                    void main() {
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  \`}
                  fragmentShader={\`
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
                  \`}
                />
              </mesh>

              {/* Range indicator */}
              <line>
                <bufferGeometry>
                  <float32BufferAttribute
                    attach="attributes-position"
                    array={(() => {
                      const positions = [];
                      const segments = 64;
                      for (let i = 0; i <= segments; i++) {
                        const theta = (i / segments) * Math.PI * 2;
                        positions.push(
                          Math.cos(theta) * effect.radius,
                          0.1,
                          Math.sin(theta) * effect.radius
                        );
                      }
                      return new Float32Array(positions);
                    })()}
                    count={65}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineDashedMaterial
                  color={effect.color}
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
                color={effect.color}
                intensity={2}
                distance={effect.radius * 2}
                decay={2}
                position={[0, 8, 0]}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}
