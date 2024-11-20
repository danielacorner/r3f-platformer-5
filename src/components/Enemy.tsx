import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, vec3 } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';

interface EnemyProps {
  position: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, onDeath }: EnemyProps) {
  const enemyRef = useRef(null);
  const health = useRef(100);
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
    const direction = targetPos.sub(new Vector3(currentPos.x, currentPos.y, currentPos.z)).normalize();
    
    const velocity = vec3({ x: direction.x * 2, y: 0, z: direction.z * 2 });
    enemyRef.current.setLinvel(velocity);
  });

  const handleHit = (damage: number) => {
    health.current -= damage;
    if (health.current <= 0) {
      onDeath();
    }
  };

  return (
    <RigidBody ref={enemyRef} position={[position.x, position.y, position.z]}>
      <mesh>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
}