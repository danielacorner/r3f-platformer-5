import { Vector3, Color, Euler } from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { TOWER_STATS } from '../store/gameStore';
import { Edges, Float, Trail } from '@react-three/drei';

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
  const creeps = useGameStore(state => state.creeps);
  const lastAttackTime = useRef(0);
  const stats = TOWER_STATS[type];
  const attackCooldown = 1000 / stats.attackSpeed;
  const range = stats.range * (1 + (level - 1) * 0.2); // 20% range increase per level
  const damage = stats.damage * (1 + (level - 1) * 0.3); // 30% damage increase per level
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // Skip combat logic if preview
  useFrame((state) => {
    if (phase !== 'combat' || preview) return;

    const currentTime = state.clock.getElapsedTime() * 1000;
    if (currentTime - lastAttackTime.current < attackCooldown) return;

    if (!creeps.length) {
      console.log('No creeps found');
      return;
    }
    console.log('Found creeps:', creeps.length);

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
      console.log('Found target creep at distance:', closestDistance);
      // Create arrow
      const creepPos = new Vector3(closestCreep.position[0], closestCreep.position[1], closestCreep.position[2]);
      const direction = creepPos.clone().sub(towerPos).normalize();

      const newArrow = {
        id: Math.random(),
        position: towerPos.clone().add(new Vector3(0, 2, 0)),
        direction: direction,
        startTime: currentTime,
      };

      console.log('Creating new arrow:', newArrow);
      setArrows(prev => {
        console.log('Current arrows:', prev.length);
        return [...prev, newArrow];
      });

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

      // Cleanup old arrows after 2 seconds
      setTimeout(() => {
        setArrows(prev => prev.filter(a => a.id !== newArrow.id));
      }, 2000);
    } else {
      console.log('No creep in range. Range:', range);
    }
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
              side={2}
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
              side={2}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {/* Arrows */}
      {arrows.map(arrow => (
        <Arrow
          key={arrow.id}
          startPosition={arrow.position}
          direction={arrow.direction}
          color={stats.emissive}
          startTime={arrow.startTime}
        />
      ))}
    </group>
  );
}

function Arrow({ startPosition, direction, color, startTime }: {
  startPosition: Vector3;
  direction: Vector3;
  color: string;
  startTime: number;
}) {
  const arrowRef = useRef<THREE.Group>(null);
  const speed = 1.5; // Increased speed

  useFrame((state) => {
    if (!arrowRef.current) return;

    const currentTime = state.clock.getElapsedTime();
    const age = currentTime - startTime / 1000; // Convert to seconds
    
    // Update position
    const position = startPosition.clone().add(
      direction.clone().multiplyScalar(age * speed * 60)
    );
    arrowRef.current.position.copy(position);

    // Point in direction of travel
    const rotation = new Euler(0, 0, 0);
    rotation.y = Math.atan2(direction.x, direction.z);
    rotation.x = Math.atan2(-direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
    arrowRef.current.setRotationFromEuler(rotation);
  });

  return (
    <group ref={arrowRef}>
      {/* Arrow trail effect */}
      <Trail
        width={2}
        length={4}
        color={new Color(color)}
        attenuation={(t) => t * t}
      >
        <mesh visible={false}>
          <sphereGeometry args={[0.1]} />
        </mesh>
      </Trail>

      {/* Arrow shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={10}
          toneMapped={false}
        />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={10}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
