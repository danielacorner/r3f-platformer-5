import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D } from 'three';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ArcaneNovaShaderMaterial } from './shaders/ArcaneNovaShader';
import { LightningStormShaderMaterial } from './shaders/LightningStormShader';
import { updateMagicMissile } from './effectHandlers/magicMissileHandler';
import { updateArcaneNova } from './effectHandlers/arcaneNovaHandler';
import { updateLightning } from './effectHandlers/lightningHandler';
import { updateBoomerang } from './effectHandlers/boomerangHandler';
import { updateLightningStorm } from './effectHandlers/lightningStormHandler';
import { Cloud } from '@react-three/drei';
import { SkillEffect } from './types';

extend({ ArcaneNovaShaderMaterial, LightningStormShaderMaterial });

export let activeEffects: SkillEffect[] = [];

export function SkillEffects() {
  const { creeps, damageCreep } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const time = useRef(0);

  // Trail particle setup
  const trailGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), []);
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#9F7AEA',
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  const trailInstancesRef = useRef<InstancedMesh>();
  const trailsRef = useRef<Map<string, Vector3[]>>(new Map());
  const [totalTrailParticles, setTotalTrailParticles] = useState(100);
  const matrix = useMemo(() => new Matrix4(), []);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    const handleEffectsChanged = () => {
      setEffectsCount(activeEffects.length);
    };

    window.addEventListener('effectsChanged', handleEffectsChanged);
    return () => {
      window.removeEventListener('effectsChanged', handleEffectsChanged);
      activeEffects = [];
    };
  }, []);

  useFrame((state, delta) => {
    time.current += delta;
    setFrameCount(prev => (prev + 1) % 1000000);

    const now = Date.now();
    const { creeps, damageCreep } = useGameStore.getState();

    // Update effects
    activeEffects = activeEffects.filter(effect => {
      if (effect.type === 'magicMissile') {
        return updateMagicMissile(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'magicBoomerang') {
        return updateBoomerang(effect, delta, creeps, damageCreep, trailsRef, now);
      } else if (effect.type === 'arcaneNova') {
        return updateArcaneNova(effect, now, creeps, damageCreep);
      } else if (effect.type === 'lightning') {
        return updateLightning(effect, now, creeps, damageCreep);
      } else if (effect.type === 'lightningStorm') {
        return updateLightningStorm(effect as any, now, creeps, damageCreep);
      }
      return false;
    });

    // Update instanced mesh
    if (trailInstancesRef.current) {
      let instanceIndex = 0;
      for (const [_, trail] of trailsRef.current.entries()) {
        for (let i = 0; i < trail.length; i++) {
          const pos = trail[i];
          const scale = 1.5 * (1 - (i / trail.length));
          dummy.position.copy(pos);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          trailInstancesRef.current.setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex++;
        }
      }
      trailInstancesRef.current.instanceMatrix.needsUpdate = true;
      setTotalTrailParticles(Math.max(100, instanceIndex));
    }
  });

  return (
    <group>
      {/* Trail particles */}
      <instancedMesh
        ref={trailInstancesRef}
        args={[trailGeometry, trailMaterial, Math.max(100, totalTrailParticles)]}
      />

      {/* Render effects */}
      {activeEffects.map(effect => {
        if (effect.type === 'magicMissile') {
          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh position={effect.position.toArray()}>
                <sphereGeometry args={[effect.radius, 32, 32]} />
                <meshStandardMaterial
                  color={effect.color}
                  emissive={effect.color}
                  emissiveIntensity={2}
                />
              </mesh>
            </group>
          );
        } else if (effect.type === 'magicBoomerang') {
          const wobble = Math.sin(effect.age * 5) * 0.05;
          const rotation = [0, effect.age * 15, wobble];
          return (
            <group key={`${effect.id}-${frameCount}`}>
              <group scale={3} position={effect.position.toArray()} rotation={rotation}>
                <group rotation={[Math.PI / 2, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[0.1, 0.4, 0.05]} />
                    <meshStandardMaterial color="#8B4513" metalness={0.1} roughness={0.7} />
                  </mesh>
                  <mesh position={[0.4 / 2 - 0.1 / 2, 0.4 / 2 - 0.1 / 2, 0]}>
                    <boxGeometry args={[0.4, 0.1, 0.05]} />
                    <meshStandardMaterial color="#8B4513" metalness={0.1} roughness={0.7} />
                  </mesh>
                </group>
                <pointLight color="#87CEFA" intensity={1} distance={2} />
              </group>
            </group>
          );
        } else if (effect.type === 'lightningStorm') {
          const pos = effect.position.toArray();
          return (
            <group key={`${effect.id}-${frameCount}`} position={pos}>
              {/* Storm cloud */}
              <group position={[0, 8, 0]}>
                <Cloud
                  opacity={0.8}
                  speed={0.4}
                  width={10}
                  depth={2.5}
                  segments={20}
                >
                  <meshStandardMaterial 
                    color={effect.color} 
                    emissive={effect.color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.6}
                  />
                </Cloud>
              </group>

              {/* Electric effect */}
              <mesh position={[0, 8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[effect.radius * 2, effect.radius * 2]} />
                <lightningStormShaderMaterial
                  time={time.current}
                  color={new THREE.Color(effect.color)}
                  intensity={1.0}
                />
              </mesh>

              {/* Range indicator */}
              <line>
                <bufferGeometry>
                  <float32BufferAttribute
                    attach="attributes-position"
                    array={(() => {
                      const positions = [];
                      const segments = 64;
                      for (let i = 0; i <= segments; i++) {
                        const theta = (i / segments) * Math.PI * 2;
                        positions.push(
                          Math.cos(theta) * effect.radius,
                          0.1,
                          Math.sin(theta) * effect.radius
                        );
                      }
                      return new Float32Array(positions);
                    })()}
                    count={65}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineDashedMaterial
                  color={effect.color}
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
                color={effect.color}
                intensity={2}
                distance={effect.radius * 2}
                decay={2}
                position={[0, 8, 0]}
              />
            </group>
          );
        } else if (effect.type === 'lightning') {
          const age = (Date.now() - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - progress * 2);
          const scale = progress < 0.1 ? progress * 10 : 1;

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                scale={[0.2 * scale, 4 * scale, 0.2 * scale]}
              >
                <cylinderGeometry args={[1, 0, 1, 6]} />
                <meshBasicMaterial color={effect.color} transparent opacity={opacity} />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 2, effect.position.z]}
                color={effect.color}
                intensity={10 * opacity}
                distance={5}
                decay={2}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}
