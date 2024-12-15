import { memo } from "react";
import { useGameStore } from "../store/gameStore";
import { useSpring, animated } from '@react-spring/three';
import {
    Cloud,
  } from '@react-three/drei';
import { useFrame } from "@react-three/fiber";

export const FollowingCloud = memo(function () {
    const { playerRef } = useGameStore();
    const [spring, api] = useSpring(() => ({
      position: [0, 15, 0],
      config: {
        mass: 1,
        tension: 120,
        friction: 300
      }
    }));
  
    useFrame(() => {
      if (!playerRef?.current) return;
      const playerPos = playerRef.current.translation();
      api.start({
        position: [playerPos.x, 15, playerPos.z],
      });
    });
  
    return (
      <animated.group position={spring.position}>
        <MyCloud />
      </animated.group>
    );
  })
  
  const MyCloud = memo(function () {
    return (
      <Cloud
        opacity={0.005}
        speed={0.2}
        width={10}
        depth={1.5}
        segments={28}
      />
    );
  })