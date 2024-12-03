import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Vector3, Group, CircleGeometry, DoubleSide, LineBasicMaterial, Line, BufferGeometry, Float32BufferAttribute } from "three";
import { useGameStore } from "../store/gameStore";
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { MagicOrb } from './MagicOrb';
import { LevelUpEffect } from './LevelUpEffect';

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
  const { camera } = useThree();
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const prevLevel = useRef(1);
  const level = useGameStore(state => state.level);
  const range = useGameStore(state => state.upgrades.range);
  const lastMoveTime = useRef(Date.now());
  const stuckCheckInterval = useRef<number | null>(null);
  const [rigidBodyKey, setRigidBodyKey] = useState(0);

  // Monitor movement state
  useEffect(() => {
    const checkMovement = () => {
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - lastMoveTime.current;
      
      // If we haven't moved for 5 seconds and should be moving
      if (timeSinceLastMove > 5000 && moveTargetRef.current?.active) {
        console.log("Movement appears stuck, recreating physics body");
        // Force RigidBody recreation by changing its key
        setRigidBodyKey(prev => prev + 1);
        if (moveTargetRef.current) moveTargetRef.current.active = false;
      }
    };

    stuckCheckInterval.current = window.setInterval(checkMovement, 1000);

    return () => {
      if (stuckCheckInterval.current !== null) {
        clearInterval(stuckCheckInterval.current);
      }
    };
  }, []);

  // Store initial camera offset
  useEffect(() => {
    if (!playerRef.current) return;
    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);
    cameraOffset.current = new Vector3().subVectors(camera.position, playerPos);
  }, []);

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
    lineGeometry.setAttribute('position', new Float32BufferAttribute(geometry, 3));
    
    return lineGeometry;
  }, [range]);

  // Handle movement and rotation
  useFrame((state, delta) => {
    if (!playerRef.current || !visualRef.current || !cameraOffset.current) return;

    const position = playerRef.current.translation();
    const currentPos2 = new Vector3(position.x, position.y, position.z);

    // Update last move time if position has changed
    if (!currentPos2.equals(lastValidPosition.current)) {
      lastMoveTime.current = Date.now();
    }

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
        velocity.x = directionToTarget.x * MOVE_SPEED;
        velocity.z = directionToTarget.z * MOVE_SPEED;
      } else {
        if (moveTargetRef.current) moveTargetRef.current.active = false;
      }
    }

    // Apply movement if there is any velocity
    if (velocity.x !== 0 || velocity.z !== 0) {
      // Reset physics body if it's in an invalid state
      if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        playerRef.current.setTranslation(lastValidPosition.current);
        playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
        playerRef.current.resetForces(true);
        if (moveTargetRef.current) moveTargetRef.current.active = false;
        return;
      }

      playerRef.current.setLinvel({
        x: velocity.x,
        y: 0,
        z: velocity.z
      });

      // Rotate visual group based on movement direction
      const angle = Math.atan2(velocity.x, velocity.z);
      visualRef.current.rotation.y = angle;
    } else {
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }

    // Keep player at float height
    const currentPos = playerRef.current.translation();
    playerRef.current.setTranslation({
      x: currentPos.x,
      y: FLOAT_HEIGHT + Math.sin(state.clock.elapsedTime * FLOAT_SPEED) * 0.1,
      z: currentPos.z
    });

    // Update last valid position
    if (!isNaN(currentPos.x) && !isNaN(currentPos.y) && !isNaN(currentPos.z)) {
      lastValidPosition.current.set(currentPos.x, currentPos.y, currentPos.z);
    } else {
      // Reset to last valid position if current position is invalid
      playerRef.current.setTranslation(lastValidPosition.current);
      if (moveTargetRef.current) moveTargetRef.current.active = false;
      return;
    }

    // Update camera position while maintaining offset
    const targetCameraPos = new Vector3(
      lastValidPosition.current.x + cameraOffset.current.x,
      state.camera.position.y,
      lastValidPosition.current.z + cameraOffset.current.z
    );

    state.camera.position.lerp(targetCameraPos, CAMERA_LERP);
    state.camera.lookAt(lastValidPosition.current.x, 0, lastValidPosition.current.z);
  });

  return (
    <>
      <RigidBody
        key={rigidBodyKey}
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={lastValidPosition.current.toArray()}
        enabledRotations={[false, false, false]}
      >
        <CuboidCollider args={[0.3, 0.4, 0.3]} position={[0, FLOAT_HEIGHT, 0]} />
        <group ref={visualRef}>
          {/* Range Indicator */}
          <line rotation-x={-Math.PI / 2} position={[0, 0.1, 0]}>
            <primitive object={rangeIndicator} />
            <lineBasicMaterial color="#4c99f7" linewidth={1}  />
          </line>

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
