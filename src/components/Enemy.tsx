import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, vec3 } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';
import { Html } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';

interface EnemyProps {
  position: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, onDeath }: EnemyProps) {
  const enemyRef = useRef<any>(null);
  const [health, setHealth] = useState(100);
  const { setEnemiesAlive } = useGameStore();
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9));
  const [isHit, setIsHit] = useState(false);
  const [isStunned, setIsStunned] = useState(false);
  const stunTimeoutRef = useRef<any>(null);

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
        
        // Calculate direction from projectile to enemy
        const knockbackDir = new Vector3(
          enemyPos.x - projectilePos.x,
          0,
          enemyPos.z - projectilePos.z
        ).normalize();

        // Apply knockback force
        const knockbackForce = 8; // Adjust this value to control knockback strength
        const upwardForce = 3; // Reduced upward force
        enemyRef.current.setLinvel(vec3({
          x: knockbackDir.x * knockbackForce,
          y: upwardForce,
          z: knockbackDir.z * knockbackForce
        }));

        // Clear any existing stun timeout
        if (stunTimeoutRef.current) {
          clearTimeout(stunTimeoutRef.current);
        }

        // Set stun duration
        stunTimeoutRef.current = setTimeout(() => {
          setIsStunned(false);
        }, 300); // 300ms stun duration
      }
    }
  };

  useFrame(() => {
    if (!enemyRef.current || health <= 0 || isStunned) return;

    // Simple AI: Move towards portal
    const currentPos = enemyRef.current.translation();
    const targetPos = new Vector3(8, 2, 8); // Portal position
    const direction = new Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z).normalize();
    
    const velocity = vec3({ x: direction.x * 2, y: currentPos.y < 1 ? 5 : 0, z: direction.z * 2 });
    enemyRef.current.setLinvel(velocity);
  });

  if (health <= 0) return null;

  return (
    <RigidBody 
      ref={enemyRef} 
      position={[position.x, position.y, position.z]}
      enabledRotations={[false, false, false]}
      lockRotations
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