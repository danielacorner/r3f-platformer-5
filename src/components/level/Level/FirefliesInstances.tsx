import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D, MathUtils, Color, ShaderMaterial, AdditiveBlending, InstancedBufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';

const vertexShader = `
  attribute float opacity;
  varying float vOpacity;
  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.5, vOpacity);
  }
`;

export function FirefliesInstances({ count = 50, radius = 25 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const opacities = useRef<Float32Array>(new Float32Array(count));
  const nextBlinkTimes = useRef<Float32Array>(new Float32Array(count));
  const blinkDurations = useRef<Float32Array>(new Float32Array(count));
  
  const initialPositions = useMemo(() => Array(count).fill(0).map(() => ({
    x: MathUtils.randFloatSpread(radius * 2),
    y: 1 + Math.random() * 4,
    z: MathUtils.randFloatSpread(radius * 2),
    phase: Math.random() * Math.PI * 2,
    speed: 0.05 + Math.random() * 0.1,
    pausePhase: Math.random() * Math.PI * 2,
    xOffset: Math.random() * Math.PI * 2,
    zOffset: Math.random() * Math.PI * 2,
  })), [count, radius]);

  useEffect(() => {
    if (!meshRef.current) return;

    // Initialize opacities and blink timings
    for (let i = 0; i < count; i++) {
      opacities.current[i] = 0.05;
      nextBlinkTimes.current[i] = Math.random() * 3; // Random start times
      blinkDurations.current[i] = 0.2 + Math.random() * 0.3;
    }

    // Set up initial positions
    initialPositions.forEach((pos, i) => {
      tempObject.position.set(pos.x, pos.y, pos.z);
      const scale = 0.03 + Math.random() * 0.02;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    // Set up the opacity attribute
    const material = meshRef.current.material as ShaderMaterial;
    material.uniforms = {};
    const opacityAttribute = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      opacityAttribute[i] = 0.05;
    }
    meshRef.current.geometry.setAttribute('opacity', new InstancedBufferAttribute(opacityAttribute, 1));

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialPositions, count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    const opacityAttribute = meshRef.current.geometry.getAttribute('opacity');

    initialPositions.forEach((pos, i) => {
      meshRef.current!.getMatrixAt(i, tempObject.matrix);
      tempObject.position.setFromMatrixPosition(tempObject.matrix);

      // Calculate pause factor (creates moments of hovering)
      const pauseFactor = Math.sin(time * 0.1 + pos.pausePhase) * 0.5 + 0.5;
      const currentSpeed = pos.speed * pauseFactor;

      // Create meandering path
      const xMovement = Math.sin(time * currentSpeed + pos.xOffset) * 0.5;
      const yMovement = Math.sin(time * currentSpeed * 0.7 + pos.phase) * 0.3;
      const zMovement = Math.cos(time * currentSpeed + pos.zOffset) * 0.5;

      // Update position with smooth, meandering motion
      tempObject.position.x = pos.x + xMovement;
      tempObject.position.y = pos.y + yMovement;
      tempObject.position.z = pos.z + zMovement;

      // Handle blinking
      if (time >= nextBlinkTimes.current[i]) {
        const blinkProgress = (time - nextBlinkTimes.current[i]) / blinkDurations.current[i];
        
        if (blinkProgress >= 1) {
          // Schedule next blink
          nextBlinkTimes.current[i] = time + 3 + Math.random() * 4;
          opacityAttribute.setX(i, 0.05);
        } else {
          // During blink
          const opacity = Math.sin(blinkProgress * Math.PI) * 0.7 + 0.2;
          opacityAttribute.setX(i, opacity);
        }
      }

      // Scale based on current opacity
      const baseScale = 0.03 + Math.random() * 0.02;
      const scaleMultiplier = 1 + (opacityAttribute.getX(i) * 0.5);
      tempObject.scale.set(
        baseScale * scaleMultiplier,
        baseScale * scaleMultiplier,
        baseScale * scaleMultiplier
      );

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    opacityAttribute.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
