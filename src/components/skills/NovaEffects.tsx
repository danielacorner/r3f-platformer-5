import { useRef } from 'react';
import * as THREE from 'three';
import { Points } from '@react-three/drei';

export const NovaRing: React.FC = () => {
  return (
    <mesh>
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial 
        color="#8B5CF6" 
        transparent 
        opacity={1} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const NovaGlow: React.FC = () => {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        color="#C4B5FD"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export const NovaParticles: React.FC = () => {
  return (
    <Points>
      <pointsMaterial 
        size={0.2} 
        color="#A78BFA" 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
      {Array.from({ length: 30 }).map((_, i) => (
        <point 
          key={i} 
          position={[
            Math.cos(i / 30 * Math.PI * 2) * (0.9 + Math.random() * 0.2),
            Math.sin(i / 30 * Math.PI * 2) * (0.9 + Math.random() * 0.2),
            0
          ]} 
        />
      ))}
    </Points>
  );
};
