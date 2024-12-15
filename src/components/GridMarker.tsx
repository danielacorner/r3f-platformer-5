import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface GridMarkerProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  opacity?: number;
}

export function GridMarker({ 
  position, 
  size = 1, 
  color = '#ffffff',
  opacity = 0.5 
}: GridMarkerProps) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size), [size]);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    }),
    [color, opacity]
  );

  // Rotate to lay flat on the ground
  useEffect(() => {
    geometry.rotateX(-Math.PI / 2);
  }, [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      receiveShadow
    />
  );
}
