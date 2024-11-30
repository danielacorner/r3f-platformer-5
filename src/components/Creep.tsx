import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { Vector3, MeshStandardMaterial, Color } from 'three';
import { Trail, Float } from '@react-three/drei';

interface CreepProps {
  position: [number, number, number];
  pathPoints: Vector3[];
  type: 'normal' | 'armored' | 'fast' | 'boss';
  health: number;
  id: number;
}

// Shared materials for performance
const creepMaterials = {
  normal: new MeshStandardMaterial({
    color: new Color('#ef4444').convertSRGBToLinear(),
    roughness: 0.3,
    metalness: 0.7,
    emissive: new Color('#b91c1c'),
    emissiveIntensity: 0.2,
  }),
  armored: new MeshStandardMaterial({
    color: new Color('#6b7280').convertSRGBToLinear(),
    roughness: 0.1,
    metalness: 0.9,
  }),
  fast: new MeshStandardMaterial({
    color: new Color('#22c55e').convertSRGBToLinear(),
    roughness: 0.4,
    metalness: 0.6,
    emissive: new Color('#15803d'),
    emissiveIntensity: 0.2,
  }),
  boss: new MeshStandardMaterial({
    color: new Color('#8b5cf6').convertSRGBToLinear(),
    roughness: 0.2,
    metalness: 0.8,
    emissive: new Color('#6d28d9'),
    emissiveIntensity: 0.3,
  }),
};

const creepScales = {
  normal: 0.8,
  armored: 1,
  fast: 0.6,
  boss: 1.5,
};

const creepSpeeds = {
  normal: 0.5,
  armored: 0.03,
  fast: 0.08,
  boss: 0.02,
};

export function Creep({ position, pathPoints, type, health, id }: CreepProps) {
  const creepRef = useRef<THREE.Group>(null);
  const pathIndex = useRef(0);
  const lerpFactor = useRef(0);
  const currentHealth = useRef(health);
  const { loseLife, removeEnemy, addMoney } = useGameStore();
  const [effects, setEffects] = useState({
    slow: 0,
    amplify: 1,
    dot: 0,
    splash: 0,
    armor: 0
  });

  // Calculate the next position along the path
  const moveAlongPath = (delta: number) => {
    if (!creepRef.current || pathIndex.current >= pathPoints.length - 1) return;

    const currentPoint = pathPoints[pathIndex.current];
    const nextPoint = pathPoints[pathIndex.current + 1];

    lerpFactor.current += creepSpeeds[type] * delta;

    if (lerpFactor.current >= 1) {
      lerpFactor.current = 0;
      pathIndex.current++;

      // Reached the end of the path
      if (pathIndex.current >= pathPoints.length - 1) {
        loseLife();
        // Remove creep
        if (creepRef.current) {
          creepRef.current.parent?.remove(creepRef.current);
        }
        return;
      }
    }

    const newPosition = currentPoint.clone().lerp(nextPoint, lerpFactor.current);
    creepRef.current.position.copy(newPosition);

    // Calculate direction for rotation
    const direction = nextPoint.clone().sub(currentPoint);
    if (direction.length() > 0) {
      const angle = Math.atan2(direction.x, direction.z);
      creepRef.current.rotation.y = angle;
    }
  };

  // Handle damage and effects
  const takeDamage = (damage: number, newEffects: any) => {
    // Apply armor and damage amplification
    const effectiveArmor = Math.max(-10, Math.min(10, effects.armor + newEffects.armor));
    const damageMultiplier = effects.amplify * newEffects.amplify;
    const armorMultiplier = 1 - (effectiveArmor > 0 ? effectiveArmor * 0.05 : effectiveArmor * 0.03);
    const finalDamage = damage * damageMultiplier * armorMultiplier;

    currentHealth.current -= finalDamage;

    // Update effects
    setEffects({
      slow: Math.max(effects.slow, newEffects.slow),
      amplify: newEffects.amplify > 1 ? newEffects.amplify : effects.amplify,
      dot: effects.dot + newEffects.dot,
      splash: Math.max(effects.splash, newEffects.splash),
      armor: effectiveArmor
    });

    // Check for death
    if (currentHealth.current <= 0) {
      if (creepRef.current) {
        // Add money based on enemy type
        const bounty = type === 'boss' ? 100 :
          type === 'armored' ? 40 :
            type === 'fast' ? 25 : 20;
        addMoney(bounty);

        // Remove enemy
        removeEnemy(id);
        creepRef.current.parent?.remove(creepRef.current);
      }
    }
  };

  // Apply damage over time effects
  useFrame((state, delta) => {
    if (effects.dot > 0) {
      takeDamage(effects.dot * delta, { amplify: 1, armor: 0, slow: 0, dot: 0, splash: 0 });
    }

    moveAlongPath(delta * (1 - effects.slow));
  });

  // Add enemy to userData for targeting
  useEffect(() => {
    if (creepRef.current) {
      creepRef.current.userData.enemyId = id;
      creepRef.current.userData.takeDamage = takeDamage;
    }
  }, [id]);

  return (
    <group ref={creepRef} position={position}>
      <Float
        speed={5}
        rotationIntensity={0.1}
        floatIntensity={0.2}
        scale={creepScales[type]}
      >
        <Trail
          width={0.5}
          length={4}
          color={creepMaterials[type].color}
          attenuation={(t) => t * t}
        >
          <mesh castShadow material={creepMaterials[type]}>
            {type === 'boss' ? (
              <dodecahedronGeometry args={[1]} />
            ) : type === 'armored' ? (
              <icosahedronGeometry args={[1]} />
            ) : type === 'fast' ? (
              <tetrahedronGeometry args={[1]} />
            ) : (
              <octahedronGeometry args={[1]} />
            )}
          </mesh>
        </Trail>
      </Float>
    </group>
  );
}
