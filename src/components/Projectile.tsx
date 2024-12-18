import { useRef, useState, useEffect, } from 'react';
import { Vector3, Mesh, } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';

function ExplosionEffect({ position }: { position: Vector3 }) {
  const { scale, opacity } = useSpring({
    from: { scale: 0.1, opacity: 1 },
    to: { scale: 2, opacity: 0 },
    config: { tension: 200, friction: 20 }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Core explosion */}
      <animated.mesh scale={scale.to(s => [s, s, s])}>
        <sphereGeometry args={[0.3]} />
        <animated.meshStandardMaterial
          color="#ff4400"
          emissive="#ff8800"
          emissiveIntensity={2}
          transparent
          opacity={opacity}
        />
      </animated.mesh>

      {/* Outer glow */}
      <animated.mesh scale={scale.to(s => [s * 1.2, s * 1.2, s * 1.2])}>
        <sphereGeometry args={[0.3]} />
        <animated.meshStandardMaterial
          color="#ffff00"
          emissive="#ffaa00"
          emissiveIntensity={1}
          transparent
          opacity={opacity.to(o => o * 0.5)}
        />
      </animated.mesh>
    </group>
  );
}

interface ProjectileProps {
  position: Vector3;
  target: Vector3;
  type: 'bow' | 'boomerang';
  onComplete: (position: Vector3) => void;
}

interface TowerProjectileProps {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
  target?: Vector3;
  onHit?: () => void;
}

export function TowerProjectile({ position, color, size = 0.15, speed = 15, target, onHit }: TowerProjectileProps) {
  const meshRef = useRef<Mesh>();
  const velocity = useRef<Vector3>(new Vector3());
  const startPos = useRef<Vector3>(new Vector3(...position));

  useEffect(() => {
    if (!target || !meshRef.current) return;

    // Calculate initial velocity
    velocity.current = target.clone()
      .sub(startPos.current)
      .normalize()
      .multiplyScalar(speed);

    // Set initial position
    meshRef.current.position.copy(startPos.current);
  }, [target, speed]);

  useFrame((_, delta) => {
    if (!meshRef.current || !target) return;

    // Update position
    const newPos = meshRef.current.position.clone().add(velocity.current.clone().multiplyScalar(delta));
    meshRef.current.position.copy(newPos);

    // Check if we hit the target
    const distanceToTarget = meshRef.current.position.distanceTo(target);
    if (distanceToTarget < 0.5) {
      onHit?.();
    }

    // Look in the direction of travel
    meshRef.current.lookAt(meshRef.current.position.clone().add(velocity.current));
  });

  return (
    <mesh ref={meshRef} position={position}>
      {/* Projectile body */}
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.8}
      />

      {/* Glowing trail */}
      <pointLight
        color={color}
        intensity={2}
        distance={2}
        decay={2}
      />
    </mesh>
  );

  function ExplosionEffect({ position }: { position: Vector3 }) {
    const { scale, opacity } = useSpring({
      from: { scale: 0.1, opacity: 1 },
      to: { scale: 2, opacity: 0 },
      config: { tension: 200, friction: 20 }
    });

    return (
      <group position={[position.x, position.y, position.z]}>
        {/* Core explosion */}
        <animated.mesh scale={scale.to(s => [s, s, s])}>
          <sphereGeometry args={[0.3]} />
          <animated.meshStandardMaterial
            color="#ff4400"
            emissive="#ff8800"
            emissiveIntensity={2}
            transparent
            opacity={opacity}
          />
        </animated.mesh>

        {/* Outer glow */}
        <animated.mesh scale={scale.to(s => [s * 1.2, s * 1.2, s * 1.2])}>
          <sphereGeometry args={[0.3]} />
          <animated.meshStandardMaterial
            color="#ffff00"
            emissive="#ffaa00"
            emissiveIntensity={1}
            transparent
            opacity={opacity.to(o => o * 0.5)}
          />
        </animated.mesh>
      </group>
    );
  }
}

interface ProjectileProps {
  position: Vector3;
  target: Vector3;
  type: 'bow' | 'boomerang';
  onComplete: (position: Vector3) => void;
}

