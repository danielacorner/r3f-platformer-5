import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const ArcaneNovaShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.545, 0.361, 0.965),
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
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color;
    uniform float opacity;

    void main() {
      float dist = length(vPosition.xy);
      float ring = smoothstep(0.8, 0.85, dist) * smoothstep(1.0, 0.95, dist);
      float pulse = (sin(time * 5.0) * 0.5 + 0.5) * 0.5;
      
      vec3 finalColor = color * (1.0 + pulse);
      float finalAlpha = ring * opacity;
      
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
