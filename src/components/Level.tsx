import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import { useGameStore } from '../store/gameStore';
import { GhostBox } from './GhostBox';
import { PlaceableBox } from './PlaceableBox';
import { StaticBox } from './StaticBox';
import { EnemySpawner } from './EnemySpawner';

// Generate spiral positions using golden ratio
const generateSpiralPositions = (count: number, scale: number = 1): Vector3[] => {
  const positions: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = 10;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = i * goldenAngle;
    const r = radius * Math.sqrt(t);
    const x = Math.round(r * Math.cos(angle) * scale);
    const z = Math.round(r * Math.sin(angle) * scale);
    positions.push(new Vector3(x, 1, z));
  }
  return positions;
};

// Generate maze-like pattern
const generateMazePattern = (levelNumber: number): Vector3[] => {
  const positions: Vector3[] = [];
  const gridSize = 2; // Size of each cell
  const centerSize = 8; // Size of the center area (half-width)
  const density = 0.4; // Probability of placing a block

  // Calculate spawn and portal positions based on level size
  const levelSize = 15 + (levelNumber - 1) * 5; // Increases by 5 each level
  const spawnerPos = new Vector3(-levelSize, 0, -levelSize);
  const portalPos = new Vector3(levelSize, 0, levelSize);
  const centerPos = new Vector3(0, 0, 0);

  // Create paths from spawner to center and center to portal
  const createPath = (start: Vector3, end: Vector3, width: number = 2) => {
    const direction = end.clone().sub(start).normalize();
    const perpendicular = new Vector3(-direction.z, 0, direction.x);
    const pathPoints: Vector3[] = [];

    // Calculate path bounds
    const pathLength = start.distanceTo(end);
    for (let d = 0; d <= pathLength; d += gridSize) {
      const point = start.clone().add(direction.clone().multiplyScalar(d));
      // Add points on either side of the path to prevent blocks from being placed there
      for (let w = -width; w <= width; w += gridSize) {
        pathPoints.push(point.clone().add(perpendicular.clone().multiplyScalar(w)));
      }
    }
    return pathPoints;
  };

  const pathToCenter = createPath(spawnerPos, centerPos);
  const pathFromCenter = createPath(centerPos, portalPos);
  const allPathPoints = [...pathToCenter, ...pathFromCenter];

  // Helper function to check if a position is on a path
  const isOnPath = (pos: Vector3): boolean => {
    return allPathPoints.some(pathPoint => 
      Math.abs(pathPoint.x - pos.x) < gridSize && 
      Math.abs(pathPoint.z - pos.z) < gridSize
    );
  };

  // Create ground-level maze pattern in center area
  for (let x = -centerSize; x <= centerSize; x += gridSize) {
    for (let z = -centerSize; z <= centerSize; z += gridSize) {
      const pos = new Vector3(x, 0, z);
      
      // Skip if position is on a path
      if (isOnPath(pos)) continue;

      // Skip the immediate center area
      if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
      
      // Create some continuous walls
      if (Math.abs(x) % 4 === 0 || Math.abs(z) % 4 === 0) {
        if (Math.random() < 0.7) { // 70% chance for wall blocks
          positions.push(pos);
        }
      }
      // Add some random blocks for organic feel
      else if (Math.random() < density) {
        positions.push(pos);
      }
    }
  }

  return positions;
};

