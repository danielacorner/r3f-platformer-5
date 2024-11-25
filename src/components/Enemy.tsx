import { useRef, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface EnemyProps {
  position: Vector3;
  target: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, target, onDeath }: EnemyProps) {
  const rigidBodyRef = useRef<any>(null);
  const [health, setHealth] = useState(100);
  const [isHit, setIsHit] = useState(false);
  const [isImmune, setIsImmune] = useState(true);
  const [shieldOpacity, setShieldOpacity] = useState(1);
  const moveSpeed = 2;
  const ENEMY_SIZE = 0.6;
  const ARENA_Y_LEVEL = 0.5; // Y level at which immunity is removed

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    const currentPosition = rigidBodyRef.current.translation();

    // Check if enemy has reached arena level
    if (isImmune && currentPosition.y <= ARENA_Y_LEVEL) {
      setIsImmune(false);
    }

    // Update shield opacity based on position
    if (isImmune) {
      const pulseFrequency = state.clock.elapsedTime * 3;
      setShieldOpacity(0.3 + Math.sin(pulseFrequency) * 0.2);
    }

    const direction = new Vector3(
      target.x - currentPosition.x,
      0,
      target.z - currentPosition.z
    ).normalize();

    const velocity = rigidBodyRef.current.linvel();

    rigidBodyRef.current.setLinvel(
      {
        x: direction.x * moveSpeed,
        y: velocity.y,
        z: direction.z * moveSpeed
      },
      true
    );
  });

  useEffect(() => {
    if (health <= 0) {
      onDeath();
    }
  }, [health, onDeath]);

  const handleHit = (damage: number, knockback: Vector3) => {
    if (!rigidBodyRef.current || isImmune) return;

    setHealth(prev => prev - damage);
    setIsHit(true);

    // Apply knockback
    const currentVel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel(
      {
        x: currentVel.x + knockback.x,
        y: currentVel.y + knockback.y,
        z: currentVel.z + knockback.z
      },
      true
    );

    // Reset hit effect
    setTimeout(() => setIsHit(false), 200);
  };

  const handleCollision = (event: any) => {
    if (event.other.rigidBodyObject?.name === 'projectile') {
      const projectileData = event.other.rigidBodyObject.userData;
      const damage = projectileData.isAOE ? 15 : 20; // Less damage for AOE hits
      const projectileVel = event.other.rigidBody.linvel();
      const knockback = new Vector3(projectileVel.x, 0.5, projectileVel.z).normalize().multiplyScalar(5);
      handleHit(damage, knockback);
    }
  };

  if (health <= 0) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[position.x, position.y, position.z]}
      enabledRotations={[false, false, false]}
      type="dynamic"
      mass={1}
      restitution={0.2}
      friction={1}
      linearDamping={0.5}
      gravityScale={1}
      onCollisionEnter={handleCollision}
    >
      <group>
        {/* Health bar */}
        <Html
          position={[0, ENEMY_SIZE * 2, 0]}
          center
          style={{
            width: '60px',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            width: '100%',
            height: '6px',
            background: '#333',
            border: '1px solid #000',
            borderRadius: '3px',
            overflow: 'hidden',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              background: health > 50 ? '#00ff00' : health > 25 ? '#ffff00' : '#ff0000',
              transition: 'all 0.2s',
              boxShadow: isHit ? '0 0 8px #fff' : 'none'
            }} />
          </div>
        </Html>

        {/* Enemy mesh */}
        <mesh castShadow scale={isHit ? 1.2 : 1}>
          <sphereGeometry args={[ENEMY_SIZE]} />
          <meshStandardMaterial
            color={isHit ? '#ff0000' : '#aa0000'}
            emissive={isHit ? '#ff0000' : '#000000'}
            emissiveIntensity={isHit ? 0.5 : 0}
          />
        </mesh>

        {/* Shield effect */}
        {isImmune && (
          <mesh scale={1.2}>
            <sphereGeometry args={[ENEMY_SIZE]} />
            <meshStandardMaterial
              color="#00ffff"
              transparent
              opacity={shieldOpacity}
              emissive="#00ffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}