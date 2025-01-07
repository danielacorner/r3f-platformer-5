import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Matrix4, Object3D, BufferGeometry } from 'three';
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
import { StormCloud } from '../StormCloud';
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

  // Memoized materials for lightning
  const lightningMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#80ffff',
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const lightningCoreMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

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
        if (effect.type === 'lightning') {
          const age = (Date.now() - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - progress * 2);

          return (
            <group key={`${effect.id}-${frameCount}`}>
              {/* Outer glow */}
              <mesh
                position={[effect.position.x, effect.position.y + 4, effect.position.z]}
              >
                <cylinderGeometry args={[0.8, 0.8, 8, 16]} />
                <primitive object={lightningMaterial} opacity={opacity * 0.5} />
              </mesh>

              {/* Core bolt */}
              <mesh
                position={[effect.position.x, effect.position.y + 4, effect.position.z]}
              >
                <cylinderGeometry args={[0.4, 0.4, 8, 16]} />
                <primitive object={lightningCoreMaterial} opacity={opacity} />
              </mesh>

              {/* Impact flash */}
              <mesh
                position={[effect.position.x, effect.position.y, effect.position.z]}
              >
                <sphereGeometry args={[2, 32, 32]} />
                <primitive object={lightningMaterial} opacity={opacity * 0.7} />
              </mesh>

              {/* Impact lights */}
              <pointLight
                position={[effect.position.x, effect.position.y + 4, effect.position.z]}
                color="#80ffff"
                intensity={50}
                distance={15}
                decay={2}
              />
              <pointLight
                position={[effect.position.x, effect.position.y, effect.position.z]}
                color="#ffffff"
                intensity={30}
                distance={10}
                decay={2}
              />
            </group>
          );
        } else if (effect.type === 'lightningStorm') {
          const pos = effect.position.toArray();
          return (
            <group key={`${effect.id}-${frameCount}`} position={pos}>
              {/* Storm cloud */}
              <group position={[0, 8, 0]}>
                <StormCloud color={effect.color} seed={(effect as any).seed} />
              </group>

              {/* Range indicator */}
              <line scale={[effect.radius, 1, effect.radius]}>
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
                  color={effect.color}
                  scale={2}
                  dashSize={5}
                  gapSize={3}
                  opacity={0.5}
                  transparent
                  fog={false}
                />
              </line>

              {/* Cloud light */}
              <pointLight
                color={effect.color}
                intensity={2}
                distance={effect.radius * 2}
                decay={2}
                position={[0, 8, 0]}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}
