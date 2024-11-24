import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, vec3, RapierRigidBody } from '@react-three/rapier';
import { Vector3, MathUtils } from 'three';
import { useGameStore } from '../store/gameStore';
import { Html } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';

interface EnemyProps {
  position: Vector3;
  onDeath: () => void;
}

const ENEMY_SPEED = 3;
const DETECTION_RANGE = 15;
const AVOID_RANGE = 2;
const PATH_UPDATE_INTERVAL = 500; // ms

export function Enemy({ position, onDeath }: EnemyProps) {
  const enemyRef = useRef<RapierRigidBody>(null);
  const [health, setHealth] = useState(100);
  const { setEnemiesAlive, player } = useGameStore();
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9));
  const [isHit, setIsHit] = useState(false);
  const [isStunned, setIsStunned] = useState(false);
  const stunTimeoutRef = useRef<any>(null);
  const lastPathUpdateRef = useRef(0);
  const targetPositionRef = useRef(new Vector3(8, 2, 8));
  const avoidanceForceRef = useRef(new Vector3());

  // Animation for hit effect
  const { scale, color } = useSpring({
    scale: isHit ? 1.2 : 1,
    color: isHit ? '#ff0000' : '#aa0000',
    config: { ...config.wobbly, tension: 300, friction: 10 },
    onRest: () => setIsHit(false),
  });

  useEffect(() => {
    setEnemiesAlive(prev => prev + 1);
    return () => {
      setEnemiesAlive(prev => prev - 1);
      if (stunTimeoutRef.current) {
        clearTimeout(stunTimeoutRef.current);
      }
    };
  }, []);

  const handleCollision = (event: any) => {
    const collidedWith = event.other;
    if (collidedWith?.rigidBody?.userData?.type === 'projectile') {
      const damage = collidedWith.rigidBody.userData.damage || (collidedWith.rigidBody.userData.projectileType === 'bow' ? 35 : 25);
      setHealth(prev => {
        const newHealth = Math.max(0, prev - damage);
        if (newHealth <= 0) {
          onDeath();
        }
        return newHealth;
      });
      setIsHit(true);
      setIsStunned(true);

      // Calculate knockback direction from projectile
      if (enemyRef.current && collidedWith.rigidBody) {
        const enemyPos = enemyRef.current.translation();
        const projectilePos = collidedWith.rigidBody.translation();
        
        const knockbackDir = new Vector3(
          enemyPos.x - projectilePos.x,
          0,
          enemyPos.z - projectilePos.z
        ).normalize();

        const knockbackForce = 8;
        const upwardForce = 3;
        enemyRef.current.setLinvel(vec3({
          x: knockbackDir.x * knockbackForce,
          y: upwardForce,
          z: knockbackDir.z * knockbackForce
        }));

        if (stunTimeoutRef.current) {
          clearTimeout(stunTimeoutRef.current);
        }

        stunTimeoutRef.current = setTimeout(() => {
          setIsStunned(false);
        }, 300);
      }
    }
  };

  const calculateAvoidanceForce = (currentPos: Vector3) => {
    const avoidanceForce = new Vector3();
    const scene = enemyRef.current?.scene;
    
    if (!scene) return avoidanceForce;

    // Get all enemies in the scene
    scene.children.forEach((child: any) => {
      if (child.name === 'enemy' && child.rigidBody && child.rigidBody !== enemyRef.current) {
        const otherPos = child.rigidBody.translation();
        const otherPosition = new Vector3(otherPos.x, otherPos.y, otherPos.z);
        const distance = currentPos.distanceTo(otherPosition);

        if (distance < AVOID_RANGE) {
          const avoidDir = currentPos.clone().sub(otherPosition).normalize();
          const strength = 1 - (distance / AVOID_RANGE);
          avoidanceForce.add(avoidDir.multiplyScalar(strength * 2));
        }
      }
    });

    return avoidanceForce;
  };

  useFrame((_, delta) => {
    if (!enemyRef.current || health <= 0 || isStunned) return;

    const currentTime = performance.now();
    const currentPos = enemyRef.current.translation();
    const enemyPosition = new Vector3(currentPos.x, currentPos.y, currentPos.z);

    // Update target position periodically
    if (currentTime - lastPathUpdateRef.current > PATH_UPDATE_INTERVAL) {
      // Check if player is in range
      if (player?.position) {
        const distanceToPlayer = enemyPosition.distanceTo(player.position);
        if (distanceToPlayer < DETECTION_RANGE) {
          // Target player if in range
          targetPositionRef.current.copy(player.position);
        } else {
          // Target portal if player is out of range
          targetPositionRef.current.set(8, 2, 8);
        }
      }
      
      // Calculate avoidance force
      avoidanceForceRef.current = calculateAvoidanceForce(enemyPosition);
      lastPathUpdateRef.current = currentTime;
    }

    // Calculate movement direction
    const direction = targetPositionRef.current.clone().sub(enemyPosition);
    direction.y = 0; // Keep movement on xz plane
    direction.normalize();

    // Add avoidance force
    direction.add(avoidanceForceRef.current);
    direction.normalize();

    // Apply movement
    const yVelocity = currentPos.y < 1 ? 5 : 0; // Jump if below ground level
    const velocity = vec3({
      x: direction.x * ENEMY_SPEED,
      y: yVelocity,
      z: direction.z * ENEMY_SPEED
    });
    
    enemyRef.current.setLinvel(velocity);

    // Smooth rotation towards movement direction
    if (direction.length() > 0.1) {
      const currentRotation = enemyRef.current.rotation();
      const targetRotation = Math.atan2(direction.x, direction.z);
      const newRotation = MathUtils.lerp(
        currentRotation.y,
        targetRotation,
        delta * 5
      );
      enemyRef.current.setRotation({ x: 0, y: newRotation, z: 0 });
    }
  });

  if (health <= 0) return null;

  return (
    <RigidBody 
      ref={enemyRef} 
      position={[position.x, position.y, position.z]}
      enabledRotations={[false, true, false]}
      lockRotations={false}
      mass={1}
      name="enemy"
      userData={{ id: uniqueId.current }}
      onCollisionEnter={handleCollision}
    >
      <animated.group scale={scale}>
        <animated.mesh name="enemy">
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <animated.meshStandardMaterial color={color} opacity={isStunned ? 0.7 : 1} transparent />
        </animated.mesh>
      </animated.group>
      <Html
        position={[0, 1, 0]}
        center
        occlude
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0.75)',
          width: '40px',
          height: '4px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '2px',
          overflow: 'hidden',
          pointerEvents: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        <div
          style={{
            width: `${health}%`,
            height: '100%',
            background: `rgb(${255 - (health * 2.55)}, ${health * 2.55}, 0)`,
            transition: 'width 0.2s ease-out',
          }}
        />
      </Html>
    </RigidBody>
  );
}