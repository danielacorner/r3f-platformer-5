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
const generateMazePattern = (config: LevelConfig): Vector3[] => {
  const positions: Vector3[] = [];
  const gridSize = 2; // Size of each cell
  const mazeSize = 10; // Size of the maze
  const density = 0.4; // Probability of placing a block
  
  // Create ground-level maze pattern
  for (let x = -mazeSize; x <= mazeSize; x += gridSize) {
    for (let z = -mazeSize; z <= mazeSize; z += gridSize) {
      // Skip the center area to ensure player has space
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
      
      // Create some continuous walls
      if (Math.abs(x) % 4 === 0 || Math.abs(z) % 4 === 0) {
        if (Math.random() < 0.7) { // 70% chance for wall blocks
          positions.push(new Vector3(x, 0, z));
        }
      }
      // Add some random blocks for organic feel
      else if (Math.random() < density) {
        positions.push(new Vector3(x, 0, z));
      }
      
      // Add extra density near the edges for more interesting boundaries
      if ((Math.abs(x) >= mazeSize - 2 || Math.abs(z) >= mazeSize - 2) && Math.random() < 0.3) {
        positions.push(new Vector3(x, 0, z));
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
      { position: [0, -1, 0], scale: [40, 1, 40] }, // Ground
    ],
    initialBoxes: generateMazePattern({ platforms: [], initialBoxes: [], portalPosition: [0, 0, 0], gridSize: 1 })
      .map(v => ({ position: [v.x, v.y, v.z] })),
    portalPosition: [15, 0, 15],
    spawnerPosition: [-15, 0, -15],
    spawnPosition: [0, 0, 0],
    gridSize: 1,
  },
  2: {
    platforms: [
      { position: [0, -1, 0], scale: [45, 1, 45] },
    ],
    initialBoxes: generateMazePattern({ platforms: [], initialBoxes: [], portalPosition: [0, 0, 0], gridSize: 1 })
      .map(v => ({ position: [v.x, v.y, v.z] })),
    portalPosition: [18, 0, 18],
    spawnerPosition: [-18, 0, -18],
    spawnPosition: [0, 0, 0],
    gridSize: 1,
  },
  3: {
    platforms: [
      { position: [0, -1, 0], scale: [50, 1, 50] },
    ],
    initialBoxes: generateMazePattern({ platforms: [], initialBoxes: [], portalPosition: [0, 0, 0], gridSize: 1 })
      .map(v => ({ position: [v.x, v.y, v.z] })),
    portalPosition: [20, 0, 20],
    spawnerPosition: [-20, 0, -20],
    spawnPosition: [0, 0, 0],
    gridSize: 1,
  },
  4: {
    platforms: [
      { position: [0, -1, 0], scale: [55, 1, 55] },
    ],
    initialBoxes: generateMazePattern({ platforms: [], initialBoxes: [], portalPosition: [0, 0, 0], gridSize: 1 })
      .map(v => ({ position: [v.x, v.y, v.z] })),
    portalPosition: [22, 0, 22],
    spawnerPosition: [-22, 0, -22],
    spawnPosition: [0, 0, 0],
    gridSize: 1,
  },
  5: {
    platforms: [
      { position: [0, -1, 0], scale: [60, 1, 60] },
    ],
    initialBoxes: generateMazePattern({ platforms: [], initialBoxes: [], portalPosition: [0, 0, 0], gridSize: 1 })
      .map(v => ({ position: [v.x, v.y, v.z] })),
    portalPosition: [25, 0, 25],
    spawnerPosition: [-25, 0, -25],
    spawnPosition: [0, 0, 0],
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

    const platformHit = intersects.find(hit =>
      hit.object.name === 'platform' ||
      hit.object.name === 'placed-box' ||
      hit.object.name === 'static-box'
    );

    if (platformHit) {
      const { point } = platformHit;
      const gridSize = config.gridSize;
      
      const snappedPosition = new Vector3(
        Math.round(point.x / gridSize) * gridSize,
        Math.round(point.y / gridSize) * gridSize,
        Math.round(point.z / gridSize) * gridSize
      );

      setIsOverPlacedBox(placedBoxes.some(box =>
        box.position[0] === snappedPosition.x &&
        box.position[1] === snappedPosition.y &&
        box.position[2] === snappedPosition.z
      ));

      if (!isOverPlacedBox && !isOverInitialBlock(snappedPosition)) {
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