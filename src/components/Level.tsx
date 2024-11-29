import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Environment } from '@react-three/drei';
import { Vector3, Raycaster, AmbientLight, DirectionalLight, MeshStandardMaterial } from 'three';
import { useGameStore } from '../store/gameStore';
import { GhostBox } from './GhostBox';
import { GhostTower } from './GhostTower';
import { GhostCannon } from './GhostCannon';
import { GhostBoomerangTower } from './GhostBoomerangTower';
import { PlaceableBox } from './PlaceableBox';
import { StaticBox } from './StaticBox';
import { EnemySpawner } from './EnemySpawner';
import { Portal } from './Portal';
import { Player } from './Player';
import { BlockedAreas } from './BlockedAreas';
import { Tower, ArrowManager } from './Tower';
import { Cannon } from './Cannon';
import { BoomerangTower } from './BoomerangTower';
import { ArrowTower } from './ArrowTower';
import { GhostArrowTower } from './GhostArrowTower';

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
const generateMazePattern = (levelNumber: number) => {
  const boxes = [];
  const gridSize = 3; // Increased grid size for more spacing
  const centerSize = 8;
  const possibleLengths = [2, 3, 4, 5]; // Increased potential lengths

  for (let x = -centerSize; x <= centerSize; x += gridSize) {
    for (let z = -centerSize; z <= centerSize; z += gridSize) {
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue; // Slightly larger center clearing

      if (Math.random() < 0.5) { // Reduced probability for fewer blocks
        // Randomly choose length from possible lengths
        const length = possibleLengths[Math.floor(Math.random() * possibleLengths.length)];

        // Each block independently chooses orientation
        const isAlongX = Math.random() < 0.5;

        // Calculate position and offset
        const halfLength = (length - 1) / 2;
        const direction = Math.random() < 0.5 ? 1 : -1;

        let finalX = x;
        let finalZ = z;
        let rotation = 0;

        if (isAlongX) {
          finalX += halfLength * direction;
          rotation = 0; // Aligned with X-axis
        } else {
          finalZ += halfLength * direction;
          rotation = Math.PI * 0.5; // Perpendicular to X-axis
        }

        // Check if block would extend too far from center
        const maxExtent = Math.max(
          Math.abs(finalX + (isAlongX ? (length / 2) : 0.5) * direction),
          Math.abs(finalX - (isAlongX ? (length / 2) : 0.5) * direction),
          Math.abs(finalZ + (!isAlongX ? (length / 2) : 0.5) * direction),
          Math.abs(finalZ - (!isAlongX ? (length / 2) : 0.5) * direction)
        );

        if (maxExtent <= centerSize) {
          boxes.push({
            position: [finalX, 0, finalZ] as [number, number, number],
            dimensions: [
              isAlongX ? length : 1,
              1,
              isAlongX ? 1 : length
            ] as [number, number, number],
            rotation
          });
        }
      }
    }
  }
  return boxes;
};

interface LevelConfig {
  platforms: { position: [number, number, number]; scale: [number, number, number] }[];
  initialBoxes: { position: [number, number, number], dimensions: [number, number, number], rotation: number }[];
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
    initialBoxes: generateMazePattern(1),
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
    initialBoxes: generateMazePattern(2),
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
    initialBoxes: generateMazePattern(3),
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
    initialBoxes: generateMazePattern(4),
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
    initialBoxes: generateMazePattern(5),
    portalPosition: [25, 1, 25],
    spawnerPosition: [-25, 1, -25],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
};