interface LevelConfig {
  platforms: { position: [number, number, number]; scale: [number, number, number] }[];
  initialBoxes: { position: [number, number, number] }[];
  portalPosition: [number, number, number];
  spawnerPosition: [number, number, number];
  spawnPosition: [number, number, number];
  gridSize: number;
}

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [40, 1, 40] },
      // Outer elevated ring - North
      { position: [0, 0, -15], scale: [40, 1, 10] },
      // South
      { position: [0, 0, 15], scale: [40, 1, 10] },
      // East
      { position: [15, 0, 0], scale: [10, 1, 20] },
      // West
      { position: [-15, 0, 0], scale: [10, 1, 20] },
    ],
    initialBoxes: generateMazePattern(1)
      .map(v => ({ position: [v.x, v.y, v.z] as [number, number, number] })),
    portalPosition: [15, 1, 15],
    spawnerPosition: [-15, 1, -15],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  2: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [45, 1, 45] },
      // Outer elevated ring - North
      { position: [0, 0, -17.5], scale: [45, 1, 10] },
      // South
      { position: [0, 0, 17.5], scale: [45, 1, 10] },
      // East
      { position: [17.5, 0, 0], scale: [10, 1, 25] },
      // West
      { position: [-17.5, 0, 0], scale: [10, 1, 25] },
    ],
    initialBoxes: generateMazePattern(2)
      .map(v => ({ position: [v.x, v.y, v.z] as [number, number, number] })),
    portalPosition: [18, 1, 18],
    spawnerPosition: [-18, 1, -18],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  3: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [50, 1, 50] },
      // Outer elevated ring - North
      { position: [0, 0, -20], scale: [50, 1, 10] },
      // South
      { position: [0, 0, 20], scale: [50, 1, 10] },
      // East
      { position: [20, 0, 0], scale: [10, 1, 30] },
      // West
      { position: [-20, 0, 0], scale: [10, 1, 30] },
    ],
    initialBoxes: generateMazePattern(3)
      .map(v => ({ position: [v.x, v.y, v.z] as [number, number, number] })),
    portalPosition: [20, 1, 20],
    spawnerPosition: [-20, 1, -20],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  4: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [55, 1, 55] },
      // Outer elevated ring - North
      { position: [0, 0, -22.5], scale: [55, 1, 10] },
      // South
      { position: [0, 0, 22.5], scale: [55, 1, 10] },
      // East
      { position: [22.5, 0, 0], scale: [10, 1, 35] },
      // West
      { position: [-22.5, 0, 0], scale: [10, 1, 35] },
    ],
    initialBoxes: generateMazePattern(4)
      .map(v => ({ position: [v.x, v.y, v.z] as [number, number, number] })),
    portalPosition: [22, 1, 22],
    spawnerPosition: [-22, 1, -22],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  5: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [60, 1, 60] },
      // Outer elevated ring - North
      { position: [0, 0, -25], scale: [60, 1, 10] },
      // South
      { position: [0, 0, 25], scale: [60, 1, 10] },
      // East
      { position: [25, 0, 0], scale: [10, 1, 40] },
      // West
      { position: [-25, 0, 0], scale: [10, 1, 40] },
    ],
    initialBoxes: generateMazePattern(5)
      .map(v => ({ position: [v.x, v.y, v.z] as [number, number, number] })),
    portalPosition: [25, 1, 25],
    spawnerPosition: [-25, 1, -25],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
};

