import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, BufferGeometry, Line } from 'three';
import { useGameStore } from '../store/gameStore';
import { RigidBody } from '@react-three/rapier';
import { OrbTrail } from './OrbTrail';
import { OrbEffects } from './OrbEffects';
import { HitSparks } from "./HitSparks";
import { animated, useSpring } from '@react-spring/three';

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
  const [attackingOrbs, setAttackingOrbs] = useState<{ [key: number]: any }>([]);
  const [attackProgress, setAttackProgress] = useState(0);
  const [canAttack, setCanAttack] = useState(true);
  const [hitEffects, setHitEffects] = useState<{ position: Vector3; key: string }[]>([]);
  const [orbMultiplier, setOrbMultiplier] = useState(1);
  const [isMounted, setIsMounted] = useState(true);

  // Refs for tracking positions and timing
  const lastAttackTime = useRef(0);
  const startPositions = useRef<{ [key: number]: Vector3 }>({});
  const midPoints = useRef<{ [key: number]: Vector3 }>({});
  const frameCount = useRef(0);
  const trailPoints = useRef<Vector3[]>([]);

  // Spring animation for fade effect
  const { opacity } = useSpring({
    opacity: isMounted ? 1 : 0,
    config: { duration: 500 },
    onRest: () => {
      if (!isMounted) {
        // Component will be unmounted after fade out
        setOrbMultiplier(0);
      }
    }
  });

  // Listen for arcaneMultiplication events
  useEffect(() => {
    const handleArcaneMultiplication = (event: CustomEvent) => {
      const { multiplier, duration } = event.detail;
      setOrbMultiplier(multiplier);

      // Reset multiplier after duration
      setTimeout(() => {
        setOrbMultiplier(1);
      }, duration * 1000);
    };

    window.addEventListener('arcaneMultiplication', handleArcaneMultiplication as EventListener);
    return () => {
      window.removeEventListener('arcaneMultiplication', handleArcaneMultiplication as EventListener);
    };
  }, []);

  // Listen for toggle events
  useEffect(() => {
    const handleToggle = (event: CustomEvent) => {
      const { isActive } = event.detail;
      setIsMounted(isActive);
    };

    window.addEventListener('toggleMagicOrb', handleToggle as EventListener);
    return () => window.removeEventListener('toggleMagicOrb', handleToggle as EventListener);
  }, []);

  // Initial state - check if Magic Orb skill is equipped and active
  useEffect(() => {
    const equippedSkills = useGameStore.getState().equippedSkills;
    const magicOrb = Object.entries(equippedSkills).find(([_, s]) => s?.name === 'Magic Orb')?.[1]
    if (magicOrb?.isActive) {
      setOrbMultiplier(1);
    } else {
      setOrbMultiplier(0);
    }
  }, []);

  // Add a UUID generator for truly unique keys
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const addHitEffect = (position: Vector3) => {
    setHitEffects(prev => [...prev, {
      position,
      key: generateUUID() // Use UUID instead of timestamp + counter
    }]);
  };

  // Get all relevant stats from game store
  const creeps = useGameStore(state => state.creeps);
  const damageCreep = useGameStore(state => state.damageCreep);
  const damage = useGameStore(state => state.upgrades.damage);
  const range = useGameStore(state => state.upgrades.range);
  const speed = useGameStore(state => state.upgrades.speed);
  const orbSpeed = useGameStore(state => state.orbSpeed);
  const multiCastLevel = useGameStore(state => state.skillLevels['Multi Orb'] || 0); // Get Multi Orb level from skillLevels
  // Calculate actual values based on upgrades
  const actualDamage = BASE_ATTACK_DAMAGE * (1 + damage * 0.1);
  const actualRange = BASE_ATTACK_RANGE * (1 + range * 0.1);
  const actualCooldown = BASE_ATTACK_COOLDOWN * (1 - speed * 0.12);
  const actualOrbSpeed = BASE_ORB_SPEED * orbSpeed;
  const multiCastChance = multiCastLevel * 0.15; // 15% per level of Multi Orb

  // Calculate number of orbs from Multi Orb passive
  const guaranteedAdditionalOrbs = Math.floor(multiCastChance); // At level 20 (300%), this should be 3
  const baseOrbs = guaranteedAdditionalOrbs + 1; // +1 for main orb
  const totalOrbs = baseOrbs * orbMultiplier; // Apply multiplier from Arcane Multiplication

  // Calculate opacity for each orb - all orbs should be full opacity since they're guaranteed
  const getOrbOpacity = (index: number) => 1;

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

    // Use all available orbs for attack
    const totalAttackingOrbs = totalOrbs;

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
    const time = Date.now() * 0.002 * actualOrbSpeed * (1 + speed * 0.12);

    // Complex orbit pattern for non-attacking orbs
    orbsRef.current.forEach((orb, index) => {
      if (!orb || attackingOrbs[index]) return; // Skip if orb is attacking

      const baseAngle = time + (Math.PI * 2 * index) / orbsRef.current.length;

      // Create a complex pattern using multiple sine waves
      const frequency1 = 1;
      const frequency2 = 0.5;
      const phase = index * Math.PI / 3;

      // Main orbit
      const mainRadius = BASE_ORB_RADIUS * (1 + range / 1.5);

      // Add secondary movements
      const radiusModulation = Math.sin(time * frequency2 + phase) * 0.3;
      const currentRadius = mainRadius * (1 + radiusModulation);

      // Create a figure-8 like pattern
      const orbitX = Math.cos(baseAngle * frequency1) * currentRadius +
        Math.sin(time * frequency2 + phase) * mainRadius * 0.2;
      const orbitZ = Math.sin(baseAngle * frequency1) * currentRadius +
        Math.cos(time * frequency2 + phase) * mainRadius * 0.2;

      // Add subtle vertical movement
      const heightOffset = Math.sin(time * frequency2 + phase) * 0.2;

      orb.position.set(
        playerPos.x + orbitX,
        playerPos.y + 1 + heightOffset,
        playerPos.z + orbitZ
      );
    });

    if (!isAttacking) {
      // Check for new attacks
      if (canAttack) {
        const enemies = findNearestEnemies();
        if (enemies.length > 0) {
          startAttack();
        }
      }
    } else {
      // Update attack progress
      const newProgress = Math.min(attackProgress + delta * 2 * orbSpeed, 1);
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
            // Add hit effect at collision point using the new function
            const hitPosition = new Vector3(
              target.position[0],
              target.position[1] + 0.5,
              target.position[2]
            );
            addHitEffect(hitPosition);
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
    <animated.group opacity={opacity}>
      {isMounted && Array(totalOrbs).fill(null).map((_, index) => {
        const opacity = getOrbOpacity(index);
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
      {/* Hit Effects */}
      {hitEffects.map(({ position, key }) => (
        <HitSparks
          key={key}
          position={position}
          onComplete={() => {
            setHitEffects(prev => prev.filter(effect => effect.key !== key));
          }}
        />
      ))}
    </animated.group>
  );
}
