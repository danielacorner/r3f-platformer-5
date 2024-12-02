import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, BufferGeometry, Line } from 'three';
import { useGameStore } from '../store/gameStore';
import { RigidBody } from '@react-three/rapier';
import { OrbTrail } from './OrbTrail';

const ORB_RADIUS = 1.5; // Orbit radius
const ORB_SPEED = 2; // Orbit speed
const ATTACK_RANGE = 10; // Range to detect enemies
const ATTACK_DAMAGE = 35;
const DAMAGE_RADIUS = 1; // Radius for area damage
const TRAIL_UPDATE_FREQUENCY = 2; // Update trail every N frames

interface MagicOrbProps {
  playerRef: React.RefObject<RigidBody>;
}

export function MagicOrb({ playerRef }: MagicOrbProps) {
  const orbRef = useRef<Group>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetEnemy, setTargetEnemy] = useState<any>(null);
  const [returnPoint, setReturnPoint] = useState<Vector3 | null>(null);
  const [attackProgress, setAttackProgress] = useState(0);
  const startPosition = useRef(new Vector3());
  const midPoint = useRef(new Vector3());
  const lastPosition = useRef(new Vector3());
  const frameCount = useRef(0);
  const trailPoints = useRef<Vector3[]>([]);
  const trailGeometry = useRef<BufferGeometry>();
  const creeps = useGameStore(state => state.creeps);
  const damageCreep = useGameStore(state => state.damageCreep);

  // Reset trail when attack starts
  useEffect(() => {
    if (isAttacking) {
      trailPoints.current = [];
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

  const checkAreaDamage = (position: Vector3) => {
    if (!creeps) return;
    
    creeps.forEach(creep => {
      if (creep.health > 0) {
        const creepPos = new Vector3(
          creep.position[0],
          creep.position[1],
          creep.position[2]
        );
        
        if (creepPos.distanceTo(position) <= DAMAGE_RADIUS) {
          damageCreep(creep.id, ATTACK_DAMAGE / 2); // Half damage for area effect
        }
      }
    });
  };

  const updateTrail = (currentPos: Vector3) => {
    frameCount.current++;
    
    if (frameCount.current % TRAIL_UPDATE_FREQUENCY === 0) {
      trailPoints.current.push(currentPos.clone());
      
      // Keep trail length manageable
      if (trailPoints.current.length > 20) {
        trailPoints.current.shift();
      }

      if (trailGeometry.current) {
        trailGeometry.current.setFromPoints(trailPoints.current);
      }
    }
  };

  useFrame((_, delta) => {
    if (!orbRef.current || !playerRef.current) return;

    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);

    if (!isAttacking) {
      // Calculate orbit position
      const angle = Date.now() * 0.002 * ORB_SPEED;
      const orbitX = Math.cos(angle) * ORB_RADIUS;
      const orbitZ = Math.sin(angle) * ORB_RADIUS;

      // Update orb position relative to player
      orbRef.current.position.set(
        playerPos.x + orbitX,
        playerPos.y + 1,
        playerPos.z + orbitZ
      );

      // Check for enemies
      const enemy = findNearestEnemy();
      if (enemy) {
        setIsAttacking(true);
        setTargetEnemy(enemy);
        startPosition.current.copy(orbRef.current.position);
        const targetPos = new Vector3(enemy.position[0], enemy.position[1] + 1, enemy.position[2]);
        midPoint.current = calculateArcPoint(orbRef.current.position, targetPos, 3);
        setAttackProgress(0);
        trailPoints.current = [orbRef.current.position.clone()];
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
        
        // Calculate new position using Bezier curve
        const newPos = new Vector3(
          Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x,
          Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y,
          Math.pow(1 - t, 2) * p0.z + 2 * (1 - t) * t * p1.z + Math.pow(t, 2) * p2.z
        );

        // Update orb position
        orbRef.current.position.copy(newPos);
        
        // Update trail and check for area damage
        updateTrail(newPos);
        checkAreaDamage(newPos);

        if (attackProgress >= 0.45) {
          // Deal direct damage to target
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
        
        // Calculate new position
        const newPos = new Vector3(
          Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x,
          Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y,
          Math.pow(1 - t, 2) * p0.z + 2 * (1 - t) * t * p1.z + Math.pow(t, 2) * p2.z
        );

        // Update orb position
        orbRef.current.position.copy(newPos);
        
        // Update trail and check for area damage
        updateTrail(newPos);
        checkAreaDamage(newPos);

        if (attackProgress === 1) {
          setIsAttacking(false);
          setTargetEnemy(null);
          setReturnPoint(null);
          setAttackProgress(0);
          trailPoints.current = [];
        }
      }
    }

    // Store last position for next frame
    lastPosition.current.copy(orbRef.current.position);
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

      {/* Trail effect */}
      <line>
        <bufferGeometry ref={trailGeometry} />
        <lineBasicMaterial
          color="#7e57c2"
          transparent
          opacity={0.6}
          linewidth={2}
        />
      </line>

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
