import { useRef, useState, useEffect } from 'react';
import { Vector3, CatmullRomCurve3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Trail, useTexture } from '@react-three/drei';

interface LightningProps {
  startPosition: Vector3;
  endPosition: Vector3;
  onComplete?: () => void;
}

export function Lightning({ startPosition, endPosition, onComplete }: LightningProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [points, setPoints] = useState<Vector3[]>([]);
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());
  const DURATION = 0.2; // Duration in seconds

  // Create zigzag points for the lightning
  useEffect(() => {
    const numPoints = 8;
    const newPoints: Vector3[] = [];
    const start = new Vector3(startPosition.x, startPosition.y, startPosition.z);
    const end = new Vector3(endPosition.x, endPosition.y, endPosition.z);
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const segmentLength = distance / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const pos = start.clone().add(direction.clone().multiplyScalar(t));
      
      // Add random offset to middle points
      if (i > 0 && i < numPoints - 1) {
        pos.x += (Math.random() - 0.5) * segmentLength * 0.5;
        pos.z += (Math.random() - 0.5) * segmentLength * 0.5;
      }
      
      newPoints.push(pos);
    }

    const curve = new CatmullRomCurve3(newPoints);
    const curvePoints = curve.getPoints(50);
    setPoints(curvePoints);
  }, [startPosition, endPosition]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const newProgress = Math.min(elapsed / DURATION, 1);
    setProgress(newProgress);

    if (newProgress >= 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group>
      <Trail
        width={0.4}
        length={0.5}
        decay={1}
        local={false}
        stride={0}
        interval={1}
        attenuation={(width) => width * (1 - progress)}
        color={'#88ccff'}
      >
        <mesh ref={ref}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#88ccff" />
        </mesh>
      </Trail>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial 
            color="#88ccff"
            transparent
            opacity={(1 - progress) * 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
