import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import { useGameStore } from '../store/gameStore';
import { GhostBox } from './GhostBox';
import { PlaceableBox } from './PlaceableBox';
import { StaticBox } from './StaticBox';
import { EnemySpawner } from './EnemySpawner';
import { HUD } from './HUD';

// Generate spiral positions using golden ratio
const generateSpiralPositions = (count: number, scale: number = 1): Vector3[] => {
  const positions: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const radius = scale * Math.sqrt(i);
    const theta = i * goldenAngle;

    positions.push(new Vector3(
      radius * Math.cos(theta),
      1 + (i % 3) * 0.5,
      radius * Math.sin(theta)
    ));
  }

  return positions;
};

// Generate random pattern positions
const generateRandomPattern = (count: number, bounds: number = 8): Vector3[] => {
  const positions: Vector3[] = [];
  const minDistance = 2; // Minimum distance between boxes
  const maxAttempts = 100; // Max attempts to place each box

  const isValidPosition = (pos: Vector3): boolean => {
    // Check if too close to spawner or portal
    if (pos.distanceTo(new Vector3(-8, pos.y, -8)) < 3) return false; // Too close to spawner
    if (pos.distanceTo(new Vector3(8, pos.y, 8)) < 3) return false;   // Too close to portal

    // Check if too close to other boxes
    return !positions.some(existingPos => pos.distanceTo(existingPos) < minDistance);
  };

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let position = new Vector3();

    while (!validPosition && attempts < maxAttempts) {
      // Generate random position within bounds
      position = new Vector3(
        (Math.random() * 2 - 1) * bounds,
        1 + Math.floor(Math.random() * 2) * 0.5, // Height varies between 1 and 1.5
        (Math.random() * 2 - 1) * bounds
      );

      if (isValidPosition(position)) {
        validPosition = true;
        positions.push(position);
      }
      attempts++;
    }
  }

  return positions;
};

const LEVEL_CONFIGS = {
  1: {
    platforms: [
      { position: [0, 0, 0], scale: [20, 1, 20] },
      { position: [-8, 1, -8], scale: [4, 0.5, 4] },
      { position: [8, 1, 8], scale: [4, 0.5, 4] },
    ],
    spawnerPosition: [-8, 2, -8],
    portalPosition: [8, 2, 8],
    gridSize: 1,
    initialBoxes: generateRandomPattern(15).map(pos => ({
      position: pos,
    })),
  },
  2: {
    platforms: [
      { position: [0, 0, 0], scale: [30, 1, 30] },
      { position: [-12, 1, -12], scale: [6, 0.5, 6] },
      { position: [12, 1, 12], scale: [6, 0.5, 6] },
      { position: [0, 2, 0], scale: [4, 0.5, 4] },
    ],
    spawnerPosition: [-12, 2, -12],
    portalPosition: [12, 2, 12],
    gridSize: 1,
    initialBoxes: generateSpiralPositions(21, 1.5).map(pos => ({ position: pos })),
  },
};

export function Level() {
  const { currentLevel, phase, placedBoxes, addBox, removeBox } = useGameStore();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [ghostBoxPosition, setGhostBoxPosition] = useState<Vector3 | null>(null);
  const [isOverPlacedBox, setIsOverPlacedBox] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const lastPlacedPosition = useRef<Vector3 | null>(null);

  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];

  const handleMouseMove = (event: MouseEvent) => {
    if (phase !== 'prep' || placedBoxes.length >= 20) return;

    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };

    raycaster.current.setFromCamera(mouse, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    // First check for placed box intersections
    const placedBoxHit = intersects.find(hit =>
      hit.object.userData?.isPlaceableBox ||
      hit.object.parent?.userData?.isPlaceableBox
    );

    setIsOverPlacedBox(!!placedBoxHit);

    // Then check for platform intersections
    const platformHit = intersects.find(hit =>
      hit.object.name === 'platform' ||
      hit.object.parent?.name === 'platform'
    );

    if (platformHit && !placedBoxHit) {
      const { point } = platformHit;
      const gridSize = config.gridSize;
      const snappedPosition = new Vector3(
        Math.round(point.x / gridSize) * gridSize,
        Math.round((point.y + 0.5) / gridSize) * gridSize,
        Math.round(point.z / gridSize) * gridSize
      );

      // Check if position is already occupied
      const isOccupied = placedBoxes.some(box =>
        box.position.distanceTo(snappedPosition) < 0.1
      );

      if (!isOccupied) {
        setGhostBoxPosition(snappedPosition);
        if (isPlacing && (!lastPlacedPosition.current ||
          lastPlacedPosition.current.distanceTo(snappedPosition) > 0.1)) {
          addBox(snappedPosition);
          lastPlacedPosition.current = snappedPosition.clone();
        }
      } else {
        setGhostBoxPosition(null);
      }
    } else if (placedBoxHit) {
      setGhostBoxPosition(placedBoxHit.object.parent?.position || placedBoxHit.object.position);
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
    <>
      <HUD />
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

        {/* Spawner */}
        {phase === 'combat' && (
          <EnemySpawner position={new Vector3(...config.spawnerPosition)} />
        )}

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
    </>
  );
}