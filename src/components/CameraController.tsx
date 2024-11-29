import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';
import { OrbitControls } from '@react-three/drei';

export function CameraController() {
  const { camera } = useThree();
  const controls = useRef<OrbitControls>();

  // Adjust these values to change camera perspective
  const CAMERA_DISTANCE = 15; // Base distance from player
  const ZOOM_FACTOR = 0.8; // Decrease to zoom in, increase to zoom out
  const Y_RATIO = 1.2; // Increase for more top-down view

  const cameraOffset = useRef(new Vector3(
    CAMERA_DISTANCE,
    CAMERA_DISTANCE * Y_RATIO,
    CAMERA_DISTANCE
  ).multiplyScalar(ZOOM_FACTOR));

  const targetPosition = useRef(new Vector3());
  const playerRef = useGameStore(state => state.playerRef);
  const initialRotation = useRef({
    x: -Math.PI / 4,  // -60 degrees for more top-down
    y: Math.PI / 4,   // 45 degrees
    z: Math.PI / 6    // 30 degrees
  });

  useEffect(() => {
    // Set initial camera rotation
    camera.rotation.x = initialRotation.current.x;
    camera.rotation.y = initialRotation.current.y;
    camera.rotation.z = initialRotation.current.z;

    if (controls.current) {
      // Set initial camera position
      controls.current.target.set(0, 0, 0);

      // Limit vertical rotation
      controls.current.minPolarAngle = Math.PI * 0.1; // Don't allow looking up too much
      controls.current.maxPolarAngle = Math.PI * 0.25; // Don't allow looking down too much

      // Limit zoom
      controls.current.minDistance = 30;
      controls.current.maxDistance = 40;

      // Update controls
      controls.current.update();
    }
  }, [camera, controls]);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.translation();
    targetPosition.current.set(
      playerPos.x + cameraOffset.current.x,
      playerPos.y + cameraOffset.current.y,
      playerPos.z + cameraOffset.current.z
    );

    // Smoothly move camera to new position
    camera.position.lerp(targetPosition.current, 0.1);
  });

  return <OrbitControls ref={controls} enableZoom={false} enableRotate={false} />;
}