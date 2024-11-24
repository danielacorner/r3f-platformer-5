import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, vec3 } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';
import { Html } from '@react-three/drei';

interface EnemyProps {
  position: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, onDeath }: EnemyProps) {
  const enemyRef = useRef<any>(null);
  const [health, setHealth] = useState(100);
  const { setEnemiesAlive } = useGameStore();

  useEffect(() => {
    setEnemiesAlive(prev => prev + 1);
    return () => setEnemiesAlive(prev => prev - 1);
  }, []);

  useFrame(() => {
    if (!enemyRef.current) return;
    // Simple AI: Move towards portal
    const currentPos = enemyRef.current.translation();
    const targetPos = new Vector3(8, 2, 8); // Portal position
    const direction = new Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z).normalize();
    
    const velocity = vec3({ x: direction.x * 2, y: currentPos.y < 1 ? 5 : 0, z: direction.z * 2 });
    enemyRef.current.setLinvel(velocity);
  });

  const handleCollision = (event: any) => {
    const collidedWith = event.colliderObject;
    if (collidedWith && collidedWith.name === 'projectile') {
      const damage = collidedWith.userData?.type === 'boomerang' ? 50 : 25;
      setHealth(prev => {
        const newHealth = Math.max(0, prev - damage);
        if (newHealth <= 0) {
          onDeath();
        }
        return newHealth;
      });
    }
  };

  return (
    <RigidBody 
      ref={enemyRef} 
      position={[position.x, position.y, position.z]}
      onCollisionEnter={handleCollision}
      enabledRotations={[false, false, false]}
      lockRotations
      mass={1}
    >
      <mesh name="enemy">
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <Html
        position={[0, 1.2, 0]}
        center
        style={{
          width: '50px',
          height: '6px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px',
          overflow: 'hidden',
          transform: 'scale(1)',
        }}
      >
        <div
          style={{
            width: `${health}%`,
            height: '100%',
            background: `rgb(${255 - (health * 2.55)}, ${health * 2.55}, 0)`,
            transition: 'all 0.3s',
          }}
        />
      </Html>
    </RigidBody>
  );
}