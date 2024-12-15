import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D, Matrix4 } from 'three';
import { grassColor } from '../../../utils/constants';


// Optimized components using instancing
export function TreeInstances({ count = 15, radius = 25 }) {
    const trunkRef = useRef<InstancedMesh>(null);
    const foliageRef = useRef<InstancedMesh>(null);
    const tempObject = useMemo(() => new Object3D(), []);
    const matrix = useMemo(() => new Matrix4(), []);
  
    useEffect(() => {
      if (!trunkRef.current || !foliageRef.current) return;
  
      // Set positions for all instances
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.sin(angle) * radius + (Math.random() * 5);
        const z = Math.cos(angle) * radius + (Math.random() * 5);
        const scale = 0.8 + Math.random() * 0.4;
  
        // Position trunk slightly above ground and foliage above trunk
        tempObject.position.set(x, 1, z);  // Set trunk at y=1
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();
        trunkRef.current.setMatrixAt(i, tempObject.matrix);
  
        // Position foliage above trunk
        tempObject.position.set(x, 2.5, z);  // Set foliage at y=2.5
        tempObject.updateMatrix();
        foliageRef.current.setMatrixAt(i, tempObject.matrix);
      }
      trunkRef.current.instanceMatrix.needsUpdate = true;
      foliageRef.current.instanceMatrix.needsUpdate = true;
    }, [count, radius]);
  
    return (
      <group>
        {/* Trunk */}
        <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.2, 2]} />
          <meshStandardMaterial color="#3d2817" roughness={0.8} metalness={0.1} />
        </instancedMesh>
        {/* Foliage - using lower poly count */}
        <instancedMesh ref={foliageRef} args={[undefined, undefined, count]} castShadow receiveShadow>
          <coneGeometry args={[1.2, 2.5, 6]} />
          <meshStandardMaterial color={grassColor} roughness={0.8} metalness={0.1} />
        </instancedMesh>
      </group>
    );
  }