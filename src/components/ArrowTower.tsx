import { useRef, useState } from 'react';
import { Vector3, Euler } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Projectile } from './Projectile';

interface ArrowTowerProps {
  position: Vector3;
}

export function ArrowTower({ position }: ArrowTowerProps) {
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [projectiles, setProjectiles] = useState<{ id: number; position: Vector3; target: Vector3; }[]>([]);
  const nextProjectileId = useRef(0);
  const lastAttackTime = useRef(0);
  const towerRef = useRef<THREE.Group>(null);
  const ATTACK_COOLDOWN = 300; // ms
  const ATTACK_RANGE = 15;

  // Spring animation for tower rotation
  const { rotation } = useSpring({
    rotation: target ? [0, Math.atan2(
      target.x - position.x,
      target.z - position.z
    ), 0] : [0, 0, 0],
    config: { tension: 100, friction: 10 }
  });

  useFrame((state) => {
    const currentTime = Date.now();
    if (currentTime - lastAttackTime.current < ATTACK_COOLDOWN) return;

    // Find closest enemy
    const enemiesGroup = state.scene.getObjectByName('enemies');
    let closestEnemy = null;
    let closestDistance = Infinity;

    if (enemiesGroup) {
      for (const enemy of enemiesGroup.children) {
        const distance = position.distanceTo(enemy.position);
        if (distance < closestDistance && distance < ATTACK_RANGE) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
    }

    if (closestEnemy) {
      const targetPos = closestEnemy.position.clone();
      setTarget(targetPos);

      // Calculate spawn position
      const spawnPos = position.clone();
      spawnPos.y += 1.4; // Height of arrow launcher

      // Create new projectile
      const projectileId = nextProjectileId.current++;
      setProjectiles(prev => [...prev, {
        id: projectileId,
        position: spawnPos,
        target: targetPos
      }]);

      lastAttackTime.current = currentTime;
    } else {
      setTarget(null);
    }
  });

  // Remove projectiles that have completed their flight
  const removeProjectile = (position: Vector3, id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <group position={position}>
      <animated.group ref={towerRef} rotation={rotation}>
        {/* Base */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 1]} />
          <meshStandardMaterial color="#8B4513" metalness={0.4} roughness={0.7} />
        </mesh>

        {/* Upper platform */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#A0522D" metalness={0.3} roughness={0.8} />
        </mesh>

        {/* Arrow launcher */}
        <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.3]} />
          <meshStandardMaterial color="#6B4423" metalness={0.5} roughness={0.6} />
        </mesh>
      </animated.group>

      {/* Active Projectiles */}
      {projectiles.map(projectile => (
        <Projectile
          key={projectile.id}
          position={projectile.position}
          target={projectile.target}
          type="bow"
          onComplete={(pos) => removeProjectile(pos, projectile.id)}
        />
      ))}
    </group>
  );
}
