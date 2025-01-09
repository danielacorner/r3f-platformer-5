import { useRef, memo, useMemo, useEffect, useState } from 'react';
import { Vector3, Float32BufferAttribute } from 'three';
import { LightningStormShaderMaterial } from './SkillEffects/shaders/LightningStormShader';
import { extend, useFrame } from '@react-three/fiber';
import { StormCloud } from './StormCloud';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

extend({ LightningStormShaderMaterial });

interface LightningStormProps {
  position: Vector3;
  radius: number;
  level: number;
  color: string;
  seed: number;
  damage: number;
  duration: number;
  strikeInterval: number;
}

// Cache shared materials outside components to prevent recreation
const createSharedMaterials = (() => {
  const materialCache = new Map<string, { core: THREE.LineBasicMaterial, glow: THREE.LineBasicMaterial }>();
  
  return (color: string, width: number) => {
    const key = `${color}-${width}`;
    if (!materialCache.has(key)) {
      const core = new THREE.LineBasicMaterial({
        color,
        linewidth: 3 * width,
        toneMapped: false,
        fog: false
      });
      const glow = new THREE.LineBasicMaterial({
        color,
        linewidth: 6 * width,
        toneMapped: false,
        transparent: true,
        opacity: 0.3,
        fog: false
      });
      materialCache.set(key, { core, glow });
    }
    return materialCache.get(key)!;
  };
})();

// Reusable geometry for range indicator
const createRangeGeometry = (() => {
  let geometry: THREE.BufferGeometry | null = null;
  return () => {
    if (!geometry) {
      const positions = new Float32Array(
        Array.from({ length: 33 }, (_, i) => {
          const theta = (i / 32) * Math.PI * 2;
          return [Math.cos(theta), 0.1, Math.sin(theta)];
        }).flat()
      );
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    }
    return geometry;
  };
})();

const LightningBolt = ({
  startPos,
  endPos,
  color,
  isAmbient,
  intensity = 1,
  width = 1
}: {
  startPos: Vector3,
  endPos: Vector3,
  color: string,
  isAmbient: boolean,
  intensity?: number,
  width?: number
}) => {
  // Calculate direction and length for bolt
  const direction = endPos.clone().sub(startPos);
  const length = direction.length();
  const segments = Math.max(4, Math.min(12, Math.floor(length / 2)));

  // Create zigzag points
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const basePoint = startPos.clone().lerp(endPos, t);

      if (i > 0 && i < segments) {
        const perpX = new Vector3(1, 0, 0).cross(direction.clone().normalize());
        const perpZ = new Vector3(0, 0, 1).cross(direction.clone().normalize());
        const offset = perpX.multiplyScalar(Math.random() - 0.5)
          .add(perpZ.multiplyScalar(Math.random() - 0.5))
          .multiplyScalar(length * 0.15);
        basePoint.add(offset);
      }
      pts.push(basePoint);
    }
    return pts;
  }, [startPos, endPos, segments]);

  // Create branch points
  const branches = useMemo(() => {
    if (isAmbient) return [];

    const branchPoints = [];
    const numBranches = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numBranches; i++) {
      const segmentIndex = Math.floor(Math.random() * (segments - 2)) + 1;
      const start = points[segmentIndex];

      const branchDir = new Vector3(
        (Math.random() - 0.5) * 2,
        -Math.random() - 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const branchLength = length * (Math.random() * 0.2 + 0.1);
      const end = start.clone().add(branchDir.multiplyScalar(branchLength));

      const branchPoints = [];
      const branchSegments = 6;
      for (let j = 0; j <= branchSegments; j++) {
        const t = j / branchSegments;
        const basePoint = start.clone().lerp(end, t);

        if (j > 0 && j < branchSegments) {
          const perpX = new Vector3(1, 0, 0).cross(branchDir);
          const perpZ = new Vector3(0, 0, 1).cross(branchDir);
          const offset = perpX.multiplyScalar(Math.random() - 0.5)
            .add(perpZ.multiplyScalar(Math.random() - 0.5))
            .multiplyScalar(branchLength * 0.15);
          basePoint.add(offset);
        }
        branchPoints.push(basePoint);
      }
      branchPoints.push({ points: branchPoints });
    }
    return branchPoints;
  }, [points, isAmbient, segments]);

  return (
    <group renderOrder={1000}>
      <BoltLine points={points} color={color} width={width} />
      {branches.map((branch, i) => (
        <BoltLine 
          key={`branch-${i}`} 
          points={branch.points} 
          color={color} 
          width={width * 0.6}
        />
      ))}

      {/* Simplified point lights */}
      <pointLight
        position={endPos}
        color={color}
        intensity={10 * intensity}
        distance={5}
        decay={2}
        castShadow={false}
      />
    </group>
  );
};

