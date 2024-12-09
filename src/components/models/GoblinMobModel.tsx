import { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { useRef } from "react";

export function GoblinMobModel({ scale = 1 }) {
  const { scene, animations } = useGLTF("/models/goblin-mob/goblin.gltf");
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);
  console.log({ actions }, Object.keys(actions), Object.values(actions)[1]);
  useEffect(() => {
    // Log available animations for debugging
    console.log("Available GoblinMob animations:", Object.keys(actions));

    // Play the default animation if available
    const defaultAnimation = Object.values(actions)[1];
    if (defaultAnimation) {
      defaultAnimation.reset().play();
      defaultAnimation.setEffectiveTimeScale(1);
      defaultAnimation.setEffectiveWeight(1);
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
