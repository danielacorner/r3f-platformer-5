import React from 'react';
import { Cloud } from '@react-three/drei';

interface StormCloudProps {
  color: string;
  seed: number;
  position: [number, number, number];
}

export const StormCloud = React.memo(({ color, seed, position }: StormCloudProps) => (
  <Cloud
    position={position}
    opacity={0.4}
    speed={0.4}
    seed={seed}
    segments={20}
    growth={1}
    color={color}
  />
));
