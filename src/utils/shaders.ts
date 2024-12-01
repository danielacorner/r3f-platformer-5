import { ShaderMaterial, WebGLRenderTarget, HalfFloatType, Vector3 } from 'three';

// Optimized creep shader with glow effect
export const creepShader = {
  vertexShader: `
    attribute float instanceScale;
    attribute vec3 instanceColor;
    attribute float instanceHealth;
    
    varying vec3 vColor;
    varying float vHealth;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vColor = instanceColor;
      vHealth = instanceHealth;
      
      // Apply instance scale
      vec3 transformed = position * instanceScale;
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Pass data to fragment shader
      vNormal = normalMatrix * normal;
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
    }
  `,
  fragmentShader: `
    uniform float time;
    
    varying vec3 vColor;
    varying float vHealth;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel effect for rim lighting
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
      
      // Health-based glow
      float healthFactor = vHealth;
      vec3 glowColor = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), healthFactor);
      
      // Animated energy effect
      float energy = sin(vWorldPosition.y * 10.0 + time * 2.0) * 0.5 + 0.5;
      
      // Final color
      vec3 baseColor = vColor;
      vec3 rimColor = mix(glowColor, vec3(1.0), 0.5);
      vec3 finalColor = mix(baseColor, rimColor, fresnel * 0.5);
      finalColor += glowColor * energy * 0.2;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Optimized tower shader with energy field
export const towerShader = {
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float time;
    
    void main() {
      vPosition = position;
      vNormal = normal;
      vec3 pos = position;
      
      // Add subtle movement
      pos.y += sin(time * 2.0 + position.x) * 0.02;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float time;
    uniform vec3 color;
    uniform float powerLevel;
    
    void main() {
      vec3 normal = normalize(vNormal);
      
      // Energy field effect
      float energy = sin(vPosition.y * 10.0 + time * 2.0) * 0.5 + 0.5;
      energy *= powerLevel;
      
      // Hex grid pattern
      vec2 hex = vPosition.xy * 10.0;
      float hexPattern = sin(hex.x) * sin(hex.y);
      
      vec3 finalColor = mix(color, vec3(1.0), energy * hexPattern * 0.3);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Projectile particle compute shader
export const projectileComputeShader = `
  #version 450

  layout(local_size_x = 256) in;

  layout(std430, binding = 0) buffer ParticleBuffer {
    vec4 particles[];
  };

  layout(std430, binding = 1) buffer VelocityBuffer {
    vec4 velocities[];
  };

  uniform float deltaTime;
  uniform vec3 target;
  uniform float speed;

  void main() {
    uint index = gl_GlobalInvocationID.x;
    
    vec3 position = particles[index].xyz;
    vec3 velocity = velocities[index].xyz;
    
    // Update position
    vec3 direction = normalize(target - position);
    velocity = mix(velocity, direction * speed, 0.1);
    position += velocity * deltaTime;
    
    // Store results
    particles[index] = vec4(position, 1.0);
    velocities[index] = vec4(velocity, 0.0);
  }
`;

// Create optimized render targets
export function createRenderTargets() {
  return {
    main: new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: HalfFloatType,
      stencilBuffer: false,
    }),
    effects: new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: HalfFloatType,
      stencilBuffer: false,
    })
  };
}

// Shader material factory
export function createShaderMaterial(type: 'creep' | 'tower', params: any = {}) {
  const shader = type === 'creep' ? creepShader : towerShader;
  return new ShaderMaterial({
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    uniforms: {
      time: { value: 0 },
      color: { value: new Vector3(1, 1, 1) },
      powerLevel: { value: 1.0 },
      ...params
    },
    transparent: true,
  });
}
