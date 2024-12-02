import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Color, AdditiveBlending, Group } from 'three'
import { Trail, MeshDistortMaterial } from '@react-three/drei'

interface OrbEffectsProps {
  isAttacking: boolean
}

export function OrbEffects({ isAttacking }: OrbEffectsProps) {
  const orbRef = useRef<any>()
  const distortRef = useRef<any>()
  const trailRef = useRef<Group>(null)
  const [trailVisible, setTrailVisible] = useState(true)

  // Reset trail visibility when attack state changes
  useEffect(() => {
    if (isAttacking) {
      // Briefly hide and show trail to reset it
      setTrailVisible(false)
      const timer = setTimeout(() => setTrailVisible(true), 50)
      return () => clearTimeout(timer)
    }
  }, [isAttacking])

  useFrame((state) => {
    if (!distortRef.current) return;

    // Update distortion during attack
    const speed = isAttacking ? 4 : 1;
    const distortStrength = isAttacking ? 0.6 : 0.3;
    distortRef.current.distort = 0.3 + Math.sin(state.clock.elapsedTime * speed) * 0.1;
    distortRef.current.speed = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
  });

  return (
    <>
      {/* Main orb with distortion effect */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <MeshDistortMaterial
          ref={distortRef}
          color="#4a148c"
          emissive="#7e57c2"
          emissiveIntensity={isAttacking ? 2 : 1}
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner energy core */}
      <mesh scale={0.8}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color="#7e57c2"
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Outer energy field */}
      <mesh scale={1.2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhongMaterial
          color="#4a148c"
          emissive="#7e57c2"
          emissiveIntensity={isAttacking ? 1.5 : 0.5}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Energy rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={i}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
        >
          <ringGeometry args={[0.2, 0.22, 32]} />
          <meshBasicMaterial
            color="#7e57c2"
            transparent
            opacity={0.3}
            blending={AdditiveBlending}
            side={2}
          />
        </mesh>
      ))}

      {/* Glowing trail */}
      {trailVisible && (
        <group ref={trailRef}>
          <Trail
            width={isAttacking ? 0.4 : 0.15}
            length={isAttacking ? 8 : 6}
            decay={isAttacking ? 0.5 : 0.1}
            local={false}
            stride={100}
            interval={1}
            color={new Color("#7e57c2")}
            attenuation={(t) => {
              // Sharper falloff during attack
              return isAttacking ? Math.pow(t, 2.5) : t * t;
            }}
            opacity={isAttacking ? 0.9 : 0.4}
          >
            <mesh visible={false}>
              <sphereGeometry args={[0.1]} />
            </mesh>
          </Trail>
        </group>
      )}

      {/* Point lights for glow */}
      <pointLight
        intensity={isAttacking ? 1.5 : 0.8}
        distance={3}
        color="#7e57c2"
      />
      <pointLight
        intensity={isAttacking ? 0.8 : 0.4}
        distance={5}
        color="#4a148c"
      />
    </>
  )
}
