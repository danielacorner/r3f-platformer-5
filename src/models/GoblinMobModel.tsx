import { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";
import { useRef } from "react";
import * as THREE from "three";

export function GoblinMobModel({ scale = 1 }) {
  const { scene, animations } = useGLTF("/models/goblin-mob/goblin.gltf");
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Log available animations for debugging
    console.log("Available GoblinMob animations:", Object.keys(actions));

    // Try to find the walking animation by common names
    const walkAnimation =
      actions["animation.goblin.walk"] ||
      actions["Walking"] ||
      actions["WALK"] ||
      actions["goblin_walk"];

    if (walkAnimation) {
      walkAnimation.reset().play();
      walkAnimation.setEffectiveTimeScale(1);
      walkAnimation.setEffectiveWeight(1);
      // Make the animation loop
      walkAnimation.loop = THREE.LoopRepeat;
    } else {
      console.warn("No walking animation found for GoblinMob");
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

// Preload the model
useGLTF.preload("/models/goblin-mob/goblin.gltf");
