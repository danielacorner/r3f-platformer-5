import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../store/gameStore';
import { RigidBody } from '@react-three/rapier';

const ORB_RADIUS = 1.5; // Orbit radius
const ORB_SPEED = 2; // Orbit speed
const ATTACK_RANGE = 10; // Range to detect enemies
const ATTACK_DAMAGE = 35;
const RETURN_SPEED = 15;

interface MagicOrbProps {
  playerRef: React.RefObject<RigidBody>;
}

export function MagicOrb({ playerRef }: MagicOrbProps) {
  const orbRef = useRef<Group>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetEnemy, setTargetEnemy] = useState<any>(null);
  const [returnPoint, setReturnPoint] = useState<Vector3 | null>(null);
  const [attackProgress, setAttackProgress] = useState(0);
  const orbPosition = useRef(new Vector3());
  const startPosition = useRef(new Vector3());
  const midPoint = useRef(new Vector3());
  const creeps = useGameStore(state => state.creeps);
  const damageCreep = useGameStore(state => state.damageCreep);

  useEffect(() => {
    if (!isAttacking && orbRef.current && playerRef.current) {
      const position = playerRef.current.translation();
      orbPosition.current.set(
        position.x + ORB_RADIUS,
        position.y + 1,
        position.z
      );
    }
  }, [isAttacking]);

  const findNearestEnemy = () => {
    if (!playerRef.current || isAttacking || !creeps) return null;
    
    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);
    
    let nearest = null;
    let minDistance = ATTACK_RANGE;
    
    creeps.forEach(creep => {
      if (creep.health > 0) {
        const distance = new Vector3(
          creep.position[0],
          creep.position[1],
          creep.position[2]
        ).distanceTo(playerPos);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = creep;
        }
      }
    });
    
    return nearest;
  };

  const calculateArcPoint = (start: Vector3, end: Vector3, height: number) => {
    const mid = new Vector3().lerpVectors(start, end, 0.5);
    mid.y += height;
    return mid;
  };

  useFrame((_, delta) => {
    if (!orbRef.current || !playerRef.current) return;

    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);

    if (!isAttacking) {
      // Orbit around player
      const angle = Date.now() * 0.002 * ORB_SPEED;
      orbPosition.current.set(
        playerPos.x + Math.cos(angle) * ORB_RADIUS,
        playerPos.y + 1,
        playerPos.z + Math.sin(angle) * ORB_RADIUS
      );
      orbRef.current.position.copy(orbPosition.current);

      // Check for enemies
      const enemy = findNearestEnemy();
      if (enemy) {
        setIsAttacking(true);
        setTargetEnemy(enemy);
        startPosition.current.copy(orbPosition.current);
        const targetPos = new Vector3(enemy.position[0], enemy.position[1] + 1, enemy.position[2]);
        midPoint.current = calculateArcPoint(orbPosition.current, targetPos, 3);
        setAttackProgress(0);
      }
    } else if (targetEnemy) {
      setAttackProgress(prev => Math.min(prev + delta * 2, 1));
      
      if (attackProgress < 0.5) {
        // Moving to enemy
        const targetPos = new Vector3(targetEnemy.position[0], targetEnemy.position[1] + 1, targetEnemy.position[2]);
        const p0 = startPosition.current;
        const p1 = midPoint.current;
        const p2 = targetPos;
        const t = attackProgress * 2;
        
        // Quadratic Bezier curve
        orbRef.current.position.set(
          Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x,
          Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y,
          Math.pow(1 - t, 2) * p0.z + 2 * (1 - t) * t * p1.z + Math.pow(t, 2) * p2.z
        );

        if (attackProgress >= 0.45) {
          // Deal damage
          damageCreep(targetEnemy.id, ATTACK_DAMAGE);
          setReturnPoint(new Vector3(playerPos.x, playerPos.y + 1, playerPos.z));
          midPoint.current = calculateArcPoint(
            new Vector3(targetEnemy.position[0], targetEnemy.position[1], targetEnemy.position[2]),
            playerPos,
            3
          );
        }
      } else {
        // Returning to player
        const p0 = new Vector3(targetEnemy.position[0], targetEnemy.position[1] + 1, targetEnemy.position[2]);
        const p1 = midPoint.current;
        const p2 = returnPoint as Vector3;
        const t = (attackProgress - 0.5) * 2;
        
        orbRef.current.position.set(
          Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x,
          Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y,
          Math.pow(1 - t, 2) * p0.z + 2 * (1 - t) * t * p1.z + Math.pow(t, 2) * p2.z
        );

        if (attackProgress === 1) {
          setIsAttacking(false);
          setTargetEnemy(null);
          setReturnPoint(null);
          setAttackProgress(0);
        }
      }
    }
  });

  return (
    <group ref={orbRef}>
      {/* Glowing orb core */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#4a148c"
          emissive="#7e57c2"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh scale={1.2}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#7e57c2"
          emissive="#7e57c2"
          emissiveIntensity={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Particle effect */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i / 8) * Math.PI * 2) * 0.2,
            Math.cos((i / 8) * Math.PI * 2) * 0.2,
            0
          ]}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#4a148c"
            emissive="#7e57c2"
            emissiveIntensity={1.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