export function Level() {
  const { currentLevel, phase, placedBoxes, addPlacedBox, removePlacedBox, timer, setIsSpawning, setLevelComplete, enemiesAlive, isSpawning, selectedObjectType } = useGameStore();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [ghostBoxPosition, setGhostBoxPosition] = useState<Vector3 | null>(null);
  const [isOverPlacedBox, setIsOverPlacedBox] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showGhostBox, setShowGhostBox] = useState(false);
  const lastPlacedPosition = useRef<Vector3 | null>(null);

  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];
  const spawnerPosition = new Vector3(...config.spawnerPosition);

  const isOverInitialBlock = (position: Vector3) => {
    return LEVEL_CONFIGS[currentLevel].initialBoxes.some(box => {
      const [x, y, z] = box.position;
      return position.x === x && position.y === y && position.z === z;
    });
  };

  const isOverlappingInitialBlock = (position: Vector3) => {
    const config = LEVEL_CONFIGS[currentLevel];
    return config.initialBoxes.some(box => {
      const boxPos = new Vector3(box.position[0], box.position[1], box.position[2]);
      const boxDim = new Vector3(box.dimensions[0], box.dimensions[1], box.dimensions[2]);

      // Account for rotation in dimension check
      const effectiveDimX = Math.abs(Math.cos(box.rotation)) * boxDim.x + Math.abs(Math.sin(box.rotation)) * boxDim.z;
      const effectiveDimZ = Math.abs(Math.sin(box.rotation)) * boxDim.x + Math.abs(Math.cos(box.rotation)) * boxDim.z;

      // Check if position is within the box bounds
      return Math.abs(position.x - boxPos.x) <= effectiveDimX / 2 &&
        Math.abs(position.z - boxPos.z) <= effectiveDimZ / 2;
    });
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (phase !== 'prep' || placedBoxes.length >= 20) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
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
        const config = LEVEL_CONFIGS[currentLevel];
        const gridSize = config.gridSize;

        const snappedPosition = new Vector3(
          Math.round(point.x / gridSize) * gridSize,
          0,
          Math.round(point.z / gridSize) * gridSize
        );

        const isOverPlaced = placedBoxes.some(box =>
          box.position[0] === snappedPosition.x &&
          box.position[1] === snappedPosition.y &&
          box.position[2] === snappedPosition.z
        );

        const isOverInitial = isOverlappingInitialBlock(snappedPosition);
        const canPlaceHere = !isOverPlaced && !isOverInitial;

        setIsOverPlacedBox(isOverPlaced || isOverInitial);

        if (canPlaceHere) {
          setGhostBoxPosition(snappedPosition);
          setShowGhostBox(true);
          if (isPlacing && (!lastPlacedPosition.current ||
            lastPlacedPosition.current.distanceTo(snappedPosition) > 0.1)) {
            addPlacedBox(snappedPosition, selectedObjectType);
            lastPlacedPosition.current = snappedPosition.clone();
          }
        } else {
          setShowGhostBox(false);
        }
      } else {
        setShowGhostBox(false);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (phase !== 'prep' || placedBoxes.length >= 20) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
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
          removePlacedBox(boxToRemove.id);
          event.stopPropagation();
        }
      } else if (ghostBoxPosition && !isOverPlacedBox) {
        setIsPlacing(true);
        addPlacedBox(ghostBoxPosition, selectedObjectType);
        lastPlacedPosition.current = ghostBoxPosition.clone();
      }
    };

    const handleMouseUp = () => {
      setIsPlacing(false);
      lastPlacedPosition.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [phase, placedBoxes.length, camera, scene, currentLevel, isPlacing, ghostBoxPosition, isOverPlacedBox, selectedObjectType]);

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

  // Create ambient and directional lights
  const ambientLight = useMemo(() => new AmbientLight(0x404040, 0.5), []);
  const mainLight = useMemo(() => {
    const light = new DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 20, 10);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 100;
    light.shadow.camera.left = -30;
    light.shadow.camera.right = 30;
    light.shadow.camera.top = 30;
    light.shadow.camera.bottom = -30;
    return light;
  }, []);

  // Platform material with subtle metallic and roughness
  const platformMaterial = useMemo(() =>
    new MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.2,
      roughness: 0.7,
    })
    , []);

  // Box material with different colors for different types
  const staticBoxMaterial = useMemo(() =>
    new MeshStandardMaterial({
      color: 0x4a6fa5,
      metalness: 0.3,
      roughness: 0.6,
    })
    , []);

  const placedBoxMaterial = useMemo(() =>
    new MeshStandardMaterial({
      color: 0x6b9080,
      metalness: 0.3,
      roughness: 0.6,
    })
    , []);

  const ghostBoxMaterial = useMemo(() =>
    new MeshStandardMaterial({
      color: 0x90be6d,
      transparent: true,
      opacity: 0.5,
      metalness: 0.1,
      roughness: 0.8,
    })
    , []);

  const [arrows, setArrows] = useState<{ position: Vector3; direction: Vector3; id: number }[]>([]);

  const handleArrowComplete = (id: number) => {
    setArrows(prev => prev.filter(a => a.id !== id));
  };

  return (
    <group>
      <primitive object={ambientLight} />
      <primitive object={mainLight} />

      {/* Environment */}
      <Environment preset="sunset" />

      {/* Ground plane for better shadows */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color={0x808080}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Platforms */}
      {config.platforms.map((platform, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh
            position={new Vector3(...platform.position)}
            name="platform"
            receiveShadow
            castShadow
            material={platformMaterial}
          >
            <boxGeometry args={platform.scale} />
          </mesh>
        </RigidBody>
      ))}

      {/* Initial Static Boxes */}
      {config.initialBoxes.map((box, index) => (
        <StaticBox key={`static-${index}`} position={box.position} dimensions={box.dimensions} rotation={box.rotation} material={staticBoxMaterial} />
      ))}

      {/* Ghost Preview */}
      {showGhostBox && ghostBoxPosition && (
        <>
          {selectedObjectType === 'block' && (
            <GhostBox position={ghostBoxPosition} isRemoveMode={isOverPlacedBox} objectType={selectedObjectType} />
          )}
          {selectedObjectType === 'tower' && (
            <GhostTower position={ghostBoxPosition} />
          )}
          {selectedObjectType === 'arrow' && (
            <GhostArrowTower position={ghostBoxPosition} />
          )}
          {selectedObjectType === 'cannon' && (
            <GhostCannon position={ghostBoxPosition} />
          )}
          {selectedObjectType === 'boomerang' && (
            <GhostBoomerangTower position={ghostBoxPosition} />
          )}
        </>
      )}

      {/* Placed Objects */}
      {placedBoxes.map((box) => {
        const pos = [box.position.x, box.position.y, box.position.z] as [number, number, number];
        switch (box.type) {
          case 'block':
            return (
              <StaticBox
                key={box.id}
                position={box.position}
                dimensions={[2, 2, 2]}
                material={staticBoxMaterial}
              />
            );
          case 'tower':
            return (
              <Tower
                key={box.id}
                position={box.position}
                onArrowSpawn={(arrow) => setArrows(prev => [...prev, arrow])}
              />
            );
          case 'arrow':
            return (
              <ArrowTower
                key={box.id}
                position={box.position}
              />
            );
          case 'cannon':
            return (
              <Cannon
                key={box.id}
                position={box.position}
              />
            );
          case 'boomerang':
            return (
              <BoomerangTower
                key={box.id}
                position={box.position}
              />
            );
        }
      })}

      {/* Arrows rendered at root level */}
      <ArrowManager arrows={arrows} onArrowComplete={handleArrowComplete} />

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

      {/* Show blocked areas during prep phase */}
      {phase === 'prep' && <BlockedAreas currentLevel={currentLevel} />}
    </group>
  );
}