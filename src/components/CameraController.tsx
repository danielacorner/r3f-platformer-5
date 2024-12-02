import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';

export function CameraController() {
  const { camera } = useThree();
  const playerRef = useGameStore(state => state.playerRef);

  useEffect(() => {
    // Set initial camera position and rotation
    camera.position.set(0, 15, 10);
    // camera.rotation.set(-0.9, 0, 0);
  }, [camera]);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.translation();
    const targetPosition = new Vector3(
      playerPos.x,
      playerPos.y + 25, // Keep height constant
      playerPos.z + 20  // Keep distance constant
    );

    // Smoothly move camera to new position
    camera.position.lerp(targetPosition, 0.1);
  });

  return null;
}