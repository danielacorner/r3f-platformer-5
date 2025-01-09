import * as THREE from 'three';

const vertexShader = `
attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute float instanceIntensity;
attribute float instanceWidth;

uniform float time;

varying vec2 vUv;
varying float vIntensity;

void main() {
    vUv = uv;
    vIntensity = instanceIntensity;

    // Calculate direction and position
    vec3 direction = instanceEnd - instanceStart;
    float length = length(direction);
    vec3 dir = normalize(direction);

    // Create basis vectors for the billboard
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(dir, up));
    up = normalize(cross(right, dir));

    // Position along the line
    float along = position.y * 0.5 + 0.5; // Convert from [-1,1] to [0,1]
    
    // Add zigzag effect
    float zigzag = sin(along * 30.0 + time * 20.0) * 0.15 * instanceWidth;
    zigzag += sin(along * 15.0 - time * 15.0) * 0.1 * instanceWidth;
    
    // Calculate final position
    vec3 pos = mix(instanceStart, instanceEnd, along);
    pos += right * (position.x * instanceWidth + zigzag);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float time;
varying vec2 vUv;
varying float vIntensity;

void main() {
    // Create electric pattern
    float pattern = sin(vUv.y * 30.0 + time * 20.0) * 0.5 + 0.5;
    pattern *= sin(vUv.y * 15.0 - time * 15.0) * 0.5 + 0.5;
    
    // Core color
    vec3 color = vec3(0.6, 0.8, 1.0);
    
    // Add glow
    float glow = smoothstep(0.5, 0.0, abs(vUv.x - 0.5));
    glow *= pattern;
    
    // Add flicker
    float flicker = sin(time * 30.0) * 0.2 + 0.8;
    
    // Combine colors with intensity
    vec3 finalColor = mix(color, vec3(1.0), glow) * vIntensity * flicker;
    
    // Add brightness
    finalColor *= 1.5;
    
    gl_FragColor = vec4(finalColor, glow * 0.8);
}
`;

export class InstancedLightningMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }

    update(time: number) {
        this.uniforms.time.value = time;
    }
}
