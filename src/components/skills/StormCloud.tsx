import React from 'react';
import { Cloud } from '@react-three/drei';
import * as THREE from 'three';

const STORM_CLOUD_COLOR = new THREE.Color
  ('#5d5d5d')
interface StormCloudProps {
  seed: number;
  position: [number, number, number];
}

export const StormCloud = React.memo(({ seed, position }: StormCloudProps) => (
  <Cloud
    position={position}
    opacity={0.3}
    speed={2.4}
    seed={seed}
    segments={20}
    growth={1.4}
    color={STORM_CLOUD_COLOR}
    scale={1.6}
  />
));