// Separate component for bolt lines with shared materials
const BoltLine = memo(({ points, color, width }: { 
  points: Vector3[], 
  color: string, 
  width: number
}) => {
  const materials = useMemo(() => createSharedMaterials(color, width), [color, width]);

  // Create geometry
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [points]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <primitive object={new THREE.Line(geometry, materials.core)} />
      <primitive object={new THREE.Line(geometry, materials.glow)} />
    </group>
  );
});

// Memoized range indicator to prevent unnecessary recreations
const RangeIndicator = memo(({ radius, color }: { radius: number, color: string }) => {
  const geometry = useMemo(() => createRangeGeometry(), []);
  const material = useMemo(() => (
    new THREE.LineDashedMaterial({
      color,
      scale: 2,
      dashSize: 5,
      gapSize: 3,
      opacity: 0.5,
      transparent: true,
      fog: false
    })
  ), [color]);

  return (
    <group scale={radius}>
      <primitive object={new THREE.Line(geometry, material)} />
    </group>
  );
});

export const MemoizedStorm = memo(function LightningStorm({ position, radius, level, color, seed, damage, duration, strikeInterval }: LightningStormProps) {
  const boltsRef = useRef<Array<{
    id: number,
    start: Vector3,
    end: Vector3,
    isAmbient: boolean,
    createTime: number,
    expireTime: number,
    baseIntensity: number,
    currentIntensity: number,
    width: number
  }>>([]);
  const nextBoltId = useRef(0);
  const nextStrikeTime = useRef(Date.now());
  const nextAmbientTime = useRef(Date.now());
  const burstModeRef = useRef(false);
  const burstEndTime = useRef(0);
  const [, forceUpdate] = useState({});

  const MAX_CONCURRENT_BOLTS = 6; // Reduced max bolts

  // Handle all bolt updates in one place
  useFrame(() => {
    const now = Date.now();
    let needsUpdate = false;

    // Limit concurrent bolts
    if (boltsRef.current.length > MAX_CONCURRENT_BOLTS) {
      boltsRef.current = boltsRef.current.slice(-MAX_CONCURRENT_BOLTS);
    }

    // Update existing bolts' intensities and remove expired ones
    boltsRef.current = boltsRef.current.filter(bolt => {
      if (now >= bolt.expireTime) return false;

      const lifetime = bolt.expireTime - bolt.createTime;
      const elapsed = now - bolt.createTime;
      const progress = elapsed / lifetime;

      const baseIntensity = bolt.baseIntensity * (1 - progress * 1.2);
      const randomFlash = Math.sin(elapsed * 0.2) * 0.3 + Math.random() * 0.2;
      bolt.currentIntensity = Math.max(0, baseIntensity + randomFlash);

      return true;
    });

    // Create ambient bolts
    if (now >= nextAmbientTime.current) {
      // Randomly enter burst mode
      if (!burstModeRef.current && Math.random() < 0.2) {
        burstModeRef.current = true;
        burstEndTime.current = now + Math.random() * 500 + 300; // Burst for 300-800ms
      }

      // Create 1-3 bolts in burst mode, 1 bolt otherwise
      const numBolts = burstModeRef.current ? Math.floor(Math.random() * 3) + 1 : 1;

      for (let i = 0; i < numBolts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const heightVariation = Math.random() * 3 - 1.5; // Vary start height by ±1.5 units
        const start = new Vector3(x, 15 + heightVariation, z);
        const end = new Vector3(x, 0, z);

        // Shorter duration and store creation time
        const duration = Math.random() * 30 + 45; // 45-75ms duration
        const baseIntensity = burstModeRef.current ?
          Math.random() * 0.5 + 1.5 : // 1.5-2.0 in burst mode
          Math.random() * 0.3 + 1.0;  // 1.0-1.3 normally

        boltsRef.current.push({
          id: nextBoltId.current++,
          start,
          end,
          isAmbient: true,
          createTime: now,
          expireTime: now + duration,
          baseIntensity,
          currentIntensity: baseIntensity,
          width: burstModeRef.current ?
            Math.random() * 2 + 4 : // 4-6 in burst mode
            Math.random() * 1 + 3   // 3-4 normally
        });

        // Create branches with even shorter duration
        if (Math.random() < 0.4) {
          const numBranches = Math.floor(Math.random() * 2) + 1;
          for (let j = 0; j < numBranches; j++) {
            const branchStart = start.clone().lerp(end, Math.random() * 0.6 + 0.2);
            const branchEnd = branchStart.clone().add(
              new Vector3(
                (Math.random() - 0.5) * 2,
                -Math.random() * 2 - 1,
                (Math.random() - 0.5) * 2
              )
            );

            boltsRef.current.push({
              id: nextBoltId.current++,
              start: branchStart,
              end: branchEnd,
              isAmbient: true,
              createTime: now,
              expireTime: now + duration * 0.7, // Branches disappear faster
              baseIntensity: baseIntensity * 0.7,
              currentIntensity: baseIntensity * 0.7,
              width: 0.6
            });
          }
        }
      }

      // Shorter intervals between bolts
      nextAmbientTime.current = now + (burstModeRef.current ?
        Math.random() * 30 + 30 : // 30-60ms in burst mode
        Math.random() * 150 + 150 // 150-300ms normally
      );
      needsUpdate = true;
    }

    // Enemy strike logic
    if (now >= nextStrikeTime.current) {
      const creeps = useGameStore.getState().creeps;
      const damageCreep = useGameStore.getState().damageCreep;

      // Find creeps in range
      const creepsInRange = creeps.filter(creep => {
        if (!creep || !creep.position || creep.isDead) return false;
        const creepPos = new Vector3(creep.position[0], creep.position[1], creep.position[2]);
        const distance = creepPos.distanceTo(position);
        return distance <= radius;
      });

      if (creepsInRange.length > 0) {
        // Pick a random creep to strike
        const targetCreep = creepsInRange[Math.floor(Math.random() * creepsInRange.length)];
        const targetPos = new Vector3(targetCreep.position[0], targetCreep.position[1], targetCreep.position[2]);
        const localTargetPos = targetPos.clone().sub(position);

        // Create main strike
        const start = new Vector3(localTargetPos.x, 15, localTargetPos.z);
        const strikeIntensity = 2.0;
        boltsRef.current.push({
          id: nextBoltId.current++,
          start,
          end: localTargetPos,
          isAmbient: false,
          createTime: now,
          expireTime: now + 100, // Shorter duration for enemy strikes
          baseIntensity: strikeIntensity,
          currentIntensity: strikeIntensity,
          width: 1
        });

        // Visual effects with varying timing
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const offset = new Vector3(
              (Math.random() - 0.5) * 2,
              0,
              (Math.random() - 0.5) * 2
            );
            const effectPos = localTargetPos.clone().add(offset);
            const effectStart = new Vector3(effectPos.x, 15, effectPos.z);

            boltsRef.current.push({
              id: nextBoltId.current++,
              start: effectStart,
              end: effectPos,
              isAmbient: false,
              createTime: now + i * 25,
              expireTime: now + 100 + i * 25,
              baseIntensity: strikeIntensity * 0.8,
              currentIntensity: strikeIntensity * 0.8,
              width: 0.8
            });
          }, i * 25);
        }

        // Apply damage
        damageCreep(targetCreep.id, damage);

        // Schedule next strike
        nextStrikeTime.current = now + strikeInterval;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      forceUpdate({});
    }
  });

  return (
    <group position={position}>
      <StormCloud color={color} position={[0, 18, 0]} seed={seed} />
      <RangeIndicator radius={radius} color={color} />

      {boltsRef.current.map(bolt => (
        <LightningBolt
          key={bolt.id}
          startPos={bolt.start}
          endPos={bolt.end}
          color={bolt.isAmbient ? "#60a0ff" : "#ffffff"}
          isAmbient={bolt.isAmbient}
          intensity={bolt.currentIntensity}
          width={bolt.width}
        />
      ))}

      {boltsRef.current.length > 0 && (
        <pointLight
          position={[0, 12, 0]}
          color="#4080ff"
          intensity={burstModeRef.current ? 1.5 : 0.8}
          distance={radius * 2}
          decay={2}
          castShadow={false}
        />
      )}
    </group>
  );
});

export default MemoizedStorm;
