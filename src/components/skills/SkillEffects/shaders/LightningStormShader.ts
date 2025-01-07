import * as THREE from 'three';

export class LightningStormShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#7c3aed') },
        intensity: { value: 1.0 }
      },
      vertexShader: 
        'varying vec2 vUv;\n' +
        'void main() {\n' +
        '  vUv = uv;\n' +
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n' +
        '}\n',
      fragmentShader: 
        'uniform float time;\n' +
        'uniform vec3 color;\n' +
        'uniform float intensity;\n' +
        'varying vec2 vUv;\n' +
        '\n' +
        'float random(vec2 st) {\n' +
        '  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);\n' +
        '}\n' +
        '\n' +
        'float noise(vec2 st) {\n' +
        '  vec2 i = floor(st);\n' +
        '  vec2 f = fract(st);\n' +
        '  float a = random(i);\n' +
        '  float b = random(i + vec2(1.0, 0.0));\n' +
        '  float c = random(i + vec2(0.0, 1.0));\n' +
        '  float d = random(i + vec2(1.0, 1.0));\n' +
        '  vec2 u = f * f * (3.0 - 2.0 * f);\n' +
        '  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;\n' +
        '}\n' +
        '\n' +
        'void main() {\n' +
        '  vec2 uv = vUv * 2.0 - 1.0;\n' +
        '  float t = time * 2.0;\n' +
        '  \n' +
        '  // Create electric arcs\n' +
        '  float n = noise(uv * 3.0 + vec2(t));\n' +
        '  float lightning = step(0.7, n);\n' +
        '  \n' +
        '  // Add glow\n' +
        '  float glow = smoothstep(1.0, 0.0, length(uv)) * 0.5;\n' +
        '  \n' +
        '  // Flicker effect\n' +
        '  float flicker = sin(time * 30.0) * 0.5 + 0.5;\n' +
        '  \n' +
        '  // Electric tendrils\n' +
        '  float tendrils = smoothstep(0.8, 0.9, noise(uv * 4.0 + vec2(t * 0.5)));\n' +
        '  \n' +
        '  // Combine effects\n' +
        '  vec3 finalColor = color * (lightning + glow + tendrils * 0.5) * intensity * flicker;\n' +
        '  float alpha = (lightning + glow + tendrils * 0.3) * intensity;\n' +
        '  \n' +
        '  gl_FragColor = vec4(finalColor, alpha);\n' +
        '}\n',
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }
}
