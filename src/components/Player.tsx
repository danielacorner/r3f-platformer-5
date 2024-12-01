import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Raycaster, Matrix4 } from 'three';
import { Html } from '@react-three/drei';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { Projectile } from './Projectile';
import { useGameStore } from '../store/gameStore';
import { LEVEL_CONFIGS } from './Level';
import { useSpring, animated } from '@react-spring/three';

const MOVE_SPEED = 5;
const SHOT_COOLDOWN = 0.5;
const ARROW_DAMAGE = 25;

function TargetIndicator({ position }: { position: Vector3 }) {
  const { scale, opacity } = useSpring({
    from: { scale: 0.1, opacity: 0 },
    to: [
      { scale: 1.5, opacity: 0.8 },
      { scale: 1, opacity: 0 }
    ],
    config: { tension: 200, friction: 20 }
  });

  return (
    <group position={[position.x, 0.1, position.z]}>
      <animated.mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale.to(s => [s, s, s])}>
        <ringGeometry args={[0, 0.5, 16]} />
        <animated.meshBasicMaterial color="#fbbf24" transparent opacity={opacity} />
      </animated.mesh>
    </group>
  );
}

export function Player() {
  const playerRef = useRef<any>(null);
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [projectileId, setProjectileId] = useState(0);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const raycaster = useRef(new Raycaster());
  const lastShotTime = useRef(0);
  const { phase } = useGameStore();
  const selectedObjectType = useGameStore(state => state.selectedObjectType);
  const { forward, backward, left, right } = useKeyboardControls();
  const { camera, scene } = useThree();
  const lastClickTime = useRef(0);
  const moveTargetRef = useRef<Vector3 | null>(null);
  const [moveTargets, setMoveTargets] = useState<{ id: number; position: Vector3 }[]>([]);
  const nextTargetId = useRef(0);

  // Store player ref in game store for camera following
  useEffect(() => {
    useGameStore.getState().setPlayerRef(playerRef);
  }, []);

  // Handle mouse movement for aiming
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (phase !== 'combat') return;

      const mouse = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };

      raycaster.current.setFromCamera(mouse, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      const hit = intersects.find(intersect =>
        intersect.object.name === 'platform' ||
        intersect.object.parent?.name === 'platform'
      );

      setTargetPosition(hit ? hit.point : null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera, scene, phase]);

  // Handle shooting and movement clicks
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (phase !== 'combat' || !targetPosition) return;
      
      const currentTime = performance.now();
      const position = playerRef.current?.translation();
      if (!position) return;

      // Handle double click for movement
      if (event.button === 0) { // Left click
        if (currentTime - lastClickTime.current < 300) { // Double click threshold
          moveTargetRef.current = targetPosition.clone();
          // Add move target indicator
          const newTarget = {
            id: nextTargetId.current++,
            position: targetPosition.clone()
          };
          setMoveTargets(prev => [...prev, newTarget]);
          // Remove indicator after animation
          setTimeout(() => {
            setMoveTargets(prev => prev.filter(t => t.id !== newTarget.id));
          }, 1000);
        } else if (!selectedObjectType) { // Single click - shoot if no tower selected
          if (currentTime / 1000 - lastShotTime.current < SHOT_COOLDOWN) return;
          lastShotTime.current = currentTime / 1000;

          const playerPos = new Vector3(position.x, position.y + 0.5, position.z);
          setProjectiles(prev => [...prev, {
            id: projectileId,
            position: playerPos,
            type: 'arrow',
            target: targetPosition
          }]);
          setProjectileId(prev => prev + 1);
        }
        lastClickTime.current = currentTime;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [phase, targetPosition, projectileId, selectedObjectType]);

  // Handle movement and rotation
  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const position = playerRef.current.translation();
    let moveX = 0;
    let moveZ = 0;

    // Get camera direction
    const cameraDirection = new Vector3();
    const cameraRight = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    cameraRight.crossVectors(cameraDirection, new Vector3(0, 1, 0)).normalize();

    // WASD movement relative to camera
    if (forward) {
      moveX += cameraDirection.x * MOVE_SPEED * delta;
      moveZ += cameraDirection.z * MOVE_SPEED * delta;
    }
    if (backward) {
      moveX -= cameraDirection.x * MOVE_SPEED * delta;
      moveZ -= cameraDirection.z * MOVE_SPEED * delta;
    }
    if (left) {
      moveX -= cameraRight.x * MOVE_SPEED * delta;
      moveZ -= cameraRight.z * MOVE_SPEED * delta;
    }
    if (right) {
      moveX += cameraRight.x * MOVE_SPEED * delta;
      moveZ += cameraRight.z * MOVE_SPEED * delta;
    }

    // Target-based movement
    if (moveTargetRef.current) {
      const targetPos = moveTargetRef.current;
      const directionToTarget = new Vector3(
        targetPos.x - position.x,
        0,
        targetPos.z - position.z
      ).normalize();

      const distanceToTarget = new Vector3(
        targetPos.x - position.x,
        0,
        targetPos.z - position.z
      ).length();

      if (distanceToTarget > 0.1) {
        moveX = directionToTarget.x * MOVE_SPEED * delta;
        moveZ = directionToTarget.z * MOVE_SPEED * delta;
      } else {
        moveTargetRef.current = null;
      }
    }

    // Apply movement
    if (moveX !== 0 || moveZ !== 0) {
      const newPosition = {
        x: position.x + moveX,
        y: 0.5, // Keep fixed height
        z: position.z + moveZ
      };
      playerRef.current.setTranslation(newPosition);

      // Rotate player to face movement direction
      const angle = Math.atan2(moveX, moveZ);
      playerRef.current.setRotation({ x: 0, y: angle, z: 0 });
    }
  });

  return (
    <>
      <RigidBody
        ref={playerRef}
        type="kinematicPosition"
        position={[0, 0.5, 0]}
        enabledRotations={[false, true, false]}
        lockRotations
        mass={1}
        friction={0.5}
      >
        <CuboidCollider args={[0.3, 0.5, 0.3]} />
        <group>
          {/* Player body */}
          <mesh castShadow>
            <capsuleGeometry args={[0.3, 1, 8]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>

          {/* Bow */}
          <group position={[0.4, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <torusGeometry args={[0.3, 0.03, 16, 32, Math.PI * 1.5]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            {/* Bowstring */}
            <mesh>
              <cylinderGeometry args={[0.01, 0.01, 0.6]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>

        {/* Projectiles */}
        {projectiles.map(({ id, position, target }) => (
          <Projectile
            key={id}
            position={position}
            target={target}
            type="bow"
            onComplete={(pos) => {
              setProjectiles(prev => prev.filter(p => p.id !== id));
            }}
          />
        ))}
      </RigidBody>

      {/* Move Target Indicators */}
      {moveTargets.map(target => (
        <TargetIndicator key={target.id} position={target.position} />
      ))}
    </>
  );
}