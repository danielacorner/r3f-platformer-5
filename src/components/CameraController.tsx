import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';

export function CameraController() {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const playerRef = useGameStore(state => state.playerRef);
  const cameraOffset = useRef(new Vector3(20, 20, 20));
  const initialRotation = useRef({
    x: -Math.PI / 4,  // -45 degrees
    y: Math.PI / 4,   // 45 degrees
    z: Math.PI / 6    // 30 degrees
  });

  useEffect(() => {
    // Set initial camera position and rotation
    camera.position.copy(cameraOffset.current);
    camera.rotation.set(
      initialRotation.current.x,
      initialRotation.current.y,
      initialRotation.current.z
    );
  }, [camera]);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.translation();
    
    // Update target position while maintaining the same relative offset
    targetPosition.current.set(
      playerPos.x + cameraOffset.current.x,
      playerPos.y + cameraOffset.current.y,
      playerPos.z + cameraOffset.current.z
    );

    // Smoothly move camera to new position
    camera.position.lerp(targetPosition.current, 0.1);
  });

  return null;
}