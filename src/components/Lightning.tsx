import { useRef, useState, useEffect } from 'react';
import { Vector3, CatmullRomCurve3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightningProps {
  startPosition: Vector3;
  endPosition: Vector3;
  onComplete?: () => void;
  segments?: number;
  radius?: number;
  color?: string;
}

export function Lightning({ 
  startPosition, 
  endPosition, 
  onComplete,
  segments = 8,
  radius = 0.2,
  color = '#ffffff'
}: LightningProps) {
  const ref = useRef<THREE.Group>(null);
  const [points, setPoints] = useState<Vector3[]>([]);
  const startTime = useRef(Date.now());
  const DURATION = 0.3; // Duration in seconds

  // Create zigzag points for the lightning
  useEffect(() => {
    const numPoints = segments;
    const newPoints: Vector3[] = [];
    const start = startPosition.clone();
    const end = endPosition.clone();
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const segmentLength = distance / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const pos = start.clone().add(direction.clone().multiplyScalar(t));
      
      // Add random offset to middle points
      if (i > 0 && i < numPoints - 1) {
        const offset = Math.min(segmentLength * 0.5, 2); // Cap the maximum offset
        pos.x += (Math.random() - 0.5) * offset;
        pos.z += (Math.random() - 0.5) * offset;
      }
      
      newPoints.push(pos);
    }

    const curve = new CatmullRomCurve3(newPoints);
    const curvePoints = curve.getPoints(50);
    setPoints(curvePoints);
  }, [startPosition, endPosition, segments]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed >= DURATION && onComplete) {
      onComplete();
    }
  });

  if (points.length === 0) return null;

  // Create line segments array
  const linePoints = new Float32Array(points.length * 3);
  points.forEach((point, i) => {
    linePoints[i * 3] = point.x;
    linePoints[i * 3 + 1] = point.y;
    linePoints[i * 3 + 2] = point.z;
  });

  return (
    <group ref={ref}>
      {/* Core beam */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={linePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          linewidth={3}
          transparent={false}
          depthTest={false}
          depthWrite={false}
        />
      </line>

      {/* Glow beam */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={linePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          linewidth={6}
          transparent
          opacity={0.3}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Impact points */}
      {[0, points.length - 1].map((idx) => (
        <mesh key={idx} position={points[idx]}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent={false}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Glow spheres along the path */}
      {points.filter((_, i) => i % 5 === 0).map((point, i) => (
        <pointLight
          key={i}
          position={point}
          color={color}
          intensity={2}
          distance={2}
          decay={2}
        />
      ))}
    </group>
  );
}
