import { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";
import { useRef } from "react";
import * as THREE from "three";

export function AllayModel({ scale = 1 }) {
  const { scene, animations } = useGLTF("/models/minecraft_allay/scene.gltf");
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Log available animations for debugging
    console.log("Available Allay animations:", Object.keys(actions));

    // Try to find the flying/movement animation
    const flyAnimation = 
      actions["Fly"] || 
      actions["fly"] || 
      actions["FLY"] ||
      actions["Take 001"] || // Common default animation name
      Object.values(actions)[0]; // Fallback to first animation
    
    if (flyAnimation) {
      flyAnimation.reset().play();
      flyAnimation.setEffectiveTimeScale(1);
      flyAnimation.setEffectiveWeight(1);
      flyAnimation.loop = THREE.LoopRepeat;
    }
  }, [actions]);

  // Clone the scene to avoid sharing materials between instances
  const clonedScene = scene.clone(true);

  return (
    <group ref={group} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/models/minecraft_allay/scene.gltf");
