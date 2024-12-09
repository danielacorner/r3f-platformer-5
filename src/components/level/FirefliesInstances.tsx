import { useRef, useEffect, useMemo } from "react";
import {
  InstancedMesh,
  Object3D,
  ShaderMaterial,
  AdditiveBlending,
  InstancedBufferAttribute,
  Vector3,
  SphereGeometry,
} from "three";
import { useFrame } from "@react-three/fiber";

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
    gl_FragColor = vec4(1.0, 0.9, 0.5, vOpacity);
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

    // Initialize firefly data
    fireflyData.current = Array(count)
      .fill(null)
      .map(() => ({
        currentTarget: getRandomPoint(),
        nextTarget: getRandomPoint(),
        progress: 0,
        speed: 0.2 + Math.random() * 0.3,
        restTime: Math.random() * 2,
        lastRestTime: 0,
      }));

    // Initialize opacities and blink timings
    for (let i = 0; i < count; i++) {
      opacities.current[i] = 0.1 + Math.random() * 0.1; // Much lower base opacity
      nextBlinkTimes.current[i] = Math.random() * 2;
      blinkDurations.current[i] = 0.1 + Math.random() * 0.2;
    }

    // Update the instance attribute
    meshRef.current.geometry.setAttribute(
      "opacity",
      new InstancedBufferAttribute(opacities.current, 1)
    );
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Update each firefly
    for (let i = 0; i < count; i++) {
      const data = fireflyData.current[i];

      // Update blinking
      if (time >= nextBlinkTimes.current[i]) {
        // Start a bright blink
        opacities.current[i] = 0.8 + Math.random() * 0.2; // Bright flash
        nextBlinkTimes.current[i] = time + 2 + Math.random() * 3; // Longer time between blinks
      } else if (
        time >=
        nextBlinkTimes.current[i] - blinkDurations.current[i]
      ) {
        // Fade back to dim
        const fadeProgress =
          (nextBlinkTimes.current[i] - time) / blinkDurations.current[i];
        opacities.current[i] = 0.1 + fadeProgress * 0.9;
      }

      // Update position
      if (data.progress >= 1) {
        if (time - data.lastRestTime >= data.restTime) {
          data.currentTarget.copy(data.nextTarget);
          data.nextTarget = getRandomPoint();
          data.progress = 0;
          data.speed = 0.2 + Math.random() * 0.3;
          data.restTime = Math.random() * 2;
          data.lastRestTime = time;
        }
      } else {
        data.progress = Math.min(1, data.progress + delta * data.speed);

        tempObject.position.lerpVectors(
          data.currentTarget,
          data.nextTarget,
          data.progress
        );

        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
    }

    // Update instance attributes
    meshRef.current.geometry.setAttribute(
      "opacity",
      new InstancedBufferAttribute(opacities.current, 1)
    );
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => new SphereGeometry(0.05, 8, 8), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
