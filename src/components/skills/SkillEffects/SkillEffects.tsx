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
        } else if (effect.type === 'arcaneNova') {
          const age = (Date.now() - effect.startTime) / 1000;
          const progress = Math.min(age / effect.duration, 1);
          const opacity = Math.max(0, 1 - (progress - 0.5) * 2);
          const scale = Math.min(progress * 2, 1) * effect.radius;

          // Apply damage during expansion phase
          if (progress < 0.5) {
            creeps.forEach(creep => {
              if (!creep.isDead) {
                const creepPos = new Vector3(...creep.position);
                const distance = effect.position.distanceTo(creepPos);
                if (distance < scale) {
                  damageCreep(creep.id, effect.damage);
                }
              }
            });
          }

          return (
            <group key={`${effect.id}-${frameCount}`}>
              <mesh
                position={[effect.position.x, effect.position.y + 0.1, effect.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[20, 20]} />
                <arcaneNovaShaderMaterial
                  key={effect.id}
                  time={time.current}
                  progress={age / effect.duration}
                  color={new THREE.Color(0.3, 0.8, 1.0)}
                  color2={new THREE.Color(0.6, 0.9, 1.0)}
                  scale={1.0}
                  opacity={1.0}
                  transparent
                  depthWrite={false}
                  depthTest={true}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <pointLight
                position={[effect.position.x, effect.position.y + 1, effect.position.z]}
                color="#8B5CF6"
                intensity={5 * opacity}
                distance={scale * 2}
                decay={2}
              />
            </group>
          );
        } else if (effect.type === 'lightning') {
          const startPos = new Vector3(effect.position.x, 15, effect.position.z);
          const endPos = effect.position.clone();
          const isAmbient = (effect as any).isAmbient;

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
            <group key={`${effect.id}-${frameCount}`} renderOrder={1000}>
              {/* Main bolt */}
              <mesh
                position={startPos.clone().add(endPos).multiplyScalar(0.5)}
                quaternion={quaternion}
              >
                <cylinderGeometry args={[0.2, 0.2, length, 8]} />
                <meshBasicMaterial
                  color={isAmbient ? "#4080ff" : "#ffffff"}
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
                  color={isAmbient ? "#4080ff" : "#ffffff"}
                  toneMapped={false}
                  transparent={false}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>

              {/* Bright point lights */}
              <pointLight
                position={endPos}
                color={isAmbient ? "#4080ff" : "#ffffff"}
                intensity={10}
                distance={5}
              />
              <pointLight
                position={startPos}
                color={isAmbient ? "#4080ff" : "#ffffff"}
                intensity={10}
                distance={5}
              />
            </group>
          );
        } else if (effect.type === 'lightningStorm') {
          return (
            <MemoizedStorm
              key={effect.id}
              position={effect.position}
              radius={effect.radius}
              level={1}
              color={effect.color}
              seed={(effect as any).seed}
              damage={effect.damage}
              duration={effect.duration}
              strikeInterval={(effect as any).strikeInterval || 500}
            />
          );
        }
        return null;
      })}
    </group>
  );
}
