import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { Vector3, MeshStandardMaterial, Color } from 'three';
import { Trail, Float, Billboard } from '@react-three/drei';

interface CreepProps {
  position: [number, number, number];
  pathPoints: Vector3[];
  type: 'normal' | 'armored' | 'fast' | 'boss';
  health: number;
  id: number;
  removeEnemy: (id: number) => void;
}

interface CreepEffects {
  slow: number;      // Slow percentage (0-1)
  amplify: number;   // Damage amplification (1+)
  dot: number;       // Damage over time
  armor: number;     // Armor reduction (0-1)
  splash: number;    // Splash damage multiplier
}

const defaultEffects: CreepEffects = {
  slow: 0,
  amplify: 1,
  dot: 0,
  armor: 0,
  splash: 0
};

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

const baseSpeed = 5; // Increased from previous value

const creepSpeeds = {
  normal: baseSpeed * 0.05,
  armored: baseSpeed * 0.03,
  fast: baseSpeed * 0.08,
  boss: baseSpeed * 0.02,
};

const creepHealth = {
  normal: 100,
  armored: 200,
  fast: 50,
  boss: 500,
};

const creepArmor = {
  normal: 0,
  armored: 10,
  fast: 0,
  boss: 20,
};

export function Creep({ position, pathPoints, type, id, removeEnemy }: CreepProps) {
  const creepRef = useRef<THREE.Group>(null);
  const pathIndex = useRef(0);
  const lerpFactor = useRef(0);
  const [health, setHealth] = useState(creepHealth[type]);
  const maxHealth = useRef(creepHealth[type]);
  const [effects, setEffects] = useState<CreepEffects>(defaultEffects);
  const addMoney = useGameStore(state => state.addMoney);
  const setEnemiesAlive = useGameStore(state => state.setEnemiesAlive);
  const setLevelComplete = useGameStore(state => state.setLevelComplete);

  // Calculate the next position along the path
  const moveAlongPath = (delta: number) => {
    if (!creepRef.current || pathIndex.current >= pathPoints.length - 1) return;

    const currentPoint = pathPoints[pathIndex.current];
    const nextPoint = pathPoints[pathIndex.current + 1];

    lerpFactor.current += creepSpeeds[type] * delta * (1 - effects.slow);

    if (lerpFactor.current >= 1) {
      lerpFactor.current = 0;
      pathIndex.current++;

      // Reached the end of the path
      if (pathIndex.current >= pathPoints.length - 1) {
        setEnemiesAlive(prev => prev - 1);
        if (prev - 1 === 0) {
          setLevelComplete(true);
        }
        removeEnemy(id);
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

  const takeDamage = (amount: number, newEffects: CreepEffects) => {
    // Apply damage amplification
    const amplifiedDamage = amount * (1 + (effects.amplify - 1));

    // Apply armor reduction
    const armorMultiplier = 1 - Math.max(0, creepArmor[type] - effects.armor) / 100;
    const finalDamage = amplifiedDamage * armorMultiplier;

    setHealth(prev => {
      const newHealth = prev - finalDamage;
      if (newHealth <= 0) {
        // Add money based on enemy type
        const bounty = type === 'boss' ? 100 :
          type === 'armored' ? 40 :
          type === 'fast' ? 25 : 20;
        addMoney(bounty);
        removeEnemy(id);
      }
      return Math.max(0, newHealth);
    });

    // Update effects (take highest value for each effect)
    setEffects(prev => ({
      slow: Math.max(prev.slow, newEffects.slow),
      amplify: Math.max(prev.amplify, newEffects.amplify),
      dot: Math.max(prev.dot, newEffects.dot),
      armor: Math.max(prev.armor, newEffects.armor),
      splash: Math.max(prev.splash, newEffects.splash)
    }));
  };

  useFrame((state, delta) => {
    if (health <= 0) return;

    // Apply damage over time
    if (effects.dot > 0) {
      takeDamage(effects.dot * delta, defaultEffects);
    }

    // Move along path
    moveAlongPath(delta);

    // Decay effects over time
    setEffects(prev => ({
      slow: Math.max(0, prev.slow - 0.1 * delta),
      amplify: Math.max(1, prev.amplify - 0.2 * delta),
      dot: Math.max(0, prev.dot - 5 * delta),
      armor: Math.max(0, prev.armor - 0.1 * delta),
      splash: Math.max(0, prev.splash - 0.2 * delta)
    }));
  });

  // Add enemy to userData for targeting
  useEffect(() => {
    if (creepRef.current) {
      creepRef.current.userData = {
        ...creepRef.current.userData,
        enemyId: id,
        takeDamage
      };
    }
  }, [id]);

  if (health <= 0) return null;

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

      {/* Health Bar */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        {/* Background bar */}
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[1, 0.2]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        {/* Health bar */}
        <mesh position={[(-0.5 + (health / maxHealth.current) * 0.5), 2, 0.01]}>
          <planeGeometry args={[1 * (health / maxHealth.current), 0.2]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      </Billboard>

      {/* Effect Indicators */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <group position={[0, 1.5, 0]}>
          {effects.slow > 0 && (
            <mesh position={[-0.4, 0, 0]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          )}
          {effects.amplify > 1 && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          )}
          {effects.dot > 0 && (
            <mesh position={[0.4, 0, 0]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
          )}
        </group>
      </Billboard>
    </group>
  );
}
