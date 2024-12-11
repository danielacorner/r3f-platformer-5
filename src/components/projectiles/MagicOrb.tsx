import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Vector3,
  Group,
  BufferGeometry,
  Line,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  DoubleSide,
} from "three";
import { RigidBody } from "@react-three/rapier";
import { OrbTrail } from "./OrbTrail";
import { HitSparks } from "../effects/HitSparks";
import { OrbEffects } from "../effects/OrbEffects";
import { useGameStore } from "../../store/gameStore";
import { useMemo } from "react";
import { isMobile } from "react-device-detect";

const BASE_ORB_RADIUS = 1.5; // Base orbit radius
const BASE_ORB_SPEED = 2; // Base orbit speed
const BASE_ATTACK_RANGE = 5; // Base range to detect enemies
const BASE_ATTACK_DAMAGE = 25; // Base damage
const BASE_ATTACK_COOLDOWN = 1.5; // Base time between attacks in seconds
const DAMAGE_RADIUS = 1; // Radius for area damage
const MOBILE_ORB_SPEED_MULTIPLIER = 0.8;
const MOBILE_PATTERN_SIMPLIFICATION = 0.5;

interface MagicOrbProps {
  playerRef: React.RefObject<RigidBody>;
}

export function MagicOrb({ playerRef }: MagicOrbProps) {
  // Refs for all orbs
  const orbsRef = useRef<Group[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackingOrbs, setAttackingOrbs] = useState<{ [key: number]: any }>(
    {}
  );
  const [attackProgress, setAttackProgress] = useState(0);
  const [canAttack, setCanAttack] = useState(true);
  const [hitEffects, setHitEffects] = useState<
    { position: Vector3; key: string }[]
  >([]);

  // Refs for tracking positions and timing
  const lastAttackTime = useRef(0);
  const startPositions = useRef<{ [key: number]: Vector3 }>({});
  const midPoints = useRef<{ [key: number]: Vector3 }>({});
  const frameCount = useRef(0);
  const trailPoints = useRef<Vector3[]>([]);
  const tempVec3 = useRef(new Vector3());
  const tempTargetPos = useRef(new Vector3());
  const tempMidPoint = useRef(new Vector3());
  const tempReturnTarget = useRef(new Vector3());

  // Add a UUID generator for truly unique keys
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  const addHitEffect = (position: Vector3) => {
    setHitEffects((prev) => [
      ...prev,
      {
        position,
        key: generateUUID(), // Use UUID instead of timestamp + counter
      },
    ]);
  };

  // Get all relevant stats from game store
  const creeps = useGameStore((state) => state.creeps);
  const damageCreep = useGameStore((state) => state.damageCreep);
  const damage = useGameStore((state) => state.upgrades.damage);
  const range = useGameStore((state) => state.upgrades.range);
  const speed = useGameStore((state) => state.upgrades.speed);
  const orbSpeed = useGameStore((state) => state.orbSpeed);
  const multishot = useGameStore((state) => state.upgrades.multishot);
  const splash = useGameStore((state) => state.upgrades.splash);
  const pierce = useGameStore((state) => state.upgrades.pierce);
  const chain = useGameStore((state) => state.upgrades.chain);
  const crit = useGameStore((state) => state.upgrades.crit);
  const fireRing = useGameStore((state) => state.upgrades.fireRing);
  const frostfire = useGameStore((state) => state.upgrades.frostfire);
  const meteor = useGameStore((state) => state.upgrades.meteor);

  // Calculate actual values based on upgrades
  const actualDamage = BASE_ATTACK_DAMAGE * (1 + damage * 0.1);
  const actualRange = BASE_ATTACK_RANGE * (1 + range * 0.1);
  const actualCooldown = BASE_ATTACK_COOLDOWN * (1 - speed * 0.12);
  const actualOrbSpeed = BASE_ORB_SPEED * orbSpeed;
  const multishotChance = multishot * 0.15; // 15% chance per level
  const pierceDamageMultiplier = 0.5 + pierce * 0.05; // 50% base pierce damage, +5% per level
  const chainDamageMultiplier = 0.4 + chain * 0.04; // 40% base chain damage, +4% per level
  const critChance = crit * 0.15; // 15% chance per level
  const fireRingDamage = actualDamage * 0.3 * fireRing;
  const frostfireSlowAmount = frostfire * 0.3;
  const meteorChance = meteor * 0.1;
  const meteorDamage = actualDamage * 3;

  // Calculate splash damage based on upgrade level
  const splashRadius = useMemo(() => {
    return 2 + splash * 0.5; // Radius increases by 0.5 units per level
  }, [splash]);

  const splashDamageMultiplier = useMemo(() => {
    return 0.5 + splash * 0.1; // 50% base splash damage, +10% per level
  }, [splash]);

  // Get multishot level and calculate number of orbs
  const numAdditionalOrbs = Math.floor(multishotChance); // Full orbs
  const partialOrbOpacity = multishotChance % 1; // Opacity for the partial orb
  const totalOrbs = numAdditionalOrbs + (partialOrbOpacity > 0 ? 1 : 0) + 1; // +1 for main orb

  const findNearestEnemies = () => {
    if (!orbsRef.current[0] || !playerRef.current || !canAttack) return [];

    return creeps
      .filter((enemy) => {
        if (!enemy || enemy.health <= 0) return false;
        tempVec3.current.set(enemy.position[0], enemy.position[1], enemy.position[2]);
        const dist = tempVec3.current.distanceTo(orbsRef.current[0].position);
        return dist <= actualRange;
      })
      .sort((a, b) => {
        tempVec3.current.set(a.position[0], a.position[1], a.position[2]);
        const distA = tempVec3.current.distanceTo(orbsRef.current[0].position);
        tempVec3.current.set(b.position[0], b.position[1], b.position[2]);
        const distB = tempVec3.current.distanceTo(orbsRef.current[0].position);
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
        const targetEnemy =
          nearbyEnemies[Math.min(i, nearbyEnemies.length - 1)];
        newAttackingOrbs[i] = targetEnemy;
        startPositions.current[i] = orb.position.clone();
        const targetPos = new Vector3(
          targetEnemy.position[0],
          targetEnemy.position[1] + 1,
          targetEnemy.position[2]
        );
        midPoints.current[i] = calculateArcPoint(
          startPositions.current[i],
          targetPos,
          3
        );
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

  const splashRadiusRef = useRef<Mesh>(null);

  const applyDamage = (creepId: string, baseDamage: number, pierceCount = 0, chainCount = 0) => {
    // Calculate critical strike
    const isCrit = Math.random() < critChance;
    const damageMultiplier = isCrit ? 2 : 1;
    let finalDamage = baseDamage * damageMultiplier;

    // Apply pierce or chain damage reduction if applicable
    if (pierceCount > 0) {
      finalDamage *= Math.pow(pierceDamageMultiplier, pierceCount);
    }
    if (chainCount > 0) {
      finalDamage *= Math.pow(chainDamageMultiplier, chainCount);
    }

    // Apply damage to the target
    damageCreep(creepId, finalDamage);

    // Get hit position
    const hitPos = new Vector3(
      creeps.find(c => c.id === creepId)?.position[0] || 0,
      creeps.find(c => c.id === creepId)?.position[1] || 0,
      creeps.find(c => c.id === creepId)?.position[2] || 0
    );

    // Add hit effect
    addHitEffect(hitPos);

    // Check for meteor proc
    if (meteor > 0 && Math.random() < meteorChance) {
      spawnMeteor(hitPos);
    }

    // Create fire ring if skilled
    if (fireRing > 0) {
      setActiveFireRings(prev => [
        ...prev,
        { position: hitPos.clone(), timeLeft: 3 } // 3 second duration
      ]);
    }

    // Create frostfire if skilled
    if (frostfire > 0) {
      setActiveFrostfires(prev => [
        ...prev,
        { position: hitPos.clone(), timeLeft: 4 } // 4 second duration
      ]);
    }

    // Handle pierce
    if (pierceCount < pierce) {
      const nextTarget = creeps.find(c => 
        c.id !== creepId && 
        c.health > 0 &&
        new Vector3(...c.position).distanceTo(hitPos) <= actualRange
      );
      if (nextTarget) {
        applyDamage(nextTarget.id, baseDamage, pierceCount + 1, 0);
      }
    }

    // Handle chain
    if (chainCount < chain) {
      const nextTarget = creeps.find(c => 
        c.id !== creepId && 
        c.health > 0 &&
        new Vector3(...c.position).distanceTo(hitPos) <= actualRange * 0.6
      );
      if (nextTarget) {
        applyDamage(nextTarget.id, baseDamage, 0, chainCount + 1);
      }
    }
  };

  // Store active effects
  const [activeFireRings, setActiveFireRings] = useState<{
    position: Vector3;
    timeLeft: number;
  }[]>([]);
  const [activeFrostfires, setActiveFrostfires] = useState<{
    position: Vector3;
    timeLeft: number;
  }[]>([]);

  const spawnMeteor = (position: Vector3) => {
    // Create meteor effect
    const meteorPos = position.clone().add(new Vector3(0, 10, 0));
    const meteorTarget = position.clone();
    
    // Add visual effect for meteor (you'll need to implement this)
    // addMeteorEffect(meteorPos, meteorTarget);

    // After a short delay, apply meteor damage
    setTimeout(() => {
      creeps.forEach(creep => {
        const creepPos = new Vector3(...creep.position);
        const distance = creepPos.distanceTo(meteorTarget);
        if (distance <= 5) { // Large area of effect
          const falloff = 1 - (distance / 5);
          damageCreep(creep.id, meteorDamage * falloff);
        }
      });
    }, 1000); // 1 second delay for meteor to land
  };

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const position = playerRef.current.translation();
    const playerPos = new Vector3(position.x, position.y, position.z);
    const speedMultiplier = isMobile ? MOBILE_ORB_SPEED_MULTIPLIER : 1;
    const time = Date.now() * 0.002 * actualOrbSpeed * (1 + speed * 0.12) * speedMultiplier;

    // Complex orbit pattern for non-attacking orbs
    orbsRef.current.forEach((orb, index) => {
      if (!orb || attackingOrbs[index]) return;

      const baseAngle = time + (Math.PI * 2 * index) / orbsRef.current.length;
      
      // Simplified pattern for mobile
      if (isMobile) {
        const simpleRadius = BASE_ORB_RADIUS * (1 + range / 4);
        const orbitX = Math.cos(baseAngle) * simpleRadius;
        const orbitZ = Math.sin(baseAngle) * simpleRadius;
        orb.position.set(
          playerPos.x + orbitX,
          playerPos.y + 1,
          playerPos.z + orbitZ
        );
        return;
      }

      // Original complex pattern for desktop
      const frequency1 = 1;
      const frequency2 = 0.5;
      const phase = (index * Math.PI) / 3;

      // Main orbit
      const mainRadius = BASE_ORB_RADIUS * (1 + range / 4);

      // Add secondary movements
      const radiusModulation = Math.sin(time * frequency2 + phase) * 0.3;
      const currentRadius = mainRadius * (1 + radiusModulation);

      // Create a figure-8 like pattern
      const orbitX =
        Math.cos(baseAngle * frequency1) * currentRadius +
        Math.sin(time * frequency2 + phase) * mainRadius * 0.2;
      const orbitZ =
        Math.sin(baseAngle * frequency1) * currentRadius +
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
        tempTargetPos.current.set(
          target.position[0],
          target.position[1] + 1,
          target.position[2]
        );

        if (newProgress < 0.5) {
          // Moving to enemy
          const t = newProgress * 2;
          tempMidPoint.current.lerpVectors(startPos, midPoint, t);
          tempReturnTarget.current.lerpVectors(midPoint, tempTargetPos.current, t);
          const pos = new Vector3().lerpVectors(tempMidPoint.current, tempReturnTarget.current, t);
          orb.position.copy(pos);

          if (newProgress >= 0.45) {
            applyDamage(target.id, actualDamage);
          }
        } else {
          // Returning to orbit
          const t = (newProgress - 0.5) * 2;
          tempReturnTarget.current.set(
            playerPos.x +
              Math.cos(
                time +
                  (Math.PI * 2 * parseInt(orbIndex)) /
                    Object.keys(attackingOrbs).length
              ) *
                BASE_ORB_RADIUS,
            playerPos.y + 1,
            playerPos.z +
              Math.sin(
                time +
                  (Math.PI * 2 * parseInt(orbIndex)) /
                    Object.keys(attackingOrbs).length
              ) *
                BASE_ORB_RADIUS
          );
          orb.position.lerp(tempReturnTarget.current, t);
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

    // Visual effect for splash radius
    if (splashRadiusRef.current && splash > 0) {
      splashRadiusRef.current.scale.setScalar(splashRadius);
      splashRadiusRef.current.position.copy(orbsRef.current[0].position);

      // Pulse effect
      const pulse = (Math.sin(Date.now() * 0.002 * 2) + 1) * 0.1;
      splashRadiusRef.current.material.opacity = 0.1 + pulse;
    }

    // Update fire rings
    if (fireRing > 0) {
      setActiveFireRings(prev => 
        prev.map(ring => {
          const newTimeLeft = ring.timeLeft - delta;
          if (newTimeLeft <= 0) return null;

          // Deal damage to enemies in range
          creeps.forEach(creep => {
            const creepPos = new Vector3(...creep.position);
            if (creepPos.distanceTo(ring.position) <= 2) {
              damageCreep(creep.id, fireRingDamage * delta);
            }
          });

          return { ...ring, timeLeft: newTimeLeft };
        }).filter(Boolean) as typeof activeFireRings
      );
    }

    // Update frostfire patches
    if (frostfire > 0) {
      setActiveFrostfires(prev =>
        prev.map(frost => {
          const newTimeLeft = frost.timeLeft - delta;
          if (newTimeLeft <= 0) return null;

          // Apply slow and damage to enemies in range
          creeps.forEach(creep => {
            const creepPos = new Vector3(...creep.position);
            if (creepPos.distanceTo(frost.position) <= 3) {
              damageCreep(creep.id, fireRingDamage * 0.5 * delta);
              // Apply slow effect (this would need to be implemented in the creep movement logic)
              // slowCreep(creep.id, frostfireSlowAmount);
            }
          });

          return { ...frost, timeLeft: newTimeLeft };
        }).filter(Boolean) as typeof activeFrostfires
      );
    }
  });

  return (
    <group>
      {Array(totalOrbs)
        .fill(null)
        .map((_, index) => {
          const opacity =
            index === 0
              ? 1
              : index <= numAdditionalOrbs
              ? 1
              : partialOrbOpacity;
          return (
            <group
              key={index}
              ref={(el) => {
                if (el) {
                  orbsRef.current[index] = el;
                }
              }}
            >
              <OrbEffects
                isAttacking={isAttacking && attackingOrbs[index] !== undefined}
                opacity={opacity}
              />
              <OrbTrail
                isAttacking={isAttacking && attackingOrbs[index] !== undefined}
              />
            </group>
          );
        })}
      {/* Hit Effects */}
      {hitEffects.map(({ position, key }) => (
        <HitSparks
          key={key}
          position={position}
          onComplete={() => {
            setHitEffects((prev) =>
              prev.filter((effect) => effect.key !== key)
            );
          }}
        />
      ))}
      {/* Splash radius indicator */}
      {splash > 0 && (
        <mesh ref={splashRadiusRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#4a9eff"
            transparent
            opacity={0.1}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Fire Rings */}
      {activeFireRings.map((ring, index) => (
        <mesh key={index}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial
            color="#ff9900"
            transparent
            opacity={0.5}
            side={DoubleSide}
            depthWrite={false}
          />
          <OrbEffects position={ring.position} />
        </mesh>
      ))}
      {/* Frostfire Patches */}
      {activeFrostfires.map((frost, index) => (
        <mesh key={index}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial
            color="#66ccff"
            transparent
            opacity={0.5}
            side={DoubleSide}
            depthWrite={false}
          />
          <OrbEffects position={frost.position} />
        </mesh>
      ))}
    </group>
  );
}
