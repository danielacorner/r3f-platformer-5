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

const LightningBolt = ({ startPos, endPos, color, isAmbient }: { startPos: Vector3, endPos: Vector3, color: string, isAmbient: boolean }) => {
  // Calculate direction and length for bolt
  const direction = endPos.clone().sub(startPos);
  const length = direction.length();

  // Create zigzag points for the bolt
  const segments = 12;
  const points = useMemo(() => {
    const pts = [];
    const maxOffset = isAmbient ? 0.3 : 0.5;
    const segmentLength = length / segments;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const basePoint = startPos.clone().lerp(endPos, t);

      if (i > 0 && i < segments) {
        const perpX = new Vector3(1, 0, 0).cross(direction.clone().normalize());
        const perpZ = new Vector3(0, 0, 1).cross(direction.clone().normalize());
        basePoint.add(
          perpX.multiplyScalar((Math.random() - 0.5) * maxOffset)
            .add(perpZ.multiplyScalar((Math.random() - 0.5) * maxOffset))
        );
      }
      pts.push(basePoint);
    }
    return pts;
  }, [startPos, endPos, length, isAmbient]);

  // Create line geometry from points
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [points]);

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
        -Math.random() - 0.2, // Point downward
        (Math.random() - 0.5) * 2
      ).normalize();

      const branchLength = length * (Math.random() * 0.2 + 0.1);
      const end = start.clone().add(branchDir.multiplyScalar(branchLength));

      // Create zigzag points for branch
      const branchPoints = [];
      const branchSegments = 6;
      for (let j = 0; j <= branchSegments; j++) {
        const t = j / branchSegments;
        const basePoint = start.clone().lerp(end, t);

        if (j > 0 && j < branchSegments) {
          const perpX = new Vector3(1, 0, 0).cross(branchDir);
          const perpZ = new Vector3(0, 0, 1).cross(branchDir);
          basePoint.add(
            perpX.multiplyScalar((Math.random() - 0.5) * 0.2)
              .add(perpZ.multiplyScalar((Math.random() - 0.5) * 0.2))
          );
        }
        branchPoints.push(basePoint);
      }

      const branchGeometry = new THREE.BufferGeometry();
      const branchPositions = new Float32Array(branchPoints.length * 3);
      branchPoints.forEach((point, j) => {
        branchPositions[j * 3] = point.x;
        branchPositions[j * 3 + 1] = point.y;
        branchPositions[j * 3 + 2] = point.z;
      });
      branchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(branchPositions, 3));

      branchPoints.push({ geometry: branchGeometry });
    }
    return branchPoints;
  }, [points, isAmbient, length, segments]);

  return (
    <group renderOrder={1000}>
      {/* Main bolt */}
      <group>
        {/* Core bright line */}
        <line>
          <primitive object={lineGeometry} />
          <lineBasicMaterial
            color={color}
            linewidth={3}
            toneMapped={false}
          />
        </line>
        {/* Glow line */}
        <line>
          <primitive object={lineGeometry} />
          <lineBasicMaterial
            color={color}
            linewidth={isAmbient ? 6 : 8}
            toneMapped={false}
            transparent={true}
            opacity={0.3}
          />
        </line>
      </group>

      {/* Branch bolts */}
      {branches.map((branch, i) => (
        <group key={`branch-${i}`}>
          {/* Core bright line */}
          <line>
            <primitive object={branch.geometry} />
            <lineBasicMaterial
              color={color}
              linewidth={2}
              toneMapped={false}
            />
          </line>
          {/* Glow line */}
          <line>
            <primitive object={branch.geometry} />
            <lineBasicMaterial
              color={color}
              linewidth={4}
              toneMapped={false}
              transparent={true}
              opacity={0.3}
            />
          </line>
        </group>
      ))}

      {/* Impact flash */}
      <pointLight
        position={endPos}
        color={color}
        intensity={isAmbient ? 10 : 20}
        distance={isAmbient ? 5 : 8}
      />
      <pointLight
        position={startPos}
        color={color}
        intensity={isAmbient ? 5 : 10}
        distance={isAmbient ? 3 : 5}
      />
    </group>
  );
};

export const MemoizedStorm = memo(function LightningStorm({ position, radius, level, color, seed, damage, duration, strikeInterval }: LightningStormProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>();
  const lightRef = useRef<THREE.PointLight>();
  const [bolts, setBolts] = useState<Array<{ id: number, start: Vector3, end: Vector3, isAmbient: boolean }>>([]);
  const nextBoltId = useRef(0);
  const nextStrikeTime = useRef(Date.now());

  // Create range indicator
  const segments = 64;
  const rangeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        0.1,
        Math.sin(theta) * radius
      );
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [radius]);

  // Create ambient bolts
  useEffect(() => {
    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const start = new Vector3(x, 15, z);
      const end = new Vector3(x, 0, z);

      setBolts(prev => [...prev, { id: nextBoltId.current++, start, end, isAmbient: true }]);

      // Remove bolt after 100ms
      setTimeout(() => {
        setBolts(prev => prev.filter(bolt => bolt.id !== nextBoltId.current - 1));
      }, 100);
    }, 100);

    return () => clearInterval(interval);
  }, [radius]);

  // Strike enemies
  useFrame(() => {
    const now = Date.now();
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
        setBolts(prev => [...prev, { id: nextBoltId.current++, start, end: localTargetPos, isAmbient: false }]);

        // Create visual effects around the strike
        for (let i = 0; i < 3; i++) {
          const offset = new Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
          );
          const effectPos = localTargetPos.clone().add(offset);
          const effectStart = new Vector3(effectPos.x, 15, effectPos.z);

          setTimeout(() => {
            setBolts(prev => [...prev, { id: nextBoltId.current++, start: effectStart, end: effectPos, isAmbient: false }]);
          }, i * 50);
        }

        // Apply damage
        damageCreep(targetCreep.id, damage);

        // Schedule next strike
        nextStrikeTime.current = now + strikeInterval;

        // Remove strike effects after 200ms
        setTimeout(() => {
          setBolts(prev => prev.filter(bolt => bolt.isAmbient));
        }, 200);
      }
    }
  });

  return (
    <group position={position}>
      {/* Storm cloud */}
      <StormCloud color={color} position={[0, 8, 0]} seed={seed} />

      {/* Electric effect overlay */}
      {/* <mesh>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <lightningStormShaderMaterial
          ref={shaderRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh> */}

      {/* Range indicator */}
      <line scale={radius}>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            array={new Float32Array(
              Array.from({ length: 65 }, (_, i) => {
                const theta = (i / 64) * Math.PI * 2;
                return [Math.cos(theta), 0.1, Math.sin(theta)];
              }).flat()
            )}
            count={65}
            itemSize={3}
          />
        </bufferGeometry>
        <lineDashedMaterial
          color={color}
          scale={2}
          dashSize={5}
          gapSize={3}
          opacity={0.5}
          transparent
          fog={false}
        />
      </line>

      {/* Ambient light */}
      <pointLight
        ref={lightRef}
        position={[0, 15, 0]}
        color={color}
        intensity={5}
        distance={radius * 2}
      />

      {/* Lightning bolts */}
      {bolts.map(bolt => (
        <LightningBolt
          key={bolt.id}
          startPos={bolt.start}
          endPos={bolt.end}
          color={bolt.isAmbient ? "#4080ff" : "#ffffff"}
          isAmbient={bolt.isAmbient}
        />
      ))}
    </group>
  );
});

export default MemoizedStorm;
