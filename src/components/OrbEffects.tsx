import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Color, AdditiveBlending } from 'three'
import { Trail, MeshDistortMaterial } from '@react-three/drei'

interface OrbEffectsProps {
  isAttacking: boolean
}

export function OrbEffects({ isAttacking }: OrbEffectsProps) {
  const orbRef = useRef<any>()
  const distortRef = useRef<any>()

  const energyRingRefs = Array.from({ length: 3 }, () => useRef<any>());
  useFrame((state) => {
    if (distortRef.current) {
      // Update distortion during attack
      const speed = isAttacking ? 4 : 1;
      distortRef.current.distort = 0.3 + Math.sin(state.clock.elapsedTime * speed) * 0.1;
      distortRef.current.speed = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }

    // Animate energy rings
    if (orbRef.current) {
      orbRef.current.rotation.x += 0.01;
      orbRef.current.rotation.y += 0.015;
    }
    if (energyRingRefs.every(ref => ref.current)) {
      energyRingRefs.forEach((ref, i) => {
        ref.current.rotation.x += 0.01 * (i + 1) * (isAttacking ? 4 : 1);
        ref.current.rotation.y += 0.015 * (i + 1) * (isAttacking ? 4 : 1);
      })
    }
  });

  return (
    <group>
      {/* Main orb with distortion effect */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <MeshDistortMaterial
          ref={distortRef}
          color="#4a148c"
          emissive="#7e57c2"
          emissiveIntensity={5 * (isAttacking ? 1.5 : 1)}
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={isAttacking ? 22 : 0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner energy core */}
      <mesh scale={isAttacking ? 2.8 : 2.4}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={isAttacking ? ATTACK_COLOR : "#7e57c2"}
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Outer energy field */}
      <mesh scale={4.2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhongMaterial
          color={isAttacking ? ATTACK_COLOR : "#4a148c"}
          emissive={isAttacking ? ATTACK_COLOR : "#7e57c2"}
          emissiveIntensity={isAttacking ? 1.0 : 0.5}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Energy rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          scale={isAttacking ? 4.4 : 5.4}
          key={i}
          ref={energyRingRefs[i]}
          rotation={[
            Math.PI * 2 * i / 3,
            Math.PI / 4,
            Math.PI / 3
          ]}
        >
          <ringGeometry args={[0.2, 0.22, 32]} />
          <meshBasicMaterial
            color={isAttacking ? ATTACK_COLOR : RING_COLORS[i]}
            transparent
            opacity={isAttacking ? 0.3 : 0.05}
            blending={AdditiveBlending}
            side={2}
          />
        </mesh>
      ))}

      {/* Point lights for glow */}
      <pointLight
        intensity={isAttacking ? 1.5 : 0.8}
        distance={3}
        color="#7e57c2"
      />

      {/* Trail */}
      <Trail
        width={isAttacking ? 2.4 : 0.8}
        length={3.4}
        color={isAttacking ? ATTACK_COLOR : PASSIVE_COLOR}
        // attenuation={() => 0.5}
        // opacity={1}
        decay={isAttacking ? 4.8 : 0.2}
        local={false}
      >
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={isAttacking ? ATTACK_COLOR : PASSIVE_COLOR} transparent opacity={0} />
        </mesh>
      </Trail>
    </group>
  )
}
const ATTACK_COLOR = new Color("#1dd0fd")
const PASSIVE_COLOR = new Color("#b388ff")
const PASSIVE_COLOR_DARK = new Color("#7e57c2")

const RING_COLORS = [
  new Color("#59b4a8"),
  new Color("#73a4ee"),
  new Color("#af8d42")
]