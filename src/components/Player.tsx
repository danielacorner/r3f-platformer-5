import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  Vector3,
  Group,
  CircleGeometry,
  DoubleSide,
  LineBasicMaterial,
  Line,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { useGameStore } from "../store/gameStore";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { MagicOrb } from "./MagicOrb";
import { LevelUpEffect } from "./LevelUpEffect";

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
const CAMERA_LERP = 0.15;
const CAMERA_HEIGHT = 56;
const START_ANIMATION_DURATION = 2; // longer animation duration

export function Player({ moveTargetRef }: PlayerProps) {
  const playerRef = useRef<Group>(null);
  const { forward, backward, left, right } = useKeyboardControls();
  const visualRef = useRef<Group>(null);
  const lastValidPosition = useRef(new Vector3(0, FLOAT_HEIGHT, 0));
  const cameraOffset = useRef<Vector3 | null>(null);
  const lastTouchY = useRef<number | null>(null);
  const lastTouchX = useRef<number | null>(null);
  const cameraRotation = useRef(0);
  const introStartTime = useRef<number | null>(null);
  const { camera } = useThree();
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const prevLevel = useRef(1);
  const level = useGameStore((state) => state.level);
  const range = useGameStore((state) => state.upgrades.range);
  const damage = useGameStore((state) => state.upgrades.damage);
  const cameraZoom = useGameStore((state) => state.cameraZoom);
  const cameraAngle = useGameStore((state) => state.cameraAngle);
  const adjustCameraZoom = useGameStore((state) => state.adjustCameraZoom);
  const adjustCameraAngle = useGameStore((state) => state.adjustCameraAngle);
  const [rigidBodyKey, setRigidBodyKey] = useState(0);
  const floatOffset = useRef(0);

  // Initialize physics and camera
  useEffect(() => {
    if (!playerRef.current || !camera) return;

    // Set initial camera position (very low and close, facing player)
    camera.position.set(0, 2, -3);
    camera.lookAt(0, 2, 0);

    // Initialize camera offset
    cameraOffset.current = camera.position
      .clone()
      .sub(new Vector3(0, FLOAT_HEIGHT, 0));

    // Start intro animation
    introStartTime.current = Date.now();

    // Initialize physics state
    playerRef.current.setTranslation({ x: 0, y: FLOAT_HEIGHT, z: 0 });
    playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    playerRef.current.resetForces(true);

    // Reset move target
    if (moveTargetRef.current) {
      moveTargetRef.current.active = false;
    }

    // Add wheel event listener for zoom and angle control
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;

      if (e.shiftKey) {
        // Adjust vertical angle with shift + wheel
        adjustCameraAngle(delta);
      } else {
        // Regular zoom without shift
        adjustCameraZoom(delta);
      }
    };

    // Handle touch controls for camera angle
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
      lastTouchX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (lastTouchY.current === null || lastTouchX.current === null) return;

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;

      // Vertical movement controls camera angle
      const deltaY = (touchY - lastTouchY.current) * 0.002;
      adjustCameraAngle(deltaY);

      // Horizontal movement controls rotation
      const deltaX = (touchX - lastTouchX.current) * 0.1;
      const newRotation = cameraRotation.current - deltaX;
      cameraRotation.current = Math.max(-30, Math.min(30, newRotation));

      lastTouchY.current = touchY;
      lastTouchX.current = touchX;
    };

    const handleTouchEnd = () => {
      lastTouchY.current = null;
      lastTouchX.current = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      if (moveTargetRef.current) {
        moveTargetRef.current.active = false;
      }
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [camera, adjustCameraZoom, adjustCameraAngle, rigidBodyKey]);

  // Check for level up
  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevelUpEffect(true);
      prevLevel.current = level;
    }
  }, [level]);

  // Create range indicator geometry
  const rangeIndicator = useMemo(() => {
    const baseRange = 5; // Base attack range
    const rangeBonus = range * 0.12; // 12% increase per level
    const totalRange = baseRange * (1 + rangeBonus);
    const circleGeometry = new CircleGeometry(totalRange, 64);
    const points = circleGeometry.attributes.position;
    const positions = [];

    // Extract only the outer edge vertices
    for (let i = 1; i <= 64; i++) {
      positions.push(points.getX(i), points.getY(i), points.getZ(i));
    }
    // Close the circle
    positions.push(points.getX(1), points.getY(1), points.getZ(1));

    const geometry = new Float32Array(positions);
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(geometry, 3)
    );

    return lineGeometry;
  }, [range]);

  // Handle movement and rotation
  useFrame((state, delta) => {
    if (!playerRef.current || !visualRef.current || !cameraOffset.current)
      return;

    const position = playerRef.current.translation();
    const currentPos = new Vector3(position.x, position.y, position.z);

    // Update floating animation
    floatOffset.current += delta * FLOAT_SPEED;
    const floatHeight = FLOAT_HEIGHT + Math.sin(floatOffset.current) * 0.1;

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
      if (moveTargetRef.current) moveTargetRef.current.active = false;
    }
    if (backward) {
      velocity.x -= cameraDirection.x * MOVE_SPEED;
      velocity.z -= cameraDirection.z * MOVE_SPEED;
      if (moveTargetRef.current) moveTargetRef.current.active = false;
    }
    if (left) {
      velocity.x -= cameraRight.x * MOVE_SPEED;
      velocity.z -= cameraRight.z * MOVE_SPEED;
      if (moveTargetRef.current) moveTargetRef.current.active = false;
    }
    if (right) {
      velocity.x += cameraRight.x * MOVE_SPEED;
      velocity.z += cameraRight.z * MOVE_SPEED;
      if (moveTargetRef.current) moveTargetRef.current.active = false;
    }

    // Handle click-to-move
    if (moveTargetRef.current?.active) {
      const directionToTarget = new Vector3(
        moveTargetRef.current.x - position.x,
        0,
        moveTargetRef.current.z - position.z
      );

      const distanceToTarget = directionToTarget.length();

      if (distanceToTarget > 0.1) {
        directionToTarget.normalize();
        // Scale velocity based on distance to target
        const speedScale = Math.min(distanceToTarget, 1.0);
        velocity.x = directionToTarget.x * MOVE_SPEED * speedScale;
        velocity.z = directionToTarget.z * MOVE_SPEED * speedScale;
      } else {
        moveTargetRef.current.active = false;
        // Stop movement when very close to target
        velocity.x = 0;
        velocity.z = 0;
      }
    }

    // Apply movement if there is any velocity
    if (velocity.x !== 0 || velocity.z !== 0) {
      // Reset physics body if it's in an invalid state
      if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        playerRef.current.setTranslation(lastValidPosition.current);
        playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
        return;
      }

      playerRef.current.setLinvel(velocity);

      // Rotate visual group based on movement direction
      const angle = Math.atan2(velocity.x, velocity.z);
      visualRef.current.rotation.y = angle;

      // Update last valid position
      lastValidPosition.current.copy(currentPos);
    }

    // Keep player at float height with smooth animation
    playerRef.current.setTranslation({
      x: position.x,
      y: floatHeight,
      z: position.z,
    });

    // Update camera position
    const verticalOffset = CAMERA_HEIGHT * cameraZoom * cameraAngle;
    const horizontalOffset = CAMERA_HEIGHT * cameraZoom * (1 - cameraAngle);

    // Apply rotation to camera position
    const rotationRad = (cameraRotation.current * Math.PI) / 180;
    const rotatedX = Math.sin(rotationRad) * horizontalOffset;
    const rotatedZ = Math.cos(rotationRad) * horizontalOffset;

    // Calculate camera position based on intro animation or normal gameplay
    let targetX = position.x + rotatedX;
    let targetY = verticalOffset;
    let targetZ = position.z + rotatedZ;

    if (introStartTime.current) {
      const elapsed = (Date.now() - introStartTime.current) / 1000; // seconds

      if (elapsed < START_ANIMATION_DURATION) {
        const progress = Math.min(1, elapsed / START_ANIMATION_DURATION);

        // Logarithmic easing for zoom out
        const zoomProgress = Math.log(1.48 + progress * 6) / Math.log(10);
        // Delayed quadratic easing for vertical movement
        const verticalProgress = Math.max(
          0,
          Math.pow((progress - 0.2) * 1.2, 2)
        );

        // Start position (low and close, facing player)
        const startY = 2;
        const startZ = -3;

        // First zoom out (z axis), then move up (y axis)
        targetZ =
          position.z + startZ + (horizontalOffset - startZ) * zoomProgress;
        targetY = startY + (verticalOffset - startY) * verticalProgress;

        // Animate look-at point from player height to ground
        const lookAtHeight = 2 * (1 - verticalProgress);
        camera.lookAt(position.x, lookAtHeight, position.z);
      } else {
        // Animation finished
        introStartTime.current = null;
      }
    }

    // Apply final camera position
    state.camera.position.x = targetX;
    state.camera.position.y = targetY;
    state.camera.position.z = targetZ;

    // Only look at player position if intro is finished
    if (!introStartTime.current) {
      state.camera.lookAt(position.x, 0, position.z);
    }
  });

  return (
    <>
      <RigidBody
        key={rigidBodyKey}
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, FLOAT_HEIGHT, 0]}
        enabledRotations={[false, false, false]}
        scale={1 + damage / 12}
        linearDamping={0.95}
        // need this here or else player stops being able to move (like render loop stops or simulation temp reaches 0)
        gravityScale={0.1}
      >
        <CuboidCollider
          args={[0.3, 0.4, 0.3]}
          position={[0, FLOAT_HEIGHT, 0]}
        />
        <group ref={visualRef}>
          {/* Range Indicator */}
          <line rotation-x={-Math.PI / 2} position={[0, 0.1, 0]}>
            <primitive object={rangeIndicator} />
            <lineBasicMaterial color="#4c99f7" linewidth={1} />
          </line>

          {/* Blue Cloak with wind animation */}
          <group position={[0, 0.4, 0]}>
            {/* Main cloak body */}
            <mesh>
              <cylinderGeometry args={[0.35, 0.6, 1.4, 12]} />
              <meshStandardMaterial color="#1a237e" />
            </mesh>
            {/* Cloak bottom with wind effect */}
            <mesh
              position={[0, -0.7, 0]}
              rotation-y={Math.sin(Date.now() * 0.002) * 0.2}
            >
              <cylinderGeometry args={[0.6, 0.7, 0.3, 12]} />
              <meshStandardMaterial color="#1a237e" />
            </mesh>
          </group>

          {/* Black head */}
          <group position={[0, 1.1, 0]}>
            {/* Main head shape */}
            <mesh scale={1.2}>
              <boxGeometry args={[0.35, 0.35, 0.35]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Front face overlay for depth */}
            <mesh position={[0, 0, 0.18]}>
              <boxGeometry args={[0.4, 0.4, 0.05]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Glowing eyes */}
            <mesh position={[-0.1, 0, 0.2]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial
                color="#ffeb3b"
                emissive="#ffeb3b"
                emissiveIntensity={1}
              />
            </mesh>
            <mesh position={[0.1, 0, 0.2]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial
                color="#ffeb3b"
                emissive="#ffeb3b"
                emissiveIntensity={1}
              />
            </mesh>
          </group>

          {/* Tall pointy wizard hat */}
          <group position={[0, 1.35, -0.1]} rotation-z={Math.PI * 0.05}>
            {/* Hat brim */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.85, 0.83, 0.08, 32]} />
              <meshStandardMaterial
                color="#fbc02d"
                roughness={0.5}
                metalness={0.1}
                emissive="#fbc02d"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Hat band */}
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.48, 0.48, 0.06, 32]} />
              <meshStandardMaterial
                color="#5d4037"
                roughness={0.6}
                metalness={0.2}
              />
            </mesh>
            {/* Inner brim (transition to cone) */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry
                args={[
                  0.4, // top radius gets slightly smaller
                  0.4, // bottom radius
                  0.1, // height
                  32, // segments
                  1,
                  true,
                  Math.PI * 0.25, // adjust arc start
                  Math.PI * 1.5, // adjust arc length
                ]}
              />
              <meshStandardMaterial
                color="#fbc02d"
                roughness={0.5}
                metalness={0.1}
                emissive="#fbc02d"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Hat cone */}
            <mesh
              position={[0, 0.3, 0]}
              rotation-z={Math.sin(Date.now() * 0.001) * 0.1}
            >
              <cylinderGeometry args={[0.12, 0.4, 0.7, 32]} />
              <meshStandardMaterial
                color="#fbc02d"
                roughness={0.5}
                metalness={0.1}
                emissive="#fbc02d"
                emissiveIntensity={0.2}
              />
              {/* Hat tip with droop */}
              <group
                position={[0, 0.4, 0]}
                rotation-z={-0.6 + Math.sin(Date.now() * 0.001) * 0.2}
              >
                {/* Drooping section */}
                <mesh position={[0.1, 0.1, 0]}>
                  <cylinderGeometry args={[0.08, 0.12, 0.25, 32]} />
                  <meshStandardMaterial
                    color="#fbc02d"
                    roughness={0.5}
                    metalness={0.1}
                    emissive="#fbc02d"
                    emissiveIntensity={0.2}
                  />
                </mesh>
                {/* Tip sphere */}
                <mesh position={[0.2, 0.15, 0]}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshStandardMaterial
                    color="#fbc02d"
                    roughness={0.5}
                    metalness={0.1}
                    emissive="#fbc02d"
                    emissiveIntensity={0.2}
                  />
                </mesh>
              </group>
            </mesh>
          </group>

          {/* Wizard Cape */}
          <group position={[0, 0.8, -0.2]}>
            {/* Cape top (shoulders) */}
            <mesh position={[0, 0, 0]} rotation-x={0.2}>
              <cylinderGeometry
                args={[
                  0.4,
                  0.5,
                  0.3,
                  8,
                  1,
                  true,
                  Math.PI * 0.25,
                  Math.PI * 1.5,
                ]}
              />
              <meshStandardMaterial
                color="#1565c0"
                roughness={0.6}
                metalness={0.1}
                side={2}
              />
            </mesh>

            {/* Cape segments with wind animation */}
            {[0, 1, 2, 3].map((i) => (
              <mesh
                key={i}
                position={[0, -0.15 - i * 0.3, -0.1 - i * 0.1]}
                rotation-x={0.2 + Math.sin(Date.now() * 0.001 + i * 0.5) * 0.1}
                rotation-z={Math.sin(Date.now() * 0.002 + i * 0.3) * 0.15}
              >
                <cylinderGeometry
                  args={[
                    0.5 - i * 0.05, // top radius gets slightly smaller
                    0.5 - (i + 1) * 0.05, // bottom radius
                    0.35, // height
                    8, // segments
                    1,
                    true,
                    Math.PI * (0.25 + i * 0.02), // adjust arc start
                    Math.PI * (1.5 - i * 0.04), // adjust arc length
                  ]}
                />
                <meshStandardMaterial
                  color="#1565c0"
                  roughness={0.6}
                  metalness={0.1}
                  side={2}
                  emissive="#1565c0"
                  emissiveIntensity={0.05}
                />
              </mesh>
            ))}

            {/* Cape bottom with extra movement */}
            <mesh
              position={[0, -1.35, -0.5]}
              rotation-x={0.3 + Math.sin(Date.now() * 0.001) * 0.2}
              rotation-z={Math.sin(Date.now() * 0.002) * 0.25}
            >
              <cylinderGeometry
                args={[
                  0.3,
                  0.2,
                  0.4,
                  8,
                  1,
                  true,
                  Math.PI * 0.35,
                  Math.PI * 1.3,
                ]}
              />
              <meshStandardMaterial
                color="#1565c0"
                roughness={0.6}
                metalness={0.1}
                side={2}
                emissive="#1565c0"
                emissiveIntensity={0.05}
              />
            </mesh>
          </group>

          {/* Magic Staff */}
          <group
            position={[0.5, 0.2, 0]}
            rotation-z={Math.PI * -0.1}
            rotation-y={Math.sin(Date.now() * 0.001) * 0.1}
          >
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 2, 8]} />
              <meshStandardMaterial color="#4a148c" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial
                color="#4fc3f7"
                emissive="#4fc3f7"
                emissiveIntensity={1}
              />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <coneGeometry args={[0.1, 0.2, 8]} />
              <meshStandardMaterial color="#4a148c" />
            </mesh>
          </group>

          {/* Level up effect */}
          {showLevelUpEffect && (
            <LevelUpEffect onComplete={() => setShowLevelUpEffect(false)} />
          )}
        </group>
      </RigidBody>
      <MagicOrb playerRef={playerRef} />
    </>
  );
}
