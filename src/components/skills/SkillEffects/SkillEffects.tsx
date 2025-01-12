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
import { SkillEffect } from './types';
import MemoizedStorm from '../LightningStorm';
import { MissileHitEffects } from "./MissileHitEffects";

extend({ ArcaneNovaShaderMaterial, LightningStormShaderMaterial });

export let activeEffects: SkillEffect[] = [];

export function SkillEffects() {
  const { creeps, damageCreep } = useGameStore();
  const [effectsCount, setEffectsCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const time = useRef(0);

  // Trail particle setup
  const trailGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 6, 6), []); // Reduced geometry complexity
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#9F7AEA',
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  const missileGeometry = useMemo(() => new THREE.SphereGeometry(0.2, 8, 8), []); // Reduced geometry complexity
  const missileMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#6bb7c8',
    emissive: '#6bb7c8',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9,
  }), []);

  const trailInstancesRef = useRef<InstancedMesh>();
  const missileInstancesRef = useRef<InstancedMesh>();
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

    // Update shader materials
    const materials = state.scene.children
      .filter(child => child.material && child.material.type === 'ShaderMaterial')
      .map(child => child.material);

    materials.forEach(material => {
      if (material.uniforms) {
        material.uniforms.time.value = time.current;

        // Update progress for ArcaneNova effects
        if (material.type === 'ArcaneNovaShaderMaterial') {
          const effect = activeEffects.find(e => e.type === 'arcaneNova');
          if (effect) {
            const progress = (now - effect.startTime) / (effect.duration * 1000);
            material.uniforms.progress.value = progress;
          }
        }
      }
    });

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

    // Update trail instances
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

    // Update missile instances
    if (missileInstancesRef.current) {
      const missileEffects = activeEffects.filter(effect => effect.type === 'magicMissile');
      missileEffects.forEach((effect, index) => {
        dummy.position.copy(effect.position);
        const scale = effect.phase === 'seeking' ? 1.2 : 1.0;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        missileInstancesRef.current!.setMatrixAt(index, dummy.matrix);
      });
      missileInstancesRef.current.instanceMatrix.needsUpdate = true;
      missileInstancesRef.current.count = missileEffects.length;
    }
  });

  return (
    <group>
      {/* Trail particles */}
      <instancedMesh
        ref={trailInstancesRef}
        args={[trailGeometry, trailMaterial, Math.max(100, totalTrailParticles)]}
        frustumCulled={true}
      />

      {/* Magic Missiles */}
      <instancedMesh
        ref={missileInstancesRef}
        args={[missileGeometry, missileMaterial, 100]}
        frustumCulled={true}
      />

      {/* Missile hit effects */}
      <MissileHitEffects />
    </group>
  );
}
