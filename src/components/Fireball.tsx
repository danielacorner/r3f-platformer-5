import { useRef, useMemo, useState } from 'react';
import { Vector3, Quaternion, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Sparkles, Billboard } from '@react-three/drei';

const FIREBALL_SPEED = 10; // Reduced from 15 for shorter range
const LIFETIME = 3; // seconds
const FIREBALL_DAMAGE = 30; // Base damage
const PARTICLE_COUNT = 100;
const GRAVITY = -20; // Increased gravity for steeper arc
const MIN_HEIGHT = 6; // Slightly reduced arc height

interface FireballProps {
  position: Vector3;
  direction: Vector3;
  targetPosition: Vector3;
  splashRadius: number;
  onComplete: () => void;
}

export function Fireball({ position, direction, targetPosition, splashRadius, onComplete }: FireballProps) {
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const hasExploded = useRef(false);
  const particlesRef = useRef<any>();
  const currentPosition = useRef(position.clone());
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState(new Vector3());

  // Calculate initial velocity for lobbed trajectory
  const velocity = useRef((() => {
    const distance = position.distanceTo(targetPosition);
    
    // Reduce effective target distance to make projectile land closer
    const targetScale = 0.5; // Scale factor to reduce range
    const adjustedTarget = new Vector3(
      position.x + (targetPosition.x - position.x) * targetScale,
      targetPosition.y,
      position.z + (targetPosition.z - position.z) * targetScale
    );
    
    // Calculate horizontal components based on adjusted target
    const horizontalDist = new Vector3(adjustedTarget.x - position.x, 0, adjustedTarget.z - position.z).length();
    const horizontalSpeed = FIREBALL_SPEED * (horizontalDist / distance);
    const timeToTarget = horizontalDist / horizontalSpeed;
    
    // Calculate arc height based on adjusted distance
    const arcHeight = Math.min(MIN_HEIGHT, horizontalDist * 0.6);
    
    // Calculate direction to adjusted target
    const horizontalDir = new Vector3(
      adjustedTarget.x - position.x,
      0,
      adjustedTarget.z - position.z
    ).normalize();
    
    // Initial velocity with proper horizontal direction
    const vInitial = horizontalDir.multiplyScalar(horizontalSpeed);
    
    // Add vertical component for arc
    vInitial.y = (arcHeight - 0.5 * GRAVITY * timeToTarget * timeToTarget) / timeToTarget;
    
    return vInitial;
  })());

  // Calculate rotation to face direction of travel
  const rotation = useMemo(() => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 0, 1), direction);
    return q;
  }, [direction]);

  // Create random particles positions
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

  useFrame((state, delta) => {
    if (hasExploded.current) return;

    // Update velocity with gravity
    velocity.current.y += GRAVITY * delta;

    // Update position
    currentPosition.current.add(velocity.current.clone().multiplyScalar(delta));
    
    // Update rigid body position
    if (ref.current) {
      ref.current.setTranslation(currentPosition.current);
      
      // Update rotation to match velocity direction
      const newRotation = new Quaternion();
      newRotation.setFromUnitVectors(new Vector3(0, 0, 1), velocity.current.clone().normalize());
      ref.current.setRotation(newRotation);
    }

    // Rotate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.x += delta * 2;
      particlesRef.current.rotation.y += delta * 3;
    }

    // Check for ground collision or lifetime
    if (currentPosition.current.y < 0 || Date.now() - startTime.current > LIFETIME * 1000) {
      explode(currentPosition.current);
    }
  });

  const explode = (position: Vector3) => {
    if (hasExploded.current) return;
    hasExploded.current = true;
    setExplosionPosition(position.clone());
    setShowExplosion(true);

    // Find enemies group using useThree
    const scene = (window as any)?._three?.scene;
    if (!scene) {
      console.warn('Scene not available for explosion');
      onComplete();
      return;
    }

    const enemiesGroup = scene.getObjectByName('enemies');
    if (!enemiesGroup) {
      console.warn('Enemies group not found');
      onComplete();
      return;
    }

    // Check each enemy in range
    enemiesGroup.children.forEach((enemy: any) => {
      if (!enemy.userData) return;
      
      const distance = position.distanceTo(enemy.position);
      if (distance <= splashRadius) {
        // Calculate damage based on distance (more damage closer to center)
        const damage = Math.ceil(FIREBALL_DAMAGE * (1 - distance / splashRadius));
        
        // Get enemy's handleHit function
        const handleHit = enemy.userData.handleHit;
        if (handleHit && typeof handleHit === 'function') {
          // Calculate knockback direction and force
          const knockbackDir = new Vector3()
            .subVectors(enemy.position, position)
            .normalize();
          const knockbackForce = knockbackDir.multiplyScalar(10 * (1 - distance / splashRadius));
          
          // Apply damage and knockback
          handleHit(damage, knockbackForce);
        }
      }
    });

    // Clean up explosion after delay
    setTimeout(() => {
      setShowExplosion(false);
      onComplete();
    }, 1000);
  };

  return (
    <>
      <RigidBody
        ref={ref}
        type="dynamic"
        position={position}
        colliders={false}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody?.userData?.isEnemy && !hasExploded.current) {
            explode(currentPosition.current);
          }
        }}
      >
        <group quaternion={rotation}>
          {/* Fireball core */}
          <mesh castShadow>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff4400"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>

          {/* Inner glow */}
          <mesh scale={1.2}>
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial
              color="#ff8800"
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Fire particles */}
          <group ref={particlesRef}>
            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={PARTICLE_COUNT}
                  array={particles}
                  itemSize={3}
                />
              </bufferGeometry>
              <pointsMaterial
                size={0.15}
                color="#ff8800"
                transparent
                opacity={0.8}
                sizeAttenuation
              />
            </points>
          </group>

          {/* Trail particles */}
          <points position={[0, 0, -1]}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={50}
                array={new Float32Array(150).map(() => (Math.random() - 0.5) * 0.3)}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.1}
              color="#ff4400"
              transparent
              opacity={0.5}
            />
          </points>
        </group>
        <CuboidCollider args={[0.3, 0.3, 0.3]} sensor />
      </RigidBody>

      {/* Explosion effect */}
      {showExplosion && (
        <group position={explosionPosition}>
          <Sparkles
            count={50}
            scale={[3, 3, 3]}
            size={6}
            speed={0.3}
            color="#ff4400"
          />
          <Billboard>
            <mesh>
              <planeGeometry args={[3, 3]} />
              <meshBasicMaterial
                color="#ff4400"
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
          <pointLight
            color="#ff4400"
            intensity={5}
            distance={4}
            decay={2}
          />
        </group>
      )}
    </>
  );
}
