import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { ImpactRipple } from './ImpactRipple';
import { useGameStore } from '../store/gameStore';

interface ProjectileProps {
  position: Vector3;
  type: 'bow' | 'boomerang';
  target: Vector3;
  onComplete: (position: Vector3) => void;
}

export function Projectile({ position, type, target, onComplete }: ProjectileProps) {
  const rigidBodyRef = useRef<any>(null);
  const startPos = useRef(position.clone());
  const timeRef = useRef(0);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<Vector3 | null>(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [hasHitEnemy, setHasHitEnemy] = useState(false);
  const [phase, setPhase] = useState<'initial' | 'overshoot' | 'return'>('initial');
  const currentPos = useRef(position.clone());
  const phaseTime = useRef(0);
  const hitEnemies = useRef(new Set<string>());
  
  const arrowLifetime = 2;
  const boomerangPhaseTime = 0.8;
  const ARROW_FLIGHT_TIME = 1;
  const AOE_RADIUS = 1.5; // Area of effect radius

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
      const height = Math.max(direction.length() * 0.3, 2);
      
      // Calculate next position for velocity direction
      const nextProgress = Math.min(progress + 0.1, 1);
      const currentPoint = startPos.current.clone().lerp(target, progress);
      currentPoint.y += Math.sin(progress * Math.PI) * height;
      
      const nextPoint = startPos.current.clone().lerp(target, nextProgress);
      nextPoint.y += Math.sin(nextProgress * Math.PI) * height;
      
      // Calculate velocity direction for rotation
      const velocity = nextPoint.clone().sub(currentPoint).normalize();
      
      // Update position
      currentPos.current.copy(currentPoint);
      rigidBodyRef.current.setTranslation(currentPos.current);

      // Update rotation to match velocity direction
      if (!hasLanded) {
        const arrowRotation = new Quaternion();
        arrowRotation.setFromUnitVectors(new Vector3(0, 0, 1), velocity);
        rigidBodyRef.current.setRotation(arrowRotation);
      } else {
        // Landed arrow rotation
        const landedRotation = new Quaternion();
        landedRotation.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 3);
        rigidBodyRef.current.setRotation(landedRotation);
      }

      if (progress >= 1) {
        setHasLanded(true);
        setShowRipple(true);
        setRipplePosition(currentPos.current.clone());
      }
    } else {
      // Boomerang logic...
      phaseTime.current += delta;
      const phaseProgress = Math.min(phaseTime.current / boomerangPhaseTime, 1);

      if (phase === 'initial') {
        currentPos.current.copy(startPos.current).lerp(target, phaseProgress);
        if (phaseProgress >= 1) {
          setPhase('overshoot');
          phaseTime.current = 0;
        }
      } else if (phase === 'overshoot') {
        const overshootTarget = target.clone().add(target.clone().sub(startPos.current).normalize().multiplyScalar(2));
        currentPos.current.copy(target).lerp(overshootTarget, phaseProgress);
        if (phaseProgress >= 1) {
          setPhase('return');
          phaseTime.current = 0;
        }
      } else if (phase === 'return') {
        const returnStart = currentPos.current.clone();
        currentPos.current.copy(returnStart).lerp(startPos.current, phaseProgress);
        if (phaseProgress >= 1) {
          onComplete(currentPos.current);
        }
      }

      rigidBodyRef.current.setTranslation(currentPos.current);
      
      // Boomerang spin
      const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), timeRef.current * 10);
      rigidBodyRef.current.setRotation(rotation);
    }
  });

  const handleCollision = (event: any) => {
    const collidedWith = event.other;
    if (!collidedWith) return;

    // Check if it's an enemy and hasn't been hit yet
    if (collidedWith.parent?.name === 'enemy') {
      const enemyId = collidedWith.parent.userData?.id;
      if (enemyId && !hitEnemies.current.has(enemyId)) {
        hitEnemies.current.add(enemyId);
        
        // Find all nearby enemies for AOE damage
        const enemyPos = new Vector3(
          collidedWith.parent.translation().x,
          collidedWith.parent.translation().y,
          collidedWith.parent.translation().z
        );
        
        // Apply direct hit damage to the collided enemy
        const directHitDamage = type === 'bow' ? 35 : 25;
        collidedWith.parent.userData = {
          ...collidedWith.parent.userData,
          damage: directHitDamage
        };
        
        // Get all enemies in the scene for AOE
        const scene = rigidBodyRef.current.scene;
        scene.children.forEach((child: any) => {
          if (child.name === 'enemy' && child.rigidBody && child !== collidedWith.parent) {
            const pos = child.rigidBody.translation();
            const distance = enemyPos.distanceTo(new Vector3(pos.x, pos.y, pos.z));
            
            if (distance <= AOE_RADIUS) {
              // Calculate damage based on distance (more damage closer to impact)
              const damageMultiplier = 1 - (distance / AOE_RADIUS);
              const baseDamage = type === 'bow' ? 20 : 15; // Reduced AOE damage
              const damage = Math.round(baseDamage * damageMultiplier);
              
              // Apply AOE damage
              child.rigidBody.userData = {
                ...child.rigidBody.userData,
                damage: damage
              };
            }
          }
        });

        setHasHitEnemy(true);
        setShowRipple(true);
        setRipplePosition(currentPos.current.clone());
        onComplete(currentPos.current);
      }
    }
  };

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="kinematicPosition"
        position={[position.x, position.y, position.z]}
        name="projectile"
        userData={{ type }}
        onCollisionEnter={handleCollision}
      >
        <CuboidCollider args={[0.1, 0.1, 0.25]} sensor />
        {type === 'bow' ? (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.5]} />
              <meshStandardMaterial color="#4a3728" />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <coneGeometry args={[0.08, 0.2]} />
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
      {showRipple && ripplePosition && (
        <ImpactRipple position={ripplePosition} />
      )}
    </>
  );
}