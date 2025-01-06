import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const ArcaneNovaShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.5, 0.3, 0.9),
    scale: 1.0,
    opacity: 1.0
  },
  // Vertex shader - Handles geometry transformations
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float scale;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vec3 pos = position;
      pos.xy *= scale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader - Handles the visual effects
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color;
    uniform float opacity;

    // Efficient hash function for randomness
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Optimized smooth noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f); // Smoother interpolation
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      // Calculate distance from center
      float dist = length(vPosition.xy);
      
      // Create main ring effect
      float ring = smoothstep(0.8, 0.85, dist) * smoothstep(1.0, 0.95, dist);
      
      // Create energy pattern
      float angle = atan(vPosition.y, vPosition.x);
      float pattern = sin(angle * 8.0 + time * 4.0) * 0.5 + 0.5;
      
      // Add noise-based detail
      vec2 noiseCoord = vUv * 4.0 + time * 0.5;
      float noisePattern = noise(noiseCoord) * 0.3 + 0.7;
      pattern *= noisePattern;
      
      // Inner glow
      float innerGlow = smoothstep(0.7, 0.0, dist) * 0.5;
      
      // Edge glow
      float edgeGlow = exp(-2.0 * abs(dist - 0.9));
      
      // Combine effects
      float finalAlpha = (ring * pattern + innerGlow + edgeGlow * 0.3) * opacity;
      vec3 finalColor = mix(color * 0.5, color, pattern);
      
      // Add subtle color variation
      finalColor += vec3(0.1, 0.05, 0.2) * edgeGlow;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
);

// Add type declaration for the shader material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      arcaneNovaShaderMaterial: any;
    }
  }
}
