import { useRef, memo, useMemo, useEffect, useState } from 'react';
import { Vector3, Float32BufferAttribute } from 'three';
import { LightningStormShaderMaterial } from './SkillEffects/shaders/LightningStormShader';
import { extend, useFrame } from '@react-three/fiber';
import { StormCloud } from './StormCloud';
import * as THREE from 'three';

extend({ LightningStormShaderMaterial });

interface LightningStormProps {
  position: Vector3;
  radius: number;
  level: number;
  color: string;
  seed: number;
}

const LightningBolt = ({ startPos, endPos, color }: { startPos: Vector3, endPos: Vector3, color: string }) => {
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
        <sphereGeometry args={[0.8, 16, 16]} />
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
        intensity={10}
        distance={5}
      />
      <pointLight
        position={startPos}
        color={color}
        intensity={10}
        distance={5}
      />
    </group>
  );
};

export const MemoizedStorm = memo(function LightningStorm({ position, radius, level, color, seed }: LightningStormProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>();
  const lightRef = useRef<THREE.PointLight>();
  const [bolts, setBolts] = useState<Array<{ id: number, start: Vector3, end: Vector3 }>>([]);
  const nextBoltId = useRef(0);

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

      setBolts(prev => [...prev, { id: nextBoltId.current++, start, end }]);

      // Remove bolt after 100ms
      setTimeout(() => {
        setBolts(prev => prev.filter(bolt => bolt.id !== nextBoltId.current - 1));
      }, 100);
    }, 100);

    return () => clearInterval(interval);
  }, [radius]);

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
          color="#4080ff"
        />
      ))}
    </group>
  );
});

export default MemoizedStorm;