export function Projectile({ position, type, target, onComplete }: ProjectileProps) {
  const rigidBodyRef = useRef<any>(null);
  const arrowRef = useRef<any>(null);
  const startPos = useRef(position.clone());
  const timeRef = useRef(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState<Vector3 | null>(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [hasHitEnemy, setHasHitEnemy] = useState(false);
  const currentPos = useRef(position.clone());
  const AOE_RADIUS = 1.5; // Area of effect radius

  const arrowLifetime = 1.5;
  const ARROW_FLIGHT_TIME = 0.5;

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || hasHitEnemy) return;
    timeRef.current += delta;

    if (type === 'bow') {
      if (hasLanded) {
        if (timeRef.current >= arrowLifetime) {
          onComplete(currentPos.current);
        }
        return;
      }

      const progress = Math.min(timeRef.current / ARROW_FLIGHT_TIME, 1);
      const direction = target.clone().sub(startPos.current);
      const height = Math.max(direction.length() * 0.2, 1);

      // Calculate position with arc
      const currentPoint = startPos.current.clone().lerp(target, progress);
      currentPoint.y += Math.sin(progress * Math.PI) * height;

      // Update position
      currentPos.current.copy(currentPoint);
      rigidBodyRef.current.setTranslation(currentPos.current);

      // Calculate next point for rotation
      const nextProgress = Math.min(progress + 0.05, 1);
      const nextPoint = startPos.current.clone().lerp(target, nextProgress);
      nextPoint.y += Math.sin(nextProgress * Math.PI) * height;

      // Update rotation to match trajectory
      if (!hasLanded && arrowRef.current) {
        const velocity = nextPoint.clone().sub(currentPoint);
        if (velocity.length() > 0) {
          // Create a target point in the direction of travel
          const target = currentPoint.clone().add(velocity);

          // Store the current position
          const position = arrowRef.current.position.clone();

          // Look at the target
          arrowRef.current.lookAt(target);

          // Rotate 90 degrees around the right vector to align arrow with trajectory
          arrowRef.current.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 2);

          // Restore position (lookAt can sometimes affect position)
          arrowRef.current.position.copy(position);
        }
      }

      if (progress >= 1) {
        setHasLanded(true);
        // Create explosion effect at landing
        setShowExplosion(true);
        setExplosionPosition(currentPos.current.clone());
      }
    }
  });

  const handleCollision = (event: any) => {
    if (!hasHitEnemy && event.other.rigidBodyObject?.name === 'enemy') {
      setHasHitEnemy(true);
      const pos = rigidBodyRef.current.translation();
      setExplosionPosition(new Vector3(pos.x, pos.y, pos.z));
      setShowExplosion(true);

      // Find and damage nearby enemies
      const nearbyEnemies = Object.values(rigidBodyRef.current.world.bodies).filter((body: any) => {
        if (body.rigidBodyObject?.name !== 'enemy') return false;
        const enemyPos = body.translation();
        const distance = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z)
          .distanceTo(new Vector3(pos.x, pos.y, pos.z));
        return distance <= AOE_RADIUS;
      });

      // Apply AOE damage to nearby enemies
      nearbyEnemies.forEach((enemy: any) => {
        const enemyPos = enemy.translation();
        const distance = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z)
          .distanceTo(new Vector3(pos.x, pos.y, pos.z));

        // Mark hit as AOE for damage calculation
        enemy.rigidBodyObject.userData.isAOE = distance > 0.5;

        // Trigger collision with each nearby enemy
        enemy.rigidBodyObject?.onCollisionEnter?.({
          other: { rigidBodyObject: rigidBodyRef.current.rigidBodyObject, rigidBody: rigidBodyRef.current }
        });
      });

      // Remove projectile after effect
      setTimeout(() => {
        setShowExplosion(false);
        onComplete(currentPos.current);
      }, 500);
    }
  };

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="kinematicPosition"
        position={[position.x, position.y, position.z]}
        name="projectile"
        userData={{ type: 'projectile', projectileType: type }}
        onCollisionEnter={handleCollision}
      >
        <CuboidCollider args={[0.1, 0.1, 0.25]} sensor />
        {type === 'bow' ? (
          <group ref={arrowRef} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Arrow shaft */}
            <mesh>
              <cylinderGeometry args={[0.07, 0.07, 1.2]} />
              <meshStandardMaterial color="#4a3728" />
            </mesh>
            {/* Arrow head */}
            <mesh position={[0, 0.6, 0]}>
              <coneGeometry args={[0.16, 0.4]} />
              <meshStandardMaterial color="#636363" />
            </mesh>
          </group>
        ) : (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.6, 0.1, 0.02]} />
              <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        )}
      </RigidBody>

      {/* Explosion effect */}
      {showExplosion && explosionPosition && (
        <ExplosionEffect position={explosionPosition} />
      )}
    </>
  );
}