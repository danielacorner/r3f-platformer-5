import { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";
import { useRef } from "react";
import * as THREE from "three";

export function MushroomModel({ scale = 1 }) {
  const { scene, animations } = useGLTF("/models/mushroom_bup_minecraft_mob/scene.gltf");
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Log available animations for debugging
    console.log("Available Mushroom animations:", Object.keys(actions));

    // Try to find the walking animation
    const walkAnimation = 
      actions["Walk"] || 
      actions["walk"] || 
      actions["WALK"] ||
      actions["Take 001"] || // Common default animation name
      Object.values(actions)[0]; // Fallback to first animation
    
    if (walkAnimation) {
      walkAnimation.reset().play();
      walkAnimation.setEffectiveTimeScale(1);
      walkAnimation.setEffectiveWeight(1);
      walkAnimation.loop = THREE.LoopRepeat;
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

useGLTF.preload("/models/mushroom_bup_minecraft_mob/scene.gltf");
