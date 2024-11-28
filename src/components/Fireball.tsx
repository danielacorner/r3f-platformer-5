import { useRef, useMemo, useState } from 'react';
import { Vector3, Quaternion } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Sparkles, Billboard } from '@react-three/drei';

const FIREBALL_SPEED = 12;
const LIFETIME = 3;
const FIREBALL_DAMAGE = 40;
const PARTICLE_COUNT = 100;
const GRAVITY = -20;
const MIN_HEIGHT = 6;
const EXPLOSION_RADIUS = 5;
const EXPLOSION_DURATION = 0.8;
const EXPLOSION_FORCE = 20;

interface FireballProps {
  position: Vector3;
  direction: Vector3;
  targetPosition: Vector3;
  splashRadius: number;
  onComplete: () => void;
}

export function Fireball({ position, direction, targetPosition, splashRadius, onComplete }: FireballProps) {
  const { scene } = useThree();
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const hasExploded = useRef(false);
  const particlesRef = useRef<any>();
  const currentPosition = useRef(position.clone());
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionScale, setExplosionScale] = useState(0);

  // Calculate initial velocity for lobbed trajectory
  const velocity = useRef((() => {
    const distance = position.distanceTo(targetPosition);
    const targetScale = 0.6;
    const adjustedTarget = new Vector3(
      position.x + (targetPosition.x - position.x) * targetScale,
      targetPosition.y,
      position.z + (targetPosition.z - position.z) * targetScale
    );

    const horizontalDist = new Vector3(adjustedTarget.x - position.x, 0, adjustedTarget.z - position.z).length();
    const horizontalSpeed = FIREBALL_SPEED * (horizontalDist / distance);
    const timeToTarget = horizontalDist / horizontalSpeed;

    const arcHeight = Math.min(MIN_HEIGHT, horizontalDist * 0.6);
    const horizontalDir = new Vector3(
      adjustedTarget.x - position.x,
      0,
      adjustedTarget.z - position.z
    ).normalize();

    const vInitial = horizontalDir.multiplyScalar(horizontalSpeed);
    vInitial.y = (arcHeight - 0.5 * GRAVITY * timeToTarget * timeToTarget) / timeToTarget;

    return vInitial;
  })());

  const rotation = useMemo(() => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 0, 1), direction);
    return q;
  }, [direction]);

  const particles = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      arr[i] = Math.cos(angle) * radius;
      arr[i + 1] = Math.sin(angle) * radius;
      arr[i + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);

  const explode = (position: Vector3) => {
    if (hasExploded.current) return;
    hasExploded.current = true;
    setShowExplosion(true);
    startTime.current = Date.now();

    const enemiesGroup = scene.getObjectByName('enemies');
    if (!enemiesGroup) {
      console.warn('Enemies group not found, skipping damage application');
      onComplete();
      return;
    }

    // Find all enemies within explosion radius and apply damage
    enemiesGroup.children.forEach((enemy) => {
      if (!enemy.userData?.rigidBody) return;
      
      const enemyPos = new Vector3();
      const enemyRB = enemy.userData.rigidBody;
      const translation = enemyRB.translation();
      enemyPos.set(translation.x, translation.y, translation.z);
      
      const distanceToExplosion = position.distanceTo(enemyPos);
      
      if (distanceToExplosion <= EXPLOSION_RADIUS) {
        const damageMultiplier = 1 - (distanceToExplosion / EXPLOSION_RADIUS);
        const damage = Math.ceil(FIREBALL_DAMAGE * damageMultiplier);
        
        const knockbackDir = new Vector3()
          .subVectors(enemyPos, position)
          .normalize();
        
        knockbackDir.y += 0.3;
        knockbackDir.normalize();
        
        const knockbackForce = knockbackDir.multiplyScalar(EXPLOSION_FORCE * damageMultiplier);
        
        if (enemyRB.userData?.takeDamage) {
          enemyRB.userData.takeDamage(damage, knockbackForce);
        }
      }
    });
  };

  useFrame((state, delta) => {
    if (hasExploded.current) {
      if (showExplosion) {
        const elapsed = (Date.now() - startTime.current) / 1000;
        if (elapsed > EXPLOSION_DURATION) {
          setShowExplosion(false);
          onComplete();
        }
        const scale = Math.min(1, elapsed / (EXPLOSION_DURATION * 0.3));
        setExplosionScale(scale * EXPLOSION_RADIUS);
      }
      return;
    }

    velocity.current.y += GRAVITY * delta;
    currentPosition.current.add(velocity.current.clone().multiplyScalar(delta));

    if (ref.current) {
      ref.current.setTranslation(currentPosition.current);
      const newRotation = new Quaternion();
      newRotation.setFromUnitVectors(new Vector3(0, 0, 1), velocity.current.clone().normalize());
      ref.current.setRotation(newRotation);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.x += delta * 2;
      particlesRef.current.rotation.y += delta * 3;
    }

    if (currentPosition.current.y < 0) {
      const groundImpactPoint = currentPosition.current.clone();
      groundImpactPoint.y = 0;
      explode(groundImpactPoint);
    } else if (Date.now() - startTime.current > LIFETIME * 1000) {
      explode(currentPosition.current);
    }
  });

  return (
    <>
      <RigidBody
        ref={ref}
        type="dynamic"
        position={position}
        colliders={false}
        sensor
        name="projectile"
        userData={{ isProjectile: true }}
        onIntersectionEnter={({ other }) => {
          if (!hasExploded.current && other.rigidBody?.userData?.type === 'enemy') {
            explode(currentPosition.current);
          }
        }}
      >
        <CuboidCollider args={[0.3, 0.3, 0.3]} sensor />
        <group quaternion={rotation}>
          {!hasExploded.current && (
            <mesh castShadow>
              <sphereGeometry args={[0.4]} />
              <meshStandardMaterial
                color="#ff4400"
                emissive="#ff4400"
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          )}
          {showExplosion && (
            <>
              <Sparkles
                count={80}
                scale={[explosionScale, explosionScale, explosionScale]}
                size={8}
                speed={0.4}
                color="#ff4400"
              />

              <Billboard>
                <mesh scale={[explosionScale, explosionScale, 1]}>
                  <planeGeometry args={[2, 2]} />
                  <meshBasicMaterial
                    color="#ff4400"
                    transparent
                    opacity={Math.max(0, 0.7 - explosionScale / EXPLOSION_RADIUS)}
                    depthWrite={false}
                  />
                </mesh>
              </Billboard>

              <Sparkles
                count={60}
                scale={[explosionScale * 0.8, explosionScale * 0.8, explosionScale * 0.8]}
                size={6}
                speed={0.3}
                color="#ff8800"
              />

              <Sparkles
                count={40}
                scale={[explosionScale * 0.6, explosionScale * 0.6, explosionScale * 0.6]}
                size={4}
                speed={0.2}
                color="#ffaa00"
              />

              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[explosionScale * 1.5, explosionScale * 1.5]} />
                <meshBasicMaterial
                  color="#331100"
                  transparent
                  opacity={Math.max(0, 0.4 - explosionScale / (EXPLOSION_RADIUS * 2))}
                  depthWrite={false}
                />
              </mesh>

              <pointLight
                color="#ff4400"
                intensity={Math.max(0, 12 - explosionScale)}
                distance={explosionScale * 3}
                decay={2}
              />
            </>
          )}
        </group>
      </RigidBody>
    </>
  );
}
