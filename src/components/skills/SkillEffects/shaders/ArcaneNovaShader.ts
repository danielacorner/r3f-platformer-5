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

    // Electric noise with more static-like appearance
    float electric(vec2 uv, float t) {
      vec2 i = vec2(uv * 8.0);
      float noise1 = hash(i + t);
      float noise2 = hash(i * 1.7 + t * 1.1);
      return noise1 * noise2;
    }

    // Static electricity pattern
    float staticPattern(vec2 uv, float t, float scale) {
      // Create multiple layers of noise
      float noise1 = electric(uv * scale, t);
      float noise2 = electric(uv * scale * 2.0 + 1.234, t * 1.5);
      float noise3 = electric(uv * scale * 4.0 + 2.456, t * 2.0);
      
      // Combine layers with different weights
      return noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    }

    void main() {
      // Center UVs and calculate distance from center
      vec2 centeredUv = vUv * 2.0 - 1.0;
      float dist = length(centeredUv);
      
      // Balanced explosive expansion
      float explosiveProgress = log(1.0 + progress * 12.0) / log(13.0);
      float ringRadius = explosiveProgress * 1.2;
      
      // Dynamic ring width that starts narrow and expands moderately
      float ringWidth = 0.06 + explosiveProgress * 0.06;
      
      // Create expanding ring with moderately sharp leading edge
      float ring = smoothstep(ringRadius - ringWidth, ringRadius - ringWidth * 0.4, dist) * 
                  smoothstep(ringRadius + ringWidth * 0.4, ringRadius, dist);
      
      // Create static electricity effect that follows the ring
      float staticScale = 8.0 + explosiveProgress * 4.0;
      float staticTime = time * 8.0;
      float staticNoise = staticPattern(centeredUv, staticTime, staticScale);
      
      // Create electric arcs that follow the ring
      float arcWidth = ringWidth * 1.5;
      float arcMask = smoothstep(ringRadius - arcWidth, ringRadius + arcWidth, dist);
      float arcs = step(0.7, staticNoise) * (1.0 - arcMask) * 
                  smoothstep(ringRadius + arcWidth, ringRadius - arcWidth, dist);
      
      // Add crackling effect around the ring
      float crackleScale = 15.0 + explosiveProgress * 10.0;
      float crackleTime = time * 10.0;
      float crackle = staticPattern(centeredUv, crackleTime, crackleScale);
      float crackleMask = smoothstep(ringRadius + ringWidth * 2.0, ringRadius - ringWidth * 2.0, dist);
      float crackleEffect = step(0.8, crackle) * crackleMask * (1.0 - explosiveProgress * 0.5);
      
      // Add energy pulses that follow the static
      float pulseSpeed = 25.0 - explosiveProgress * 15.0;
      float pulseTime = time * 8.0 - dist * pulseSpeed;
      float pulse = sin(pulseTime) * 0.5 + 0.5;
      float energyPulse = pulse * ring * pow(1.0 - explosiveProgress * 0.6, 1.5);
      
      // Initial burst flash concentrated at center
      float centerRadius = 0.2;
      float initialBurst = smoothstep(0.0, 0.15, explosiveProgress) * (1.0 - explosiveProgress);
      float centerFlash = smoothstep(centerRadius, 0.0, dist) * initialBurst * 2.0;
      
      // Color mixing
      vec3 ringColor = mix(color, color2, pulse);
      vec3 arcColor = vec3(0.92, 0.96, 1.0);
      vec3 energyColor = mix(color2, arcColor, energyPulse);
      vec3 flashColor = mix(arcColor, color2, 0.3);
      vec3 staticColor = mix(arcColor, color2, staticNoise);
      
      // Combine effects with static electricity
      vec3 finalColor = ringColor * ring +
                       arcColor * (arcs * 0.8 + crackleEffect * 0.6) +
                       staticColor * staticNoise * ring * 0.4 +
                       energyColor * energyPulse * 0.4 +
                       flashColor * centerFlash;
                       
      // Balanced fade timing
      float fade = 1.0 - smoothstep(0.65, 1.0, progress);
      
      // Circular mask
      float maskRadius = 0.95;
      float circularMask = 1.0 - smoothstep(maskRadius - 0.05, maskRadius, dist);
      
      // Combine everything with static-focused intensity
      float finalAlpha = (ring * (1.0 - explosiveProgress * 0.25) +
                         arcs * 0.7 +
                         crackleEffect * 0.5 +
                         staticNoise * ring * 0.3 +
                         centerFlash) 
                         * fade * opacity * circularMask;
      
      // Add extra brightness to center and static
      float extraBrightness = centerFlash * 0.5 + staticNoise * ring * 0.2;
      gl_FragColor = vec4(finalColor * (1.0 + extraBrightness), finalAlpha);
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
