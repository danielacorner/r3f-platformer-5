import { Vector3 } from "three";

export interface PathConfig {
  spawnerPosition: [number, number, number];
  portalPosition: [number, number, number];
  pathPoints: Vector3[];
}

const PLATFORM_SIZE = 60;
const HALF_SIZE = PLATFORM_SIZE / 2;

export const PATH_CONFIGS: Record<number, PathConfig> = {
  // Level 1: Simple S-curve path
  1: {
    spawnerPosition: [-HALF_SIZE + 5, 1, -HALF_SIZE + 5],
    portalPosition: [HALF_SIZE - 5, 1, HALF_SIZE - 5],
    pathPoints: [
      new Vector3(-HALF_SIZE + 5, 0, -HALF_SIZE + 5),
      new Vector3(-HALF_SIZE + 5, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(HALF_SIZE - 5, 0, 0),
      new Vector3(HALF_SIZE - 5, 0, HALF_SIZE - 5),
    ],
  },

  // Level 2: Figure-8 path
  2: {
    spawnerPosition: [0, 1, -HALF_SIZE + 5],
    portalPosition: [0, 1, HALF_SIZE - 5],
    pathPoints: [
      new Vector3(0, 0, -HALF_SIZE + 5),
      new Vector3(-HALF_SIZE + 10, 0, -HALF_SIZE + 15),
      new Vector3(-HALF_SIZE + 10, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(HALF_SIZE - 10, 0, 0),
      new Vector3(HALF_SIZE - 10, 0, HALF_SIZE - 15),
      new Vector3(0, 0, HALF_SIZE - 5),
    ],
  },

  // Level 3: Spiral path
  3: {
    spawnerPosition: [-HALF_SIZE + 5, 1, -HALF_SIZE + 5],
    portalPosition: [0, 1, 0],
    pathPoints: [
      new Vector3(-HALF_SIZE + 5, 0, -HALF_SIZE + 5),
      new Vector3(-HALF_SIZE + 5, 0, HALF_SIZE - 5),
      new Vector3(HALF_SIZE - 5, 0, HALF_SIZE - 5),
      new Vector3(HALF_SIZE - 5, 0, -HALF_SIZE + 15),
      new Vector3(-HALF_SIZE + 15, 0, -HALF_SIZE + 15),
      new Vector3(-HALF_SIZE + 15, 0, HALF_SIZE - 15),
      new Vector3(HALF_SIZE - 15, 0, HALF_SIZE - 15),
      new Vector3(0, 0, 0),
    ],
  },

  // Level 4: Diamond path
  4: {
    spawnerPosition: [-HALF_SIZE + 5, 1, 0],
    portalPosition: [HALF_SIZE - 5, 1, 0],
    pathPoints: [
      new Vector3(-HALF_SIZE + 5, 0, 0),
      new Vector3(-HALF_SIZE + 15, 0, -HALF_SIZE + 15),
      new Vector3(0, 0, -HALF_SIZE + 5),
      new Vector3(HALF_SIZE - 15, 0, -HALF_SIZE + 15),
      new Vector3(HALF_SIZE - 5, 0, 0),
      new Vector3(HALF_SIZE - 15, 0, HALF_SIZE - 15),
      new Vector3(0, 0, HALF_SIZE - 5),
      new Vector3(-HALF_SIZE + 15, 0, HALF_SIZE - 15),
      new Vector3(-HALF_SIZE + 5, 0, 0),
    ],
  },
};
