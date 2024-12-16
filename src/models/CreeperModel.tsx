import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, useMemo } from "react";
import { Group } from "three";
import * as THREE from "three";

export function CreeperModel({ scale = 1 }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/minecraft_creeper/scene.gltf");
  const { actions, names } = useAnimations(animations, group);
  
  useEffect(() => {
    // Start the walk animation
    const walkAction = actions?.['walk'] || actions?.['Walk'] || actions?.['0'];
    if (walkAction) {
      walkAction.reset().fadeIn(0.5).play();
      walkAction.timeScale = 1.5;
      walkAction.setEffectiveTimeScale(1.5);
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    return () => {
      // Cleanup animations
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [actions]);

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
      <primitive 
        object={clonedScene} 
        scale={[scale, scale, scale]}
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/minecraft_creeper/scene.gltf");
