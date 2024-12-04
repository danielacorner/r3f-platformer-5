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
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';

const DEFAULT_HEIGHT = 30;
const DEFAULT_DISTANCE = 15;
const DEFAULT_TILT = -1.2; // More top-down angle
const LERP_SPEED = 0.02;
const TILT_LERP_SPEED = 0.005;

export function CameraController() {
  const { camera } = useThree();
  const playerRef = useGameStore(state => state.playerRef);
  const targetHeight = useRef(DEFAULT_HEIGHT);
  const targetDistance = useRef(DEFAULT_DISTANCE);
  const targetTiltRef = useRef(DEFAULT_TILT);

  useEffect(() => {
    // Set initial camera position and rotation
    camera.position.set(0, DEFAULT_HEIGHT, DEFAULT_DISTANCE);
    camera.rotation.x = DEFAULT_TILT;

    // Handle zoom with mouse wheel
    const handleWheel = (e: WheelEvent) => {
      const zoomSpeed = 0.5;
      targetHeight.current = Math.max(15, Math.min(45, targetHeight.current + e.deltaY * 0.01 * zoomSpeed));
      targetDistance.current = Math.max(5, Math.min(25, targetDistance.current + e.deltaY * 0.01 * zoomSpeed));
      
      // Adjust tilt based on height - more top-down when higher
      const heightRatio = (targetHeight.current - 15) / (45 - 15);
      targetTiltRef.current = DEFAULT_TILT * (1 + heightRatio * 0.3); // More negative (top-down) as height increases
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [camera]);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.translation();
    const targetPosition = new Vector3(
      playerPos.x,
      playerPos.y + targetHeight.current,
      playerPos.z + targetDistance.current
    );

    // Smoothly move camera position
    camera.position.lerp(targetPosition, LERP_SPEED);

    // Smoothly adjust camera tilt
    camera.rotation.x += (targetTiltRef.current - camera.rotation.x) * TILT_LERP_SPEED;
  });

  return null;
}