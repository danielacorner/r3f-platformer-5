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
      }
    });
    return clone;
  }, [scene]);

  return (
    <group ref={group}>
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/low_poly_crab/scene.gltf");
