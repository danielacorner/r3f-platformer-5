import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Group } from "three";
import * as THREE from "three";

export function GoblinModel({ scale = 1 }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("./src/models/goblin_animated/scene.gltf");
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    // Start the first animation if available
    const firstAnimation = Object.values(actions)[0];
    if (firstAnimation) {
      firstAnimation.reset().play();
    }

    // Clone the scene to avoid sharing materials
    const clonedScene = scene.clone(true);
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Ensure materials are properly configured
        if (child.material) {
          // Clone the material to avoid sharing
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.transparent = true;
          child.material.needsUpdate = true;
        }
      }
    });

    // Replace the original scene in the group
    if (group.current) {
      group.current.clear();
      group.current.add(clonedScene);
    }
  }, [scene, actions]);

  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        scale={[scale, scale, scale]}
        position={[0, -0.5, 0]} // Adjust position to ground level
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("./src/models/goblin_animated/scene.gltf");
