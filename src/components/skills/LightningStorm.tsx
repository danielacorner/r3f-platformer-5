import { useRef, memo, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { StormCloud } from './StormCloud';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { HitSparks } from '../effects/HitSparks';

interface HitEffect {
  position: Vector3;
  key: string;
}

interface LightningBolt {
  id: number;
  points: Vector3[];
  createTime: number;
  expireTime: number;
  intensity: number;
  isAmbient: boolean;
  width: number;
}

const MAX_BOLTS = 32;
const SEGMENTS = 12; // Increased segments for more jagged appearance

export default function LightningStorm({ position, radius, damage, strikeInterval, seed }: {
  position: Vector3;
  radius: number;
  damage: number;
  strikeInterval: number;
  seed: number;
}) {
  const activeBolts = useRef<LightningBolt[]>([]);
  const nextBoltId = useRef(0);
  const nextStrikeTime = useRef(0);
  const nextAmbientTime = useRef(0);
  const burstModeRef = useRef(false);
  const burstEndTime = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const ambientLinesRef = useRef<THREE.LineSegments>(null);
  const strikeLinesRef = useRef<THREE.LineSegments>(null);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);

  // Create materials
  const materials = useMemo(() => {
    const ambientCore = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.4, 0.8, 1.0), // Brighter blue
      transparent: true,
      opacity: 0.2, // More visible
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });

    const ambientGlow = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.4, 0.7, 1.0), // Brighter blue glow
      transparent: true,
      opacity: 0.4, // Stronger glow
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });

    const strikeCore = new THREE.LineBasicMaterial({
      color: new THREE.Color(1.0, 0.3, 0.1), // Brighter red
      transparent: true,
      opacity: 1.0, // Fully opaque
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });

    const strikeGlow = new THREE.LineBasicMaterial({
      color: new THREE.Color(1.0, 0.5, 0.0), // Brighter orange glow
      transparent: true,
      opacity: 0.8, // Stronger glow
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });

    return { ambientCore, ambientGlow, strikeCore, strikeGlow };
  }, []);

  // Create zigzag points for a bolt
  const createBoltPoints = (start: Vector3, end: Vector3, isAmbient: boolean) => {
    const points = [];
    const direction = end.clone().sub(start);
    const segmentLength = direction.length() / SEGMENTS;
    const right = new THREE.Vector3(1, 0, 0);
    const forward = new THREE.Vector3(0, 0, 1);

    // More extreme zigzag
    const offsetMultiplier = isAmbient ? 0.5 : 1.0; // Increased zigzag for both types
    const branchChance = isAmbient ? 0.15 : 0.4; // More branches
    const subSegments = isAmbient ? 1 : 2; // Add sub-zigzags for strike bolts

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const basePoint = start.clone().lerp(end, t);

      if (i > 0 && i < SEGMENTS) {
        // Main zigzag
        const offset = right.clone()
          .multiplyScalar((Math.random() - 0.5) * segmentLength * offsetMultiplier)
          .add(forward.clone().multiplyScalar((Math.random() - 0.5) * segmentLength * offsetMultiplier));
        basePoint.add(offset);

        // Add sub-zigzags for more detail
        for (let j = 0; j < subSegments; j++) {
          const subOffset = right.clone()
            .multiplyScalar((Math.random() - 0.5) * segmentLength * 0.3)
            .add(forward.clone().multiplyScalar((Math.random() - 0.5) * segmentLength * 0.3));
          points.push(basePoint.clone().add(subOffset));
        }

        // Add branches with sub-branches for strike bolts
        if (!isAmbient && Math.random() < branchChance) {
          const branchEnd = basePoint.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * segmentLength * 1.5,
              -Math.random() * segmentLength,
              (Math.random() - 0.5) * segmentLength * 1.5
            )
          );

          // Add sub-branches
          const midPoint = basePoint.clone().lerp(branchEnd, 0.5);
          const subBranch = midPoint.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * segmentLength * 0.5,
              -Math.random() * segmentLength * 0.3,
              (Math.random() - 0.5) * segmentLength * 0.5
            )
          );

          points.push(basePoint.clone(), midPoint, subBranch, midPoint, branchEnd);
        }
      }

      points.push(basePoint);
    }

    return points;
  };

  // Update frame
  useFrame((state, delta) => {
    const now = Date.now();

    // Update existing bolts
    activeBolts.current = activeBolts.current.filter(bolt => {
      return now < bolt.expireTime;
    });

    // Create ambient bolts
    if (now >= nextAmbientTime.current) {
      if (!burstModeRef.current && Math.random() < 0.3) {
        burstModeRef.current = true;
        burstEndTime.current = now + Math.random() * 200 + 200;
      }
      if (burstModeRef.current && now > burstEndTime.current) {
        burstModeRef.current = false;
        nextAmbientTime.current = now + Math.random() * 300 + 200;
      }

      const numBolts = burstModeRef.current ? Math.floor(Math.random() * 2) + 2 : 1;

      for (let i = 0; i < numBolts; i++) {
        if (activeBolts.current.length >= MAX_BOLTS - 1) break;

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.6;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const start = new Vector3(x, 18, z);
        const end = new Vector3(x, 0, z);
        const points = createBoltPoints(start, end, true);

        activeBolts.current.push({
          id: nextBoltId.current++,
          points,
          createTime: now,
          expireTime: now + Math.random() * 50 + 50,
          intensity: burstModeRef.current ? 1.5 : 1.0,
          isAmbient: true,
          width: burstModeRef.current ? 0.15 : 0.1
        });
      }

      nextAmbientTime.current = now + (burstModeRef.current ?
        Math.random() * 50 + 50 :
        Math.random() * 100 + 100
      );
    }

    // Handle enemy strikes
    if (now >= nextStrikeTime.current) {
      const creeps = useGameStore.getState().creeps;
      const damageCreep = useGameStore.getState().damageCreep;

      const creepsInRange = creeps.filter(creep => {
        if (!creep || !creep.position || creep.isDead) return false;
        const creepPos = new Vector3(creep.position[0], creep.position[1], creep.position[2]);
        return creepPos.distanceTo(position) <= radius;
      });

      if (creepsInRange.length > 0) {
        const targetCreep = creepsInRange[Math.floor(Math.random() * creepsInRange.length)];
        const targetPos = new Vector3(targetCreep.position[0], targetCreep.position[1], targetCreep.position[2]);
        const localTargetPos = targetPos.clone().sub(position);

        const start = new Vector3(localTargetPos.x, 18, localTargetPos.z);
        const points = createBoltPoints(start, localTargetPos, false);

        activeBolts.current.push({
          id: nextBoltId.current++,
          points,
          createTime: now,
          expireTime: now + 150,
          intensity: 2.0,
          isAmbient: false,
          width: 0.2
        });

        // Create spark explosion at hit position
        const hitKey = `${now}-${nextBoltId.current}`;
        setHitEffects(prev => [...prev, { position: localTargetPos, key: hitKey }]);

        damageCreep(targetCreep.id, damage);
        nextStrikeTime.current = now + strikeInterval;
      }
    }

    // Update line segments
    if (ambientLinesRef.current && strikeLinesRef.current && activeBolts.current.length > 0) {
      const ambientPositions: number[] = [];
      const strikePositions: number[] = [];

      // Create line segments from points
      activeBolts.current.forEach(bolt => {
        const life = (bolt.expireTime - now) / (bolt.expireTime - bolt.createTime);
        const intensity = life * bolt.intensity;
        const positions = bolt.isAmbient ? ambientPositions : strikePositions;

        // Add line segments
        for (let i = 0; i < bolt.points.length - 1; i++) {
          const start = bolt.points[i];
          const end = bolt.points[i + 1];
          positions.push(start.x, start.y, start.z);
          positions.push(end.x, end.y, end.z);
        }
      });

      // Update ambient geometry
      const ambientGeometry = ambientLinesRef.current.geometry;
      ambientGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ambientPositions, 3));
      ambientGeometry.attributes.position.needsUpdate = true;

      // Update strike geometry
      const strikeGeometry = strikeLinesRef.current.geometry;
      strikeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(strikePositions, 3));
      strikeGeometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <StormCloud position={[0, 18, 0]} seed={seed} />

      {/* Range indicator */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
        <ringGeometry args={[radius - 0.1, radius, 32]} />
        <meshBasicMaterial color="#4060ff" />
      </mesh>

      {/* Hit effects */}
      {hitEffects.map(effect => (
        <HitSparks
          key={effect.key}
          position={effect.position}
          onComplete={() => {
            setHitEffects(prev => prev.filter(e => e.key !== effect.key));
          }}
        />
      ))}

      {/* Ambient bolts */}
      <lineSegments ref={ambientLinesRef}>
        <bufferGeometry />
        <primitive object={materials.ambientCore} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry />
        <primitive object={materials.ambientGlow} />
      </lineSegments>

      {/* Strike bolts */}
      <lineSegments ref={strikeLinesRef}>
        <bufferGeometry />
        <primitive object={materials.strikeCore} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry />
        <primitive object={materials.strikeGlow} />
      </lineSegments>

      {/* Global storm light */}
      {activeBolts.current.length > 0 && (
        <pointLight
          position={[0, 12, 0]}
          color={burstModeRef.current ? "#3050ff" : "#4060ff"} // Adjusted to match new ambient color
          intensity={burstModeRef.current ? 1.5 : 0.8}
          distance={radius * 2}
          decay={2}
          castShadow={false}
        />
      )}
    </group>
  );
}
