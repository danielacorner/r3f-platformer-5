import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { ImpactRipple } from './ImpactRipple';

interface ProjectileProps {
  position: Vector3;
  type: 'bow' | 'boomerang';
  target: Vector3;
  onComplete: (position: Vector3) => void;
}

export function Projectile({ position, type, target, onComplete }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startPos = useRef(position.clone());
  const timeRef = useRef(0);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<Vector3 | null>(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [phase, setPhase] = useState<'initial' | 'overshoot' | 'return'>('initial');
  const currentPos = useRef(position.clone());
  const phaseTime = useRef(0);
  
  const arrowLifetime = 2;
  const boomerangPhaseTime = 0.8;
  const ARROW_FLIGHT_TIME = 1; // Fixed flight time for arrows

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    if (type === 'bow') {
      if (hasLanded) {
        if (timeRef.current >= arrowLifetime) {
          onComplete(currentPos.current);
        }
        return;
      }

      const progress = Math.min(timeRef.current / ARROW_FLIGHT_TIME, 1);
      
      // Simple parabolic arc
      const direction = target.clone().sub(startPos.current);
      const height = Math.max(direction.length() * 0.3, 2); // Arc height based on distance
      
      currentPos.current.copy(startPos.current).lerp(target, progress);
      currentPos.current.y += Math.sin(progress * Math.PI) * height;

      if (progress >= 1) {
        currentPos.current.copy(target);
        currentPos.current.y += 0.2; // Slight offset to prevent z-fighting
        setHasLanded(true);
        setShowRipple(true);
        setRipplePosition(currentPos.current.clone());
      }

      // Update arrow orientation
      if (!hasLanded) {
        const nextPos = startPos.current.clone().lerp(target, Math.min((progress + 0.1), 1));
        nextPos.y += Math.sin((progress + 0.1) * Math.PI) * height;
        const velocity = nextPos.clone().sub(currentPos.current);
        const rotation = new Quaternion();
        rotation.setFromUnitVectors(new Vector3(0, 1, 0), velocity.normalize());
        meshRef.current.setRotationFromQuaternion(rotation);
      } else {
        meshRef.current.rotation.x = -Math.PI / 3;
      }

      meshRef.current.position.copy(currentPos.current);
    } else {
      // Boomerang logic remains the same
      phaseTime.current += delta;
      
      if (phaseTime.current >= boomerangPhaseTime) {
        phaseTime.current = 0;
        if (phase === 'initial') {
          setPhase('overshoot');
        } else if (phase === 'overshoot') {
          setPhase('return');
        } else if (phase === 'return') {
          onComplete(currentPos.current);
          return;
        }
      }

      const t = phaseTime.current / boomerangPhaseTime;
      const direction = target.clone().sub(startPos.current).normalize();
      const perpendicular = new Vector3(-direction.z, 0, direction.x);
      
      if (phase === 'initial') {
        const midPoint = startPos.current.clone().lerp(target, 0.5).add(perpendicular.multiplyScalar(3));
        currentPos.current.copy(startPos.current)
          .multiplyScalar(Math.pow(1-t, 2))
          .add(midPoint.multiplyScalar(2 * (1-t) * t))
          .add(target.clone().multiplyScalar(t * t));
      } else if (phase === 'overshoot') {
        const overshootPos = startPos.current.clone()
          .sub(direction.multiplyScalar(2))
          .sub(perpendicular.multiplyScalar(3));
        const midPoint = target.clone().lerp(overshootPos, 0.5).sub(perpendicular.multiplyScalar(3));
        currentPos.current.copy(target)
          .multiplyScalar(Math.pow(1-t, 2))
          .add(midPoint.multiplyScalar(2 * (1-t) * t))
          .add(overshootPos.clone().multiplyScalar(t * t));
      } else {
        const overshootPos = currentPos.current.clone();
        const midPoint = overshootPos.clone().lerp(startPos.current, 0.5).add(perpendicular.multiplyScalar(3));
        currentPos.current.copy(overshootPos)
          .multiplyScalar(Math.pow(1-t, 2))
          .add(midPoint.multiplyScalar(2 * (1-t) * t))
          .add(startPos.current.clone().multiplyScalar(t * t));
      }

      meshRef.current.position.copy(currentPos.current);
      meshRef.current.rotation.y += delta * 15;
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={position} castShadow>
        {type === 'bow' ? (
          <group>
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
      </mesh>
      {showRipple && ripplePosition && (
        <ImpactRipple position={ripplePosition} />
      )}
    </>
  );
}