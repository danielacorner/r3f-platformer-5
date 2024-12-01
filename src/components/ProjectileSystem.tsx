import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Matrix4, Object3D, MathUtils } from 'three';

interface ProjectileSystemProps {
  projectiles: Array<{
    id: number;
    startPos: Vector3;
    targetPos: Vector3;
    progress: number;
  }>;
  emissiveColor: string;
  geometry: JSX.Element;
  material: JSX.Element;
}

export function ProjectileSystem({ projectiles, emissiveColor, geometry, material }: ProjectileSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { clock } = useThree();
  const tempObject = useRef(new Object3D());
  const tempMatrix = useRef(new Matrix4());
  const startTimes = useRef<{ [key: number]: number }>({});

  // Update instance matrices every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();

    projectiles.forEach((proj, i) => {
      // Initialize start time for new projectiles
      if (!startTimes.current[proj.id]) {
        startTimes.current[proj.id] = time;
      }
      const projTime = time - startTimes.current[proj.id];

      // Enhanced arc motion
      const arcHeight = 0.5;
      const arcOffset = Math.sin(proj.progress * Math.PI) * arcHeight;
      const wobble = Math.sin(projTime * 10) * 0.05 * (1 - proj.progress);
      
      // Calculate position with enhanced arc and wobble
      const basePos = new Vector3().lerpVectors(proj.startPos, proj.targetPos, proj.progress);
      basePos.y += arcOffset + wobble;

      // Dynamic scaling based on progress
      const scaleBase = 1 + Math.sin(projTime * 8) * 0.1;
      const scalePulse = 1 + Math.sin(projTime * 15) * 0.05;
      const scaleProgress = 1 - Math.pow(proj.progress, 2) * 0.3; // Shrink slightly as it moves
      const scale = scaleBase * scalePulse * scaleProgress;

      // Enhanced rotation with multiple axes
      const rotationSpeed = 3;
      const rotX = projTime * rotationSpeed + Math.sin(projTime * 2) * 0.5;
      const rotY = projTime * rotationSpeed * 1.3 + Math.cos(projTime * 2) * 0.5;
      const rotZ = projTime * rotationSpeed * 0.7 + Math.sin(projTime * 3) * 0.3;

      // Apply all transformations
      tempObject.current.position.copy(basePos);
      tempObject.current.rotation.set(rotX, rotY, rotZ);
      tempObject.current.scale.setScalar(scale);
      
      // Add slight tilt in movement direction
      const direction = new Vector3().subVectors(proj.targetPos, proj.startPos).normalize();
      const tiltAmount = 0.3;
      tempObject.current.rotateOnAxis(direction.cross(new Vector3(0, 1, 0)).normalize(), tiltAmount);

      tempObject.current.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.current.matrix);
    });

    // Clean up old projectiles
    const oldIds = Object.keys(startTimes.current).map(Number);
    const currentIds = projectiles.map(p => p.id);
    oldIds.forEach(id => {
      if (!currentIds.includes(id)) {
        delete startTimes.current[id];
      }
    });

    // Hide unused instances
    for (let i = projectiles.length; i < meshRef.current.count; i++) {
      tempMatrix.current.makeScale(0, 0, 0);
      meshRef.current.setMatrixAt(i, tempMatrix.current);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[null, null, Math.max(100, projectiles.length)]} 
      castShadow
    >
      {geometry}
      {material}
    </instancedMesh>
  );
}
