import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Vector3, Group } from "three";
import { useGameStore } from "../store/gameStore";
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { MagicOrb } from './MagicOrb';

interface PlayerProps {
  moveTargetRef: React.MutableRefObject<{
    x: number;
    z: number;
    active: boolean;
  }>;
}

const MOVE_SPEED = 5;
const FLOAT_HEIGHT = 0.5;
const FLOAT_SPEED = 2;
const CAMERA_LERP = 0.1;

export function Player({ moveTargetRef }: PlayerProps) {
  const playerRef = useRef<Group>(null);
  const { forward, backward, left, right } = useKeyboardControls();
  const visualRef = useRef<Group>(null);
  const lastValidPosition = useRef(new Vector3());
  const cameraOffset = useRef<Vector3 | null>(null);
  const { camera } = useThree()

  // Store initial camera offset
  useEffect(() => {
    if (!playerRef.current) return;
    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);
    cameraOffset.current = new Vector3().subVectors(camera.position, playerPos);
  }, []);

  // Handle movement and rotation
  useFrame((state, delta) => {
    if (!playerRef.current || !visualRef.current || !cameraOffset.current) return;

    // Get movement input
    const velocity = { x: 0, y: 0, z: 0 };

    // Get camera direction for WASD movement
    const cameraDirection = new Vector3();
    const cameraRight = new Vector3();
    state.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    cameraRight.crossVectors(cameraDirection, new Vector3(0, 1, 0)).normalize();

    // Handle keyboard movement
    if (forward) {
      velocity.x += cameraDirection.x * MOVE_SPEED;
      velocity.z += cameraDirection.z * MOVE_SPEED;
      moveTargetRef.current.active = false; // Disable click-to-move when using keyboard
    }
    if (backward) {
      velocity.x -= cameraDirection.x * MOVE_SPEED;
      velocity.z -= cameraDirection.z * MOVE_SPEED;
      moveTargetRef.current.active = false;
    }
    if (left) {
      velocity.x -= cameraRight.x * MOVE_SPEED;
      velocity.z -= cameraRight.z * MOVE_SPEED;
      moveTargetRef.current.active = false;
    }
    if (right) {
      velocity.x += cameraRight.x * MOVE_SPEED;
      velocity.z += cameraRight.z * MOVE_SPEED;
      moveTargetRef.current.active = false;
    }

    // Handle click-to-move
    if (moveTargetRef.current.active) {
      const position = playerRef.current.translation();
      const directionToTarget = new Vector3(
        moveTargetRef.current.x - position.x,
        0,
        moveTargetRef.current.z - position.z
      ).normalize();

      const distanceToTarget = new Vector3(
        moveTargetRef.current.x - position.x,
        0,
        moveTargetRef.current.z - position.z
      ).length();

      if (distanceToTarget > 0.1) {
        velocity.x = directionToTarget.x * MOVE_SPEED;
        velocity.z = directionToTarget.z * MOVE_SPEED;
      } else {
        moveTargetRef.current.active = false; // Reached target
      }
    }

    // Apply movement
    if (velocity.x !== 0 || velocity.z !== 0) {
      playerRef.current.setLinvel(velocity);
    } else {
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }); // Stop when no movement
    }

    // Get current position
    const position = playerRef.current.translation();
    const currentPos = new Vector3(position.x, position.y, position.z);

    // Update last valid position
    if (!isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z)) {
      lastValidPosition.current.copy(currentPos);
    }

    // Make character float with a sine wave
    const floatOffset = Math.sin(state.clock.elapsedTime * FLOAT_SPEED) * 0.1;
    playerRef.current.setTranslation({
      x: position.x,
      y: FLOAT_HEIGHT + floatOffset,
      z: position.z
    });

    // Rotate visual group based on movement direction
    if (velocity.x !== 0 || velocity.z !== 0) {
      const angle = Math.atan2(velocity.x, velocity.z);
      visualRef.current.rotation.y = angle;
    }

    // Update camera position while maintaining offset
    const targetCameraPos = new Vector3(
      lastValidPosition.current.x + cameraOffset.current.x,
      state.camera.position.y,
      lastValidPosition.current.z + cameraOffset.current.z
    );

    state.camera.position.x = state.camera.position.x + (targetCameraPos.x - state.camera.position.x) * CAMERA_LERP;
    state.camera.position.z = state.camera.position.z + (targetCameraPos.z - state.camera.position.z) * CAMERA_LERP;

    // Look at player position
    state.camera.lookAt(
      lastValidPosition.current.x,
      0,
      lastValidPosition.current.z
    );
  });

  return (
    <>
      <RigidBody
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 0.5, 0]}
        enabledRotations={[false, false, false]}
      >
        <CuboidCollider args={[0.3, 0.4, 0.3]} position={[0, FLOAT_HEIGHT, 0]} />
        <group ref={visualRef}>
          {/* Cloak - Main body */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 1.2, 8]} />
            <meshStandardMaterial color="#1a237e" />
          </mesh>

          {/* Dark face */}
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>

          {/* Yellow straw hat */}
          <mesh position={[0, 1.1, 0]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.3, 0.15, 8]} />
            <meshStandardMaterial color="#fdd835" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 8]} />
            <meshStandardMaterial color="#fdd835" />
          </mesh>

          {/* Wand */}
          <group position={[0.4, 0.4, -0.2]} rotation={[0, 0, -Math.PI / 4]}>
            {/* Wand stick */}
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
              <meshStandardMaterial color="#4a148c" />
            </mesh>
            {/* Wand tip */}
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#7e57c2" emissive="#7e57c2" emissiveIntensity={0.5} />
            </mesh>
          </group>

          {/* Floating effect particles */}
          <group position={[0, 0, 0]}>
            {[...Array(5)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin((i / 5) * Math.PI * 2) * 0.3,
                  -0.2 + Math.sin(i * 1.5) * 0.1,
                  Math.cos((i / 5) * Math.PI * 2) * 0.3
                ]}
              >
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial
                  color="#4a148c"
                  emissive="#7e57c2"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            ))}
          </group>
        </group>
      </RigidBody>
      <MagicOrb playerRef={playerRef} />
    </>
  );
}
