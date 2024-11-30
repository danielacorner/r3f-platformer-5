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

    const now = Date.now();
    if (now - lastAttackTime.current >= attackCooldown) {
      // Find enemies group
      const enemiesGroup = state.scene.getObjectByName('enemies');
      if (!enemiesGroup) return;

      // Get all enemies within range
      const enemies = enemiesGroup.children
        .filter(enemy => {
          const distance = new Vector3(...position as [number, number, number])
            .distanceTo(enemy.position);
          return distance <= range && enemy.userData?.enemyId !== undefined;
        })
        .map(enemy => ({
          distance: new Vector3(...position as [number, number, number])
            .distanceTo(enemy.position),
          enemy
        }))
        .sort((a, b) => a.distance - b.distance);

      if (enemies.length > 0) {
        // Get target enemy
        const { enemy: targetEnemy } = enemies[0];
        const enemyId = targetEnemy.userData?.enemyId;

        // Calculate effects based on tower type and level
        const effects = {
          slow: 0,
          amplify: 1,
          dot: 0,
          armor: 0,
          splash: 0
        };

        // Apply special effects based on tower type
        if (stats.special) {
          switch (stats.special.type) {
            case 'slow':
              effects.slow = stats.special.value;
              break;
            case 'amplify':
              effects.amplify = 1 + stats.special.value;
              break;
            case 'poison':
              effects.dot = stats.special.value * damage;
              break;
            case 'splash':
              effects.splash = stats.special.value;
              // Apply splash damage to nearby enemies
              if (effects.splash > 0) {
                enemies.slice(1).forEach(({ enemy, distance }) => {
                  if (distance <= range * 0.5) { // Splash range is 50% of tower range
                    const splashDamageMultiplier = 1 - (distance / (range * 0.5)); // Linear falloff
                    const splashDamage = damage * effects.splash * splashDamageMultiplier;
                    if (enemy.userData?.enemyId !== undefined) {
                      onDamageEnemy?.(enemy.userData.enemyId, splashDamage, effects);
                    }
                  }
                });
              }
              break;
            case 'armor_reduction':
              effects.armor = stats.special.value;
              break;
          }
        }

        // Deal damage to primary target
        onDamageEnemy?.(enemyId, damage, effects);
        lastAttackTime.current = now;

        // Create arrow effect
        const arrowDirection = new Vector3()
          .subVectors(targetEnemy.position, new Vector3(...position as [number, number, number]))
          .normalize();

        setArrows(prev => [
          ...prev,
          {
            id: now,
            position: new Vector3(...position as [number, number, number]).add(new Vector3(0, 1.5, 0)),
            direction: arrowDirection,
            startTime: now
          }
        ]);
      }
    }

    // Update and remove old arrows
    setArrows(prev => 
      prev.filter(arrow => {
        const age = now - arrow.startTime;
        return age < 1000; // Remove arrows after 1 second
      })
    );
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
