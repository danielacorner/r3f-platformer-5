import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Group } from "three";
import * as THREE from "three";

export function CreeperModel({ scale = 1 }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("models/minecraft_creeper/scene.gltf");
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    // Log available animations to help debug
    console.log('Available Creeper animations:', Object.keys(actions));

    // Find and play the walk animation
    const walkAnimation = Object.entries(actions).find(([name]) => 
      name.toLowerCase().includes('walk')
    )?.[1];

    if (walkAnimation) {
      walkAnimation.reset().play();
      walkAnimation.timeScale = 1.2; // Slightly faster walk
    } else {
      // Fallback to first animation if walk not found
      const firstAnimation = Object.values(actions)[0];
      if (firstAnimation) {
        firstAnimation.reset().play();
        firstAnimation.timeScale = 1.2;
      }
    }

    // Clone and configure the scene
    const clonedScene = scene.clone(true);
    
    clonedScene.traverse((child) => {
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
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("models/minecraft_creeper/scene.gltf");
