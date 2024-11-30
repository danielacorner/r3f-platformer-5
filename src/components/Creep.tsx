import { useRef, useEffect } from 'react';
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
  normal: 0.05,
  armored: 0.03,
  fast: 0.08,
  boss: 0.02,
};

export function Creep({ position, pathPoints, type, health, id }: CreepProps) {
  const creepRef = useRef<THREE.Group>(null);
  const pathIndex = useRef(0);
  const lerpFactor = useRef(0);
  const currentHealth = useRef(health);
  const { loseLife } = useGameStore();

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

  useFrame((state, delta) => {
    moveAlongPath(delta);
  });

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
