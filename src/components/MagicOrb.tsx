import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, BufferGeometry, Line } from 'three';
import { useGameStore } from '../store/gameStore';
import { RigidBody } from '@react-three/rapier';
import { OrbTrail } from './OrbTrail';
import { OrbEffects } from './OrbEffects';

const BASE_ORB_RADIUS = 1.5; // Base orbit radius
const BASE_ORB_SPEED = 2; // Base orbit speed
const BASE_ATTACK_RANGE = 5; // Base range to detect enemies
const BASE_ATTACK_DAMAGE = 25; // Base damage
const BASE_ATTACK_COOLDOWN = 1.5; // Base time between attacks in seconds
const DAMAGE_RADIUS = 1; // Radius for area damage

interface MagicOrbProps {
  playerRef: React.RefObject<RigidBody>;
}

export function MagicOrb({ playerRef }: MagicOrbProps) {
  const orbRef = useRef<Group>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetEnemy, setTargetEnemy] = useState<any>(null);
  const [returnPoint, setReturnPoint] = useState<Vector3 | null>(null);
  const [attackProgress, setAttackProgress] = useState(0);
  const [canAttack, setCanAttack] = useState(true);
  const lastAttackTime = useRef(0);
  const startPosition = useRef(new Vector3());
  const midPoint = useRef(new Vector3());
  const lastPosition = useRef(new Vector3());
  const frameCount = useRef(0);
  const trailPoints = useRef<Vector3[]>([]);
  const trailGeometry = useRef<BufferGeometry>();
  
  // Get all relevant stats from game store
  const creeps = useGameStore(state => state.creeps);
  const damageCreep = useGameStore(state => state.damageCreep);
  const damage = useGameStore(state => state.upgrades.damage);
  const speed = useGameStore(state => state.upgrades.speed);
  const range = useGameStore(state => state.upgrades.range);
  const multishot = useGameStore(state => state.upgrades.multishot);

  // Calculate actual values based on upgrades
  const actualDamage = BASE_ATTACK_DAMAGE * (1 + (damage * 0.15)); // 15% increase per level
  const actualCooldown = BASE_ATTACK_COOLDOWN * (1 - (speed * 0.12)); // 12% decrease per level
  const actualRange = BASE_ATTACK_RANGE * (1 + (range * 0.12)); // 12% increase per level
  const multishotChance = multishot * 0.15; // 15% chance per level

  // Handle attack cooldown
  useEffect(() => {
    if (!canAttack) {
      const timer = setTimeout(() => {
        setCanAttack(true);
      }, actualCooldown * 1000);
      return () => clearTimeout(timer);
    }
  }, [canAttack, actualCooldown]);

  const findNearestEnemy = () => {
    if (!playerRef.current || isAttacking || !creeps || !canAttack) return null;

    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);

    let nearest = null;
    let minDistance = actualRange;

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
          damageCreep(creep.id, actualDamage / 2); // Half damage for area effect
        }
      }
    });
  };

  const updateTrail = (currentPos: Vector3) => {
    frameCount.current++;

    if (frameCount.current % 2 === 0) {
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
      const angle = Date.now() * 0.002 * BASE_ORB_SPEED;
      const orbitX = Math.cos(angle) * BASE_ORB_RADIUS;
      const orbitZ = Math.sin(angle) * BASE_ORB_RADIUS;

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
        setCanAttack(false);
        lastAttackTime.current = Date.now();
        startPosition.current.copy(orbRef.current.position);
        const targetPos = new Vector3(enemy.position[0], enemy.position[1] + 1, enemy.position[2]);
        midPoint.current = calculateArcPoint(orbRef.current.position, targetPos, 3);
        setAttackProgress(0);
        trailPoints.current = [orbRef.current.position.clone()];

        // Handle multishot
        if (Math.random() < multishotChance) {
          // Find another nearby enemy for the extra orb
          const otherEnemies = creeps.filter(c => 
            c.id !== enemy.id && 
            c.health > 0 && 
            new Vector3(c.position[0], c.position[1], c.position[2]).distanceTo(playerPos) <= actualRange
          );
          
          if (otherEnemies.length > 0) {
            const randomEnemy = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
            damageCreep(randomEnemy.id, actualDamage);
          }
        }
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
          damageCreep(targetEnemy.id, actualDamage);
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
      <OrbEffects 
        isAttacking={isAttacking} 
      />
      {/* Debug sphere to show orb position */}
      <mesh visible={false}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    </group>
  );
}
