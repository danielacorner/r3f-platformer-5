import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D, MathUtils, Color, ShaderMaterial, AdditiveBlending, InstancedBufferAttribute, Vector3 } from 'three';
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

interface FireflyData {
  currentTarget: Vector3;
  nextTarget: Vector3;
  progress: number;
  speed: number;
  restTime: number;
  lastRestTime: number;
}

export function FirefliesInstances({ count = 50, radius = 25 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const opacities = useRef<Float32Array>(new Float32Array(count));
  const nextBlinkTimes = useRef<Float32Array>(new Float32Array(count));
  const blinkDurations = useRef<Float32Array>(new Float32Array(count));

  // Store movement data for each firefly
  const fireflyData = useRef<FireflyData[]>([]);

  const getRandomPoint = () => {
    const angle = Math.random() * Math.PI * 2;
    const r = radius * Math.sqrt(Math.random()); // Square root for even distribution
    const x = Math.cos(angle) * r;
    const y = 1 + Math.random() * 4;
    const z = Math.sin(angle) * r;
    return new Vector3(x, y, z);
  };

  useEffect(() => {
    if (!meshRef.current) return;

    // Initialize movement data for each firefly
    fireflyData.current = Array(count).fill(0).map(() => {
      const currentTarget = getRandomPoint();
      const nextTarget = getRandomPoint();
      return {
        currentTarget,
        nextTarget,
        progress: 0,
        speed: 0.2 + Math.random() * 0.3, // Units per second
        restTime: 0.5 + Math.random() * 2, // Rest time at each point
        lastRestTime: 0,
      };
    });

    // Initialize opacities and blink timings
    for (let i = 0; i < count; i++) {
      opacities.current[i] = 0.05;
      nextBlinkTimes.current[i] = Math.random() * 3;
      blinkDurations.current[i] = 0.2 + Math.random() * 0.3;
    }

    // Set up initial positions
    fireflyData.current.forEach((data, i) => {
      tempObject.position.copy(data.currentTarget);
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
    if (meshRef.current.instanceMatrix) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    const opacityAttribute = meshRef.current.geometry.getAttribute('opacity');

    fireflyData.current.forEach((data, i) => {
      // Update movement
      if (time - data.lastRestTime >= data.restTime) {
        data.progress += delta * data.speed;

        if (data.progress >= 1) {
          // Reached target, set up next movement
          data.currentTarget.copy(data.nextTarget);
          data.nextTarget.copy(getRandomPoint());
          data.progress = 0;
          data.lastRestTime = time;
          data.restTime = 0.5 + Math.random() * 2; // New random rest time
          data.speed = 0.1 + Math.random() * 0.12; // New random speed
        }

        // Calculate position with smooth easing
        const easeProgress = 1 - Math.cos(data.progress * Math.PI) / 2; // Smooth acceleration and deceleration
        const newPosition = new Vector3().lerpVectors(
          data.currentTarget,
          data.nextTarget,
          easeProgress
        );

        // Add slight wobble
        const wobbleX = Math.sin(time * 2 + i) * 0.05;
        const wobbleY = Math.cos(time * 1.5 + i) * 0.05;
        const wobbleZ = Math.sin(time * 1.7 + i) * 0.05;

        tempObject.position.copy(newPosition).add(new Vector3(wobbleX, wobbleY, wobbleZ));

        // Handle blinking
        if (time >= nextBlinkTimes.current[i]) {
          const blinkProgress = (time - nextBlinkTimes.current[i]) / blinkDurations.current[i];

          if (blinkProgress >= 1) {
            nextBlinkTimes.current[i] = time + 3 + Math.random() * 4;
            opacityAttribute.setX(i, 0.05);
          } else {
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
      }
    });

    if (opacityAttribute) {
      opacityAttribute.needsUpdate = true;
    }
    if (meshRef.current.instanceMatrix) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
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
