import { useRef, useMemo } from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

interface LightningEffectProps {
  startPosition: Vector3;
  endPosition: Vector3;
  startTime: number;
  duration: number;
  color: string;
}

const generateLightningPoints = (start: Vector3, end: Vector3, segments: number = 8) => {
  const points = [];
  const direction = end.clone().sub(start);
  const segmentLength = direction.length() / segments;
  const perpendicular = new Vector3(-direction.y, direction.x, 0).normalize();

  points.push(start.clone());

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const basePoint = start.clone().add(direction.clone().multiplyScalar(t));
    const offset = perpendicular.clone().multiplyScalar((Math.random() - 0.5) * segmentLength * 0.5);
    points.push(basePoint.add(offset));
  }

  points.push(end.clone());
  return points;
};

export default function LightningEffect({
  startPosition,
  endPosition,
  startTime,
  duration,
  color,
}: LightningEffectProps) {
  const lineRef = useRef<any>();
  const points = useMemo(() => generateLightningPoints(startPosition, endPosition), [startPosition, endPosition]);
  const lightningColor = new Color(color);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    const elapsed = (clock.getElapsedTime() * 1000) - startTime;
    const progress = Math.min(elapsed / (duration * 1000), 1);
    const opacity = 1 - progress;

    if (lineRef.current.material) {
      lineRef.current.material.opacity = opacity;
      lineRef.current.material.color = lightningColor;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={3}
      transparent
      opacity={1}
    />
  );
}
