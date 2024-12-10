import { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";
import { useRef } from "react";
import * as THREE from "three";

export function GuardianModel({ scale = 1 }) {
  const { scene, animations } = useGLTF("/models/minecraft_guardian/scene.gltf");
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Log available animations for debugging
    console.log("Available Guardian animations:", Object.keys(actions));

    // Try to find the swimming/floating animation
    const swimAnimation = 
      actions["Swim"] || 
      actions["swim"] || 
      actions["SWIM"] ||
      actions["Float"] ||
      actions["Take 001"] || // Common default animation name
      Object.values(actions)[0]; // Fallback to first animation
    
    if (swimAnimation) {
      swimAnimation.reset().play();
      swimAnimation.setEffectiveTimeScale(1);
      swimAnimation.setEffectiveWeight(1);
      swimAnimation.loop = THREE.LoopRepeat;
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

useGLTF.preload("/models/minecraft_guardian/scene.gltf");
