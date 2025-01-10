import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const ArcaneNovaShaderMaterial = shaderMaterial(
  {
    time: 0,
    progress: 0,
    color: new THREE.Color(0.3, 0.8, 1.0), // Ice blue
    color2: new THREE.Color(0.6, 0.9, 1.0), // Lighter ice blue
    scale: 1.0,
    opacity: 1.0
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float scale;
    uniform float time;
    uniform float progress;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Add crackling displacement
      float noiseTime = time * 8.0;
      float displacement = sin(position.x * 10.0 + noiseTime) * cos(position.z * 8.0 + noiseTime) * 0.02;
      vec3 newPosition = position + normal * displacement * scale;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform float progress;
    uniform vec3 color;
    uniform vec3 color2;
    uniform float opacity;

    // Fast noise function
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Electric noise
    float electric(vec2 uv, float t) {
      vec2 i = vec2(uv * 8.0);
      float noise1 = hash(i + t);
      float noise2 = hash(i * 1.7 + t * 1.1);
      return noise1 * noise2;
    }

    // Frost pattern
    float frost(vec2 uv, float scale) {
      vec2 i = uv * scale;
      float angle = atan(i.y, i.x);
      float len = length(i);
      return sin(len * 4.0 - angle * 3.0);
    }

    void main() {
      // Center UVs and calculate distance from center
      vec2 centeredUv = vUv * 2.0 - 1.0;
      float dist = length(centeredUv);
      
      // Calculate ring position based on progress
      float ringRadius = progress * 1.2; // Allow expansion beyond 1.0
      float ringWidth = 0.1;
      
      // Create expanding ring
      float ring = smoothstep(ringRadius - ringWidth, ringRadius, dist) * 
                  smoothstep(ringRadius + ringWidth, ringRadius, dist);
      
      // Add electric arcs
      float electricField = electric(centeredUv * 3.0, time * 4.0);
      float arcs = step(0.7, electricField) * ring;
      
      // Add frost patterns
      float frostPattern = frost(centeredUv * 10.0, 5.0);
      float frostMask = smoothstep(ringRadius + ringWidth, ringRadius, dist);
      float frost = (frostPattern * 0.5 + 0.5) * frostMask;
      
      // Add energy pulses
      float pulse = sin(dist * 20.0 - time * 8.0) * 0.5 + 0.5;
      float energyPulse = pulse * ring;
      
      // Combine effects
      vec3 ringColor = mix(color, color2, pulse);
      vec3 arcColor = vec3(0.9, 0.95, 1.0);
      
      vec3 finalColor = ringColor * ring +
                       arcColor * arcs +
                       color2 * frost * 0.5 +
                       color * energyPulse * 0.3;
                       
      // Calculate fade based on progress
      float fade = 1.0 - smoothstep(0.8, 1.0, progress);
      
      // Circular mask
      float circularMask = 1.0 - smoothstep(0.95, 1.0, dist);
      
      // Final alpha combines ring opacity, fade and circular mask
      float finalAlpha = (ring + frost * 0.3 + arcs * 0.5) * fade * opacity * circularMask;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      arcaneNovaShaderMaterial: any;
    }
  }
}
