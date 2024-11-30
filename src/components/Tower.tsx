import { Vector3, Color } from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float } from '@react-three/drei';

interface TowerProps {
  position: Vector3 | [number, number, number];
  type: string;
  level?: number;
  preview?: boolean;
  onDamageEnemy?: (enemyId: number, damage: number, effects: any) => void;
  canAfford?: boolean;
}

interface Arrow {
  id: number;
  position: Vector3;
  direction: Vector3;
  startTime: number;
}

export function Tower({ position, type, level = 1, preview, onDamageEnemy, canAfford = true }: TowerProps) {
  const phase = useGameStore(state => state.phase);
  const lastAttackTime = useRef(0);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2); // 20% range increase per level
  const damage = stats.damage * (1 + (level - 1) * 0.3); // 30% damage increase per level
  const [arrows, setArrows] = useState<Arrow[]>([]);

  useFrame((state) => {
    if (phase !== 'combat' || preview) return;

    const currentTime = state.clock.getElapsedTime() * 1000;
    if (currentTime - lastAttackTime.current < attackCooldown) return;

    // Get all creeps
    const creeps = useGameStore.getState().creeps;
    if (!creeps.length) return;

    // Find closest creep in range
    const towerPos = position instanceof Vector3 ? position : new Vector3(...position);
    let closestCreep = null;
    let closestDistance = Infinity;

    for (const creep of creeps) {
      const creepPos = new Vector3(creep.position[0], creep.position[1], creep.position[2]);
      const distance = towerPos.distanceTo(creepPos);

      if (distance <= range && distance < closestDistance) {
        closestDistance = distance;
        closestCreep = creep;
      }
    }

    if (closestCreep) {
      // Create arrow
      const creepPos = new Vector3(closestCreep.position[0], closestCreep.position[1], closestCreep.position[2]);
      const direction = creepPos.clone().sub(towerPos).normalize();

      const newArrow = {
        id: Math.random(),
        position: new Vector3(towerPos.x, towerPos.y + 2, towerPos.z),
        direction: direction,
        startTime: currentTime,
      };

      setArrows(prev => [...prev, newArrow]);

      // Apply damage
      if (onDamageEnemy) {
        onDamageEnemy(closestCreep.id, damage, {
          slow: type === 'ice' ? 0.5 : 0,
          amplify: type === 'arcane' ? 0.3 : 0,
          poison: type === 'nature' ? damage * 0.2 : 0,
          armor: type === 'void' ? 0.2 : 0,
        });
      }

      lastAttackTime.current = currentTime;
    }

    // Cleanup old arrows
    setArrows(prev => prev.filter(arrow => currentTime - arrow.startTime < 1000));
  });

  return (
    <group position={position instanceof Vector3 ? position.toArray() : position}>
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.5}
      >
        <RigidBody type="fixed" colliders="hull">
          {/* Base */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.8, 2, 8]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
              transparent={preview}
              opacity={preview ? (canAfford ? 0.7 : 0.3) : 1}
            />
            <Edges color={stats.emissive} />
          </mesh>

          {/* Top */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.6, 0.4, 8]} />
            <meshStandardMaterial
              color={stats.color}
              emissive={stats.emissive}
              emissiveIntensity={0.8}
              metalness={0.9}
              roughness={0.1}
              transparent={preview}
              opacity={preview ? (canAfford ? 0.7 : 0.3) : 1}
            />
            <Edges color={stats.emissive} />
          </mesh>

          {/* Element-specific decorations */}
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rotation, index) => (
            <mesh
              key={index}
              position={[0, 2, 0]}
              rotation={[0, rotation, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 0.3, 1]} />
              <meshStandardMaterial
                color={stats.emissive}
                emissive={stats.emissive}
                emissiveIntensity={1}
                metalness={1}
                roughness={0}
                transparent={preview}
                opacity={preview ? (canAfford ? 0.7 : 0.3) : 1}
              />
              <Edges color={stats.color} />
            </mesh>
          ))}
        </RigidBody>
      </Float>

      {/* Range indicator */}
      {(phase === 'prep' || preview) && (
        <>
          {/* Filled range circle */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[range, 64]} />
            <meshBasicMaterial
              color={stats.color}
              transparent
              opacity={preview ? (canAfford ? 0.2 : 0.1) : 0.15}
              side={2} // Double sided
              depthWrite={false}
            />
          </mesh>
          {/* Range outline */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[range - 0.05, range, 128]} />
            <meshBasicMaterial
              color={stats.emissive}
              transparent
              opacity={preview ? (canAfford ? 0.6 : 0.3) : 0.4}
              side={2} // Double sided
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {/* Arrows */}
      {!preview && arrows.map(arrow => (
        <Arrow
          key={arrow.id}
          startPosition={arrow.position}
          direction={arrow.direction}
          color={stats.color}
        />
      ))}
    </group>
  );
}

function Arrow({ startPosition, direction, color }: {
  startPosition: Vector3;
  direction: Vector3;
  color: string;
}) {
  const arrowRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!arrowRef.current) return;

    const age = (Date.now() - startTime.current) / 1000; // Convert to seconds
    const speed = 20; // Units per second
    const position = startPosition.clone().add(
      direction.clone().multiplyScalar(age * speed)
    );

    arrowRef.current.position.copy(position);

    // Point in direction of travel
    const rotation = new Vector3(0, 0, 0);
    rotation.y = Math.atan2(direction.x, direction.z);
    rotation.x = Math.asin(-direction.y);
    arrowRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
  });

  return (
    <group ref={arrowRef}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
