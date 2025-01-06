import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const ArcaneNovaShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.5, 0.3, 0.9),
    scale: 1.0,
    opacity: 1.0
  },
  // Vertex shader
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
  // Fragment shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color;
    uniform float opacity;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      float dist = length(vPosition.xy);
      
      // Stronger ring effect
      float ring = smoothstep(0.8, 0.85, dist) * smoothstep(1.0, 0.95, dist) * 2.0;
      
      // More pronounced energy pattern
      float angle = atan(vPosition.y, vPosition.x);
      float pattern = sin(angle * 12.0 + time * 6.0) * 0.5 + 0.5;
      
      // Enhanced noise effect
      vec2 noiseCoord = vUv * 6.0 + time * 0.8;
      float noisePattern = noise(noiseCoord) * 0.5 + 0.5;
      pattern *= noisePattern;
      
      // Stronger glow effects
      float innerGlow = smoothstep(0.7, 0.0, dist) * 0.8;
      float edgeGlow = exp(-1.5 * abs(dist - 0.9)) * 1.5;
      
      // Combine effects with higher intensity
      float finalAlpha = (ring * pattern + innerGlow + edgeGlow * 0.5) * opacity;
      vec3 finalColor = mix(color * 0.8, color * 1.2, pattern);
      finalColor += vec3(0.2, 0.1, 0.3) * edgeGlow;
      
      // Boost overall brightness
      finalColor *= 1.5;
      finalAlpha = min(finalAlpha * 1.2, 1.0);
      
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