export function Level() {
  const { currentLevel, phase, placedBoxes, addBox, removeBox, timer, setIsSpawning, setLevelComplete, enemiesAlive, isSpawning } = useGameStore();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [ghostBoxPosition, setGhostBoxPosition] = useState<Vector3 | null>(null);
  const [isOverPlacedBox, setIsOverPlacedBox] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const lastPlacedPosition = useRef<Vector3 | null>(null);

  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];
  const spawnerPosition = new Vector3(...config.spawnerPosition);

  const isOverInitialBlock = (position: Vector3) => {
    return LEVEL_CONFIGS[currentLevel].initialBoxes.some(box => {
      const [x, y, z] = box.position;
      return position.x === x && position.y === y && position.z === z;
    });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (phase !== 'prep' || placedBoxes.length >= 20) return;

    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };

    raycaster.current.setFromCamera(mouse, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    const platformIntersect = intersects.find(intersect => 
      intersect.object.name === 'platform' || 
      intersect.object.name === 'placed-box' ||
      intersect.object.name === 'static-box'
    );

    if (platformIntersect) {
      const point = platformIntersect.point;
      const gridSize = config.gridSize;
      
      const snappedPosition = new Vector3(
        Math.round(point.x / gridSize) * gridSize,
        0, // Force y position to ground level
        Math.round(point.z / gridSize) * gridSize
      );

      const canPlace = intersects.some(intersect => intersect.object.name === 'platform');

      setIsOverPlacedBox(placedBoxes.some(box => 
        box.position[0] === snappedPosition.x &&
        box.position[1] === snappedPosition.y &&
        box.position[2] === snappedPosition.z
      ));

      if (!isOverPlacedBox && !isOverInitialBlock(snappedPosition) && canPlace) {
        setGhostBoxPosition(snappedPosition);
        if (isPlacing && (!lastPlacedPosition.current ||
          lastPlacedPosition.current.distanceTo(snappedPosition) > 0.1)) {
          addBox(snappedPosition);
          lastPlacedPosition.current = snappedPosition.clone();
        }
      } else {
        setGhostBoxPosition(null);
      }
    } else {
      setGhostBoxPosition(null);
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (phase !== 'prep' || placedBoxes.length >= 20) return;

    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };

    raycaster.current.setFromCamera(mouse, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    const placedBoxHit = intersects.find(hit =>
      hit.object.userData?.isPlaceableBox ||
      hit.object.parent?.userData?.isPlaceableBox
    );

    if (placedBoxHit) {
      const boxPosition = placedBoxHit.object.parent?.position || placedBoxHit.object.position;
      const boxToRemove = placedBoxes.find(box =>
        box.position.distanceTo(boxPosition) < 0.1
      );
      if (boxToRemove) {
        removeBox(boxToRemove.id);
        event.stopPropagation();
      }
    } else if (ghostBoxPosition && !isOverPlacedBox) {
      setIsPlacing(true);
      addBox(ghostBoxPosition);
      lastPlacedPosition.current = ghostBoxPosition.clone();
    }
  };

  const handleMouseUp = () => {
    setIsPlacing(false);
    lastPlacedPosition.current = null;
  };

  useEffect(() => {
    if (phase === 'combat') {
      setIsSpawning(true);
    }
  }, [phase, setIsSpawning]);

  useEffect(() => {
    if (phase === 'combat' && timer <= 0) {
      setIsSpawning(false);
    }
  }, [phase, timer, setIsSpawning]);

  useEffect(() => {
    if (phase === 'combat' && enemiesAlive === 0 && !isSpawning && timer <= 0) {
      setLevelComplete(true);
    }
  }, [phase, enemiesAlive, isSpawning, timer, setLevelComplete]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [phase, camera, scene, config.gridSize, placedBoxes.length, isPlacing, isOverPlacedBox, ghostBoxPosition]);

  return (
    <group>
      {/* Platforms */}
      {config.platforms.map((platform, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh
            position={new Vector3(...platform.position)}
            name="platform"
            receiveShadow
          >
            <boxGeometry args={platform.scale} />
            <meshStandardMaterial color="cornflowerblue" />
          </mesh>
        </RigidBody>
      ))}

      {/* Initial Static Boxes */}
      {config.initialBoxes.map((box, index) => (
        <StaticBox key={`static-${index}`} position={box.position} />
      ))}

      {/* Placeable Boxes */}
      {placedBoxes.map((box) => (
        <PlaceableBox
          key={box.id}
          position={box.position}
          onRemove={() => removeBox(box.id)}
        />
      ))}

      {/* Ghost Box */}
      {phase === 'prep' && ghostBoxPosition && placedBoxes.length < 20 && (
        <GhostBox
          position={ghostBoxPosition}
          isRemoveMode={isOverPlacedBox}
        />
      )}

      {/* Always render spawner */}
      <EnemySpawner position={spawnerPosition} />

      {/* Portal */}
      <mesh position={new Vector3(...config.portalPosition)}>
        <torusGeometry args={[1, 0.2, 16, 32]} />
        <meshStandardMaterial
          color="purple"
          emissive="purple"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}