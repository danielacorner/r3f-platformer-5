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
  // Refs for all orbs
  const orbsRef = useRef<Group[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackingOrbs, setAttackingOrbs] = useState<{ [key: number]: any }>({});
  const [attackProgress, setAttackProgress] = useState(0);
  const [canAttack, setCanAttack] = useState(true);
  
  // Refs for tracking positions and timing
  const lastAttackTime = useRef(0);
  const startPositions = useRef<{ [key: number]: Vector3 }>({});
  const midPoints = useRef<{ [key: number]: Vector3 }>({});
  const frameCount = useRef(0);
  const trailPoints = useRef<Vector3[]>([]);

  // Get all relevant stats from game store
  const creeps = useGameStore(state => state.creeps);
  const damageCreep = useGameStore(state => state.damageCreep);
  const damage = useGameStore(state => state.upgrades.damage);
  const range = useGameStore(state => state.upgrades.range);
  const cooldown = useGameStore(state => state.upgrades.cooldown);
  const multishot = useGameStore(state => state.upgrades.multishot);

  // Calculate actual values based on upgrades
  const actualDamage = BASE_ATTACK_DAMAGE * (1 + damage * 0.1);
  const actualRange = BASE_ATTACK_RANGE * (1 + range * 0.1);
  const actualCooldown = BASE_ATTACK_COOLDOWN * (1 - cooldown * 0.1);
  const multishotChance = multishot * 0.15; // 15% chance per level

  // Get multishot level and calculate number of orbs
  const numAdditionalOrbs = Math.floor(multishotChance); // Full orbs
  const partialOrbOpacity = (multishotChance % 1); // Opacity for the partial orb
  const totalOrbs = numAdditionalOrbs + (partialOrbOpacity > 0 ? 1 : 0) + 1; // +1 for main orb

  const findNearestEnemies = () => {
    if (!orbsRef.current[0] || !playerRef.current || !canAttack) return [];

    return creeps
      .filter(enemy => {
        if (!enemy || enemy.health <= 0) return false;
        const enemyPos = new Vector3(
          enemy.position[0],
          enemy.position[1],
          enemy.position[2]
        );
        const dist = enemyPos.distanceTo(orbsRef.current[0].position);
        return dist <= actualRange;
      })
      .sort((a, b) => {
        const aPos = new Vector3(a.position[0], a.position[1], a.position[2]);
        const bPos = new Vector3(b.position[0], b.position[1], b.position[2]);
        const distA = aPos.distanceTo(orbsRef.current[0].position);
        const distB = bPos.distanceTo(orbsRef.current[0].position);
        return distA - distB;
      });
  };

  const calculateArcPoint = (start: Vector3, end: Vector3, height: number) => {
    const mid = new Vector3().lerpVectors(start, end, 0.5);
    mid.y += height;
    return mid;
  };

  const updateTrail = (currentPos: Vector3) => {
    frameCount.current++;
    if (frameCount.current % 2 === 0) {
      trailPoints.current.push(currentPos.clone());
      if (trailPoints.current.length > 20) {
        trailPoints.current.shift();
      }
    }
  };

  const startAttack = () => {
    if (!canAttack) return;

    const nearbyEnemies = findNearestEnemies();
    if (nearbyEnemies.length === 0) return;

    const now = Date.now();
    if (now - lastAttackTime.current < actualCooldown * 1000) return;
    lastAttackTime.current = now;

    // Calculate number of orbs to attack
    const guaranteedOrbs = Math.floor(multishotChance) + 1; // +1 for main orb
    const extraOrbChance = multishotChance % 1;
    let totalAttackingOrbs = guaranteedOrbs;
    
    if (Math.random() < extraOrbChance) {
      totalAttackingOrbs++;
    }

    // Initialize attack states for all attacking orbs
    const newAttackingOrbs: { [key: number]: any } = {};
    startPositions.current = {};
    midPoints.current = {};

    // Setup attacks for all participating orbs
    for (let i = 0; i < totalAttackingOrbs; i++) {
      const orb = orbsRef.current[i];
      if (orb) {
        const targetEnemy = nearbyEnemies[Math.min(i, nearbyEnemies.length - 1)];
        newAttackingOrbs[i] = targetEnemy;
        startPositions.current[i] = orb.position.clone();
        const targetPos = new Vector3(
          targetEnemy.position[0],
          targetEnemy.position[1] + 1,
          targetEnemy.position[2]
        );
        midPoints.current[i] = calculateArcPoint(startPositions.current[i], targetPos, 3);
      }
    }

    setAttackingOrbs(newAttackingOrbs);
    setIsAttacking(true);
    setAttackProgress(0);
    setCanAttack(false);

    setTimeout(() => {
      setCanAttack(true);
    }, actualCooldown * 1000);
  };

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);
    const time = Date.now() * 0.002 * BASE_ORB_SPEED;

    if (!isAttacking) {
      // Normal orbit for all orbs
      orbsRef.current.forEach((orb, index) => {
        if (orb) {
          const angle = time + (Math.PI * 2 * index) / orbsRef.current.length;
          const orbitX = Math.cos(angle) * BASE_ORB_RADIUS;
          const orbitZ = Math.sin(angle) * BASE_ORB_RADIUS;
          orb.position.set(
            playerPos.x + orbitX,
            playerPos.y + 1,
            playerPos.z + orbitZ
          );
        }
      });

      // Check for new attacks
      if (canAttack) {
        const enemies = findNearestEnemies();
        if (enemies.length > 0) {
          startAttack();
        }
      }
    } else {
      // Update attack progress
      const newProgress = Math.min(attackProgress + delta * 2, 1);
      setAttackProgress(newProgress);

      // Update all attacking orbs
      Object.entries(attackingOrbs).forEach(([orbIndex, target]) => {
        const orb = orbsRef.current[parseInt(orbIndex)];
        if (!orb || !target || target.health <= 0) return;

        const startPos = startPositions.current[orbIndex];
        const midPoint = midPoints.current[orbIndex];
        const targetPos = new Vector3(target.position[0], target.position[1] + 1, target.position[2]);

        if (newProgress < 0.5) {
          // Moving to enemy
          const t = newProgress * 2;
          const p1 = new Vector3().lerpVectors(startPos, midPoint, t);
          const p2 = new Vector3().lerpVectors(midPoint, targetPos, t);
          const pos = new Vector3().lerpVectors(p1, p2, t);
          orb.position.copy(pos);

          if (newProgress >= 0.45) {
            damageCreep(target.id, actualDamage);
          }
        } else {
          // Returning to orbit
          const t = (newProgress - 0.5) * 2;
          const returnTarget = new Vector3(
            playerPos.x + Math.cos(time + (Math.PI * 2 * parseInt(orbIndex)) / Object.keys(attackingOrbs).length) * BASE_ORB_RADIUS,
            playerPos.y + 1,
            playerPos.z + Math.sin(time + (Math.PI * 2 * parseInt(orbIndex)) / Object.keys(attackingOrbs).length) * BASE_ORB_RADIUS
          );
          orb.position.lerp(returnTarget, t);
        }

        updateTrail(orb.position);
      });

      // Reset attack state when complete
      if (newProgress >= 1) {
        setIsAttacking(false);
        setAttackingOrbs({});
        setAttackProgress(0);
        trailPoints.current = [];
      }
    }
  });

  return (
    <group>
      {Array(totalOrbs).fill(null).map((_, index) => {
        const opacity = index === 0 ? 1 : index <= numAdditionalOrbs ? 1 : partialOrbOpacity;
        return (
          <group 
            key={index}
            ref={el => {
              if (el) {
                orbsRef.current[index] = el;
              }
            }}
          >
            <OrbEffects 
              isAttacking={isAttacking && attackingOrbs[index] !== undefined} 
              opacity={opacity} 
            />
            <OrbTrail />
          </group>
        );
      })}
    </group>
  );
}
