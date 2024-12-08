import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Group } from "three";
import * as THREE from "three";

export function CreeperModel({ scale = 1 }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/minecraft_creeper/scene.gltf");
  const { actions, names } = useAnimations(animations, group);
  
  useEffect(() => {
    // More detailed animation logging
    console.log('Animations array:', animations);
    console.log('Actions object:', actions);
    console.log('Animation names:', names);
    console.log('Available animations:', Object.keys(actions));

    // Try to access walk animation directly
    const walkAction = actions?.['walk'] || actions?.['Walk'] || actions?.['0'];
    console.log('Walk action:', walkAction);

    if (walkAction) {
      walkAction.reset().fadeIn(0.5).play();
      walkAction.timeScale = 1.5;
      walkAction.setEffectiveTimeScale(1.5);
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      console.log('Successfully started walk animation');
    } else {
      console.log('Could not find walk animation');
      // Try the first available animation
      const firstAnimation = Object.values(actions)[0];
      if (firstAnimation) {
        firstAnimation.reset().fadeIn(0.5).play();
        firstAnimation.timeScale = 1.5;
        firstAnimation.setEffectiveTimeScale(1.5);
        firstAnimation.setLoop(THREE.LoopRepeat, Infinity);
        console.log('Using first available animation:', Object.keys(actions)[0]);
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
      // Instead of clearing, let's just add if empty
      if (group.current.children.length === 0) {
        group.current.add(clonedScene);
      }
    }

    return () => {
      // Cleanup animations
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [scene, actions, animations, names]);

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
useGLTF.preload("/models/minecraft_creeper/scene.gltf");
