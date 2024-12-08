import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function BeetleModel({ scale = 1, color = "#1f3d0c" }) {
  const groupRef = useRef<THREE.Group>();
  const legRotation = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Animate legs walking
      legRotation.current += delta * 8;
      const legAngle = Math.sin(legRotation.current) * 0.4;
      
      // Animate legs
      for (let i = 4; i < 10; i++) {
        const leg = groupRef.current.children[i];
        if (leg) {
          leg.rotation.x = i % 2 === 0 ? legAngle : -legAngle;
        }
      }
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Main body (elongated) */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.6, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.5, 0.4]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Shell pattern */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI/6, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.7, 16]} />
        <meshStandardMaterial 
          color={new THREE.Color(color).multiplyScalar(1.2)} 
          metalness={0.4} 
          roughness={0.6}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.15, 0.6, 0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.15, 0.6, 0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Legs */}
      {/* Right legs */}
      <group position={[0.3, 0.3, 0.3]} rotation={[0, 0, Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[0.3, 0.3, 0]} rotation={[0, 0, Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[0.3, 0.3, -0.3]} rotation={[0, 0, Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Left legs */}
      <group position={[-0.3, 0.3, 0.3]} rotation={[0, 0, -Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[-0.3, 0.3, 0]} rotation={[0, 0, -Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[-0.3, 0.3, -0.3]} rotation={[0, 0, -Math.PI/3]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Mandibles */}
      <group position={[0, 0.5, 0.6]}>
        <mesh position={[0.1, 0, 0]} rotation={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}
