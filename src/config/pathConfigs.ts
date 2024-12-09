import { Vector3 } from "three";

const baseHeight = 0.25;

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
    pathPoints: [
      new Vector3(-20, baseHeight, -20),   // Start
      new Vector3(-20, baseHeight, -15),   // Begin winding
      new Vector3(-19, baseHeight, -10),   // First curve
      new Vector3(-18, baseHeight, -8),    // Approach turn
      new Vector3(-15, baseHeight, -7.5),  // Begin turn
      new Vector3(-12, baseHeight, -7),    // Complete turn
      new Vector3(-11.5, baseHeight, -10), // Start descent
      new Vector3(-11, baseHeight, -13),   // Mid descent
      new Vector3(-10.5, baseHeight, -15), // End descent
      new Vector3(-7, baseHeight, -15.8),  // Begin traverse
      new Vector3(0, baseHeight, -15.2),   // Mid traverse
      new Vector3(7, baseHeight, -15.5),   // End traverse
      new Vector3(11, baseHeight, -12),    // Start ascent
      new Vector3(11.2, baseHeight, -8),   // Mid ascent
      new Vector3(11.5, baseHeight, -5),   // End ascent
      new Vector3(8, baseHeight, -3.8),    // Begin middle
      new Vector3(0, baseHeight, -3.2),    // Mid middle
      new Vector3(-7, baseHeight, -3.5),   // End middle
      new Vector3(-11, baseHeight, 0),     // Start second descent
      new Vector3(-11.2, baseHeight, 4),   // Mid descent
      new Vector3(-11.5, baseHeight, 7),   // End descent
      new Vector3(-8, baseHeight, 8.2),    // Begin bottom
      new Vector3(0, baseHeight, 8.8),     // Mid bottom
      new Vector3(7, baseHeight, 8.5),     // End bottom
      new Vector3(11, baseHeight, 12),     // Begin final ascent
      new Vector3(13, baseHeight, 15),     // Mid final
      new Vector3(15, baseHeight, 18),     // Near end
      new Vector3(20, baseHeight, 20)      // End
    ],
    spawnerPosition: [-20, baseHeight, -20],
    portalPosition: [20, baseHeight, 20]
  },

  // Level 2: Overlapping loops path
  2: {
    // Overlapping loops path
    pathPoints: [
      // Starting point
      new Vector3(-20, baseHeight, 0),
      
      // First large loop (left)
      new Vector3(-15, baseHeight, -15),
      new Vector3(-5, baseHeight, -20),
      new Vector3(5, baseHeight, -15),
      new Vector3(0, baseHeight, -5),
      new Vector3(-15, baseHeight, -15),
      
      // Second large loop (right)
      new Vector3(5, baseHeight, -20),
      new Vector3(15, baseHeight, -15),
      new Vector3(20, baseHeight, -5),
      new Vector3(15, baseHeight, 5),
      new Vector3(5, baseHeight, -20),
      
      // Connecting path
      new Vector3(0, baseHeight, 0),
      
      // Third large loop (bottom)
      new Vector3(-15, baseHeight, 15),
      new Vector3(0, baseHeight, 20),
      new Vector3(15, baseHeight, 15),
      new Vector3(0, baseHeight, 5),
      new Vector3(-15, baseHeight, 15),
      
      // Back to start
      new Vector3(-20, baseHeight, 0)
    ],
    spawnerPosition: [-20, baseHeight, 0],
    portalPosition: [-20, baseHeight, 0]
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
