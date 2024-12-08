import { useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";
import * as THREE from "three";

export function CrabModel({ scale = 1 }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/low_poly_crab/scene.gltf");
  const { actions } = useAnimations(animations, group);

  // Clone the scene once on mount
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Reset the clone's position to ensure it follows parent transformations
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.transparent = true;
          child.material.needsUpdate = true;
        }
        // Reset individual mesh transforms as well
        child.position.set(0, 0, 0);
        child.rotation.set(0, 0, 0);
        child.scale.set(1, 1, 1);
      }
    });
    return clone;
  }, [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/low_poly_crab/scene.gltf");
