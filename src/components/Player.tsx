import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import { Html } from '@react-three/drei';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { Projectile } from './Projectile';
import { TargetIndicator } from './TargetIndicator';
import { useGameStore } from '../store/gameStore';

const MOVE_SPEED = 8;
const JUMP_FORCE = 10;

export function Player() {
  const playerRef = useRef<any>(null);
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [projectileId, setProjectileId] = useState(0);
  const [boomerangsLeft, setBoomerangsLeft] = useState(3);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [isGrounded, setIsGrounded] = useState(false);
  const { forward, backward, left, right, jump } = useKeyboardControls();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const lastShotTime = useRef(0);
  const SHOT_COOLDOWN = 0.3; // seconds
  const phase = useGameStore(state => state.phase);

  // Store player ref in game store for camera following
  useEffect(() => {
    useGameStore.getState().setPlayerRef(playerRef);
  }, []);

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

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (phase !== 'combat' || !targetPosition) return;

      const currentTime = performance.now() / 1000;
      if (currentTime - lastShotTime.current < SHOT_COOLDOWN) return;
      lastShotTime.current = currentTime;

      const position = playerRef.current?.translation();
      if (!position) return;
      
      const playerPos = new Vector3(position.x, position.y + 0.5, position.z);

      if (event.button === 2 && boomerangsLeft > 0) {
        setBoomerangsLeft(prev => prev - 1);
        setProjectiles(prev => [...prev, {
          id: projectileId,
          position: playerPos,
          type: 'boomerang',
          target: targetPosition
        }]);
        setProjectileId(prev => prev + 1);
      } else if (event.button === 0) {
        setProjectiles(prev => [...prev, {
          id: projectileId,
          position: playerPos,
          type: 'bow',
          target: targetPosition
        }]);
        setProjectileId(prev => prev + 1);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [phase, targetPosition, projectileId, boomerangsLeft]);

  const handleProjectileComplete = (position: Vector3, type: string, id: number) => {
    if (type === 'boomerang') {
      // Check if player is close to the boomerang
      if (playerRef.current) {
        const playerPos = playerRef.current.translation();
        const distance = position.distanceTo(new Vector3(playerPos.x, playerPos.y, playerPos.z));
        if (distance < 2) {
          setBoomerangsLeft(prev => prev + 1);
        }
      }
    }
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  useFrame(() => {
    if (!playerRef.current) return;

    // Calculate movement direction in camera space
    const moveDirection = new Vector3(0, 0, 0);
    
    // In isometric view:
    // Forward (W) should move up-right
    // Left (A) should move up-left
    // Back (S) should move down-left
    // Right (D) should move down-right
    
    if (forward) {
      moveDirection.x -= 1; // Move left
      moveDirection.z -= 1; // Move forward
    }
    if (backward) {
      moveDirection.x += 1; // Move right
      moveDirection.z += 1; // Move back
    }
    if (left) {
      moveDirection.x -= 1; // Move left
      moveDirection.z += 1; // Move back
    }
    if (right) {
      moveDirection.x += 1; // Move right
      moveDirection.z -= 1; // Move forward
    }

    const currentVel = playerRef.current.linvel();

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      
      playerRef.current.setLinvel({
        x: moveDirection.x * MOVE_SPEED,
        y: currentVel.y,
        z: moveDirection.z * MOVE_SPEED
      });
    } else {
      playerRef.current.setLinvel({
        x: 0,
        y: currentVel.y,
        z: 0
      });
    }

    if (jump && isGrounded) {
      playerRef.current.setLinvel({
        x: currentVel.x,
        y: JUMP_FORCE,
        z: currentVel.z
      });
      setIsGrounded(false);
    }
  });

  return (
    <>
      <RigidBody 
        ref={playerRef}
        position={[0, 5, 0]}
        enabledRotations={[false, false, false]}
        lockRotations
        mass={1}
        colliders="ball"
        onCollisionEnter={() => setIsGrounded(true)}
        onCollisionExit={() => setIsGrounded(false)}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            pointerEvents: 'none', 
            userSelect: 'none'
          }}>
            {boomerangsLeft}
          </div>
        </Html>
      </RigidBody>

      {targetPosition && <TargetIndicator position={targetPosition} />}

      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          position={proj.position}
          type={proj.type}
          target={proj.target}
          onComplete={(position) => handleProjectileComplete(position, proj.type, proj.id)}
        />
      ))}
    </>
  );
}