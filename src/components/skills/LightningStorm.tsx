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
  // Calculate direction and length for cylinder
  const direction = endPos.clone().sub(startPos);
  const length = direction.length();

  // Calculate rotation to point cylinder in the right direction
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const axis = new THREE.Vector3();
  axis.crossVectors(up, direction.normalize()).normalize();
  const angle = Math.acos(up.dot(direction));
  quaternion.setFromAxisAngle(axis, angle);

  return (
    <group renderOrder={1000}>
      {/* Main bolt */}
      <mesh
        position={startPos.clone().add(endPos).multiplyScalar(0.5)}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[0.2, 0.2, length, 8]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          transparent={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Impact flash */}
      <mesh position={endPos}>
        <sphereGeometry args={[isAmbient ? 0.8 : 1.2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          transparent={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Bright point lights */}
      <pointLight
        position={endPos}
        color={color}
        intensity={isAmbient ? 10 : 20}
        distance={isAmbient ? 5 : 8}
      />
      <pointLight
        position={startPos}
        color={color}
        intensity={isAmbient ? 10 : 20}
        distance={isAmbient ? 5 : 8}
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
      <mesh>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <lightningStormShaderMaterial
          ref={shaderRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

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
