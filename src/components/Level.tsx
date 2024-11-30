import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, useGLTF } from '@react-three/drei';
import { Vector3, Raycaster, AmbientLight, DirectionalLight, MeshStandardMaterial, Color, DoubleSide, Plane, Vector2 } from 'three';
import { TOWER_STATS, useGameStore } from '../store/gameStore';
import { Edges, MeshTransmissionMaterial, Float } from '@react-three/drei';
import { WaveManager } from './WaveManager';
import { Tower, TowerType } from './Tower';
import { Creep } from './Creep'; // Assuming Creep component is defined in Creep.tsx

const pathColor = new Color('#4338ca').convertSRGBToLinear();
const platformColor = new Color('#1e293b').convertSRGBToLinear();
const wallColor = new Color('#334155').convertSRGBToLinear();
const crystalColor = new Color('#3b82f6').convertSRGBToLinear();

// Create shared materials to improve performance
const pathMaterial = new MeshStandardMaterial({
  color: pathColor,
  roughness: 0.2,
  metalness: 0.8,
  envMapIntensity: 1.5,
  emissive: pathColor,
  emissiveIntensity: 0.2
});

const platformMaterial = new MeshStandardMaterial({
  color: platformColor,
  roughness: 0.8,
  metalness: 0.3,
  envMapIntensity: 1
});

const wallMaterial = new MeshStandardMaterial({
  color: wallColor,
  roughness: 0.3,
  metalness: 0.7,
  envMapIntensity: 1.2
});

function Crystal({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      position={position}
    >
      <mesh ref={crystalRef} scale={scale} castShadow receiveShadow>
        <octahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.5}
          transmission={1}
          roughness={0}
          metalness={0}
          color={crystalColor}
        />
        <Edges color="#6495ED" />
      </mesh>
    </Float>
  );
}

function Pillar({ position, height = 4 }: { position: [number, number, number], height?: number }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, height * 0.25, 0]} castShadow receiveShadow material={wallMaterial}>
        <boxGeometry args={[2, height * 0.5, 2]} />
        <Edges color="#475569" />
      </mesh>

      {/* Crystal top */}
      <Crystal position={[0, height + 0.5, 0]} scale={0.8} />
    </group>
  );
}

function generateElementTDPath() {
  // Start and end points
  const startPos = [-15, 0, -15];
  const endPos = [15, 0, 15];

  // Path points (can be customized for different layouts)
  const pathPoints = [
    startPos,
    [-15, 0, 0],
    [0, 0, 0],
    [0, 0, 15],
    endPos
  ];

  // Generate path segments
  const segments = [];
  for (let i = 0; i <pathPoints.length - 1; i++) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const length = Math.sqrt(
      Math.pow(end[0] - start[0], 2) +
      Math.pow(end[2] - start[2], 2)
    );

    segments.push({
      position: [
        (start[0] + end[0]) / 2,
        0.1,
        (start[2] + end[2]) / 2
      ],
      scale: [
        Math.abs(end[0] - start[0]) || 4,
        0.2,
        Math.abs(end[2] - start[2]) || 4
      ]
    });
  }

  return {
    pathPoints: pathPoints.map(p => new Vector3(p[0], p[1], p[2])),
    segments
  };
}

interface LevelConfig {
  platforms: { position: [number, number, number]; scale: [number, number, number]; material: MeshStandardMaterial }[];
  decorations: { crystals: { position: [number, number, number]; scale: number; rotation: number }[]; pillars: { position: [number, number, number] }[] };
  initialBoxes: { position: [number, number, number], dimensions: [number, number, number], rotation: number }[];
  portalPosition: [number, number, number];
  spawnerPosition: [number, number, number];
  spawnPosition: [number, number, number];
  gridSize: number;
}

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    platforms: [
      // Main elevated platform
      { position: [0, 0, 0], scale: [40, 2, 40], material: platformMaterial },

      // Path depressions (making the path lower than tower areas)
      // Top path
      { position: [0, 0.5, -10], scale: [30, 1, 4], material: pathMaterial },
      // Middle path
      { position: [0, 0.5, 0], scale: [30, 1, 4], material: pathMaterial },
      // Bottom path
      { position: [0, 0.5, 10], scale: [30, 1, 4], material: pathMaterial },
      // Left vertical path
      { position: [-14, 0.5, -5], scale: [4, 1, 10], material: pathMaterial },
      // Right vertical path
      { position: [14, 0.5, 5], scale: [4, 1, 10], material: pathMaterial },

      // Decorative outer rim
      { position: [0, 0, -19.5], scale: [40, 3, 1], material: wallMaterial },
      { position: [0, 0, 19.5], scale: [40, 3, 1], material: wallMaterial },
      { position: [19.5, 0, 0], scale: [1, 3, 40], material: wallMaterial },
      { position: [-19.5, 0, 0], scale: [1, 3, 40], material: wallMaterial },
    ],
    decorations: {
      crystals: [
        { position: [-15, 2, 15], scale: 1, rotation: Math.PI / 4 }, // Spawn crystal
        { position: [15, 2, -15], scale: 1, rotation: Math.PI / 4 }, // End crystal
      ],
      pillars: [
        // Corner pillars
        { position: [-19, 1.5, -19] },
        { position: [19, 1.5, -19] },
        { position: [-19, 1.5, 19] },
        { position: [19, 1.5, 19] },
        // Path intersection pillars
        { position: [-14, 1.5, -10] },
        { position: [-14, 1.5, 0] },
        { position: [14, 1.5, 0] },
        { position: [14, 1.5, 10] },
      ],
    },
    initialBoxes: generateElementTDPath().segments,
    portalPosition: [15, 2, -15],
    spawnerPosition: [-15, 2, 15],
    spawnPosition: [0, 2, 0],
    gridSize: 1,
  },
  2: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [45, 1, 45], material: platformMaterial },
      // Outer elevated ring - North
      { position: [0, 0, -17.5], scale: [45, 1, 10], material: pathMaterial },
      // South
      { position: [0, 0, 17.5], scale: [45, 1, 10], material: pathMaterial },
      // East
      { position: [17.5, 0, 0], scale: [10, 1, 25], material: pathMaterial },
      // West
      { position: [-17.5, 0, 0], scale: [10, 1, 25], material: pathMaterial },
    ],
    decorations: {
      crystals: [],
      pillars: [],
    },
    initialBoxes: generateElementTDPath().segments,
    portalPosition: [18, 1, 18],
    spawnerPosition: [-18, 1, -18],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  3: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [50, 1, 50], material: platformMaterial },
      // Outer elevated ring - North
      { position: [0, 0, -20], scale: [50, 1, 10], material: pathMaterial },
      // South
      { position: [0, 0, 20], scale: [50, 1, 10], material: pathMaterial },
      // East
      { position: [20, 0, 0], scale: [10, 1, 30], material: pathMaterial },
      // West
      { position: [-20, 0, 0], scale: [10, 1, 30], material: pathMaterial },
    ],
    decorations: {
      crystals: [],
      pillars: [],
    },
    initialBoxes: generateElementTDPath().segments,
    portalPosition: [20, 1, 20],
    spawnerPosition: [-20, 1, -20],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  4: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [55, 1, 55], material: platformMaterial },
      // Outer elevated ring - North
      { position: [0, 0, -22.5], scale: [55, 1, 10], material: pathMaterial },
      // South
      { position: [0, 0, 22.5], scale: [55, 1, 10], material: pathMaterial },
      // East
      { position: [22.5, 0, 0], scale: [10, 1, 35], material: pathMaterial },
      // West
      { position: [-22.5, 0, 0], scale: [10, 1, 35], material: pathMaterial },
    ],
    decorations: {
      crystals: [],
      pillars: [],
    },
    initialBoxes: generateElementTDPath().segments,
    portalPosition: [22, 1, 22],
    spawnerPosition: [-22, 1, -22],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
  5: {
    platforms: [
      // Base platform
      { position: [0, -1, 0], scale: [60, 1, 60], material: platformMaterial },
      // Outer elevated ring - North
      { position: [0, 0, -25], scale: [60, 1, 10], material: pathMaterial },
      // South
      { position: [0, 0, 25], scale: [60, 1, 10], material: pathMaterial },
      // East
      { position: [25, 0, 0], scale: [10, 1, 40], material: pathMaterial },
      // West
      { position: [-25, 0, 0], scale: [10, 1, 40], material: pathMaterial },
    ],
    decorations: {
      crystals: [],
      pillars: [],
    },
    initialBoxes: generateElementTDPath().segments,
    portalPosition: [25, 1, 25],
    spawnerPosition: [-25, 1, -25],
    spawnPosition: [0, 1, 0],
    gridSize: 1,
  },
};

export function Level() {
  const path = generateElementTDPath();
  const pathPoints = useMemo(() => {
    const points: Vector3[] = [
      new Vector3(-15, 0, -15),
      new Vector3(-15, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 15),
      new Vector3(15, 0, 15),
    ];
    return points;
  }, []);

  const { selectedObjectType, money, spendMoney, addPlacedTower, placedTowers, setSelectedObjectType, creeps } = useGameStore();
  const [placementIndicator, setPlacementIndicator] = useState<Vector3 | null>(null);
  const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
  const { camera } = useThree();
  const raycaster = new Raycaster();

  // Handle pointer movement and placement
  const handlePointerMove = (event: any) => {
    // console.log('Pointer move:', { selectedObjectType });
    if (!selectedObjectType) return;

    // Update the picking ray with the camera and pointer position
    raycaster.setFromCamera(event.pointer, camera);

    // Calculate intersection with the ground plane
    const intersection = new Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      // Snap to grid
      intersection.x = Math.round(intersection.x);
      intersection.z = Math.round(intersection.z);
      intersection.y = 0;

      // Check if position is valid (not on path or existing tower)
      const isOnPath = path.segments.some(segment => {
        const dx = Math.abs(intersection.x - segment.position[0]);
        const dz = Math.abs(intersection.z - segment.position[2]);
        return dx < 2 && dz < 2;
      });

      if (!isOnPath) {
        setPlacementIndicator(intersection);
      } else {
        setPlacementIndicator(null);
      }
    }
  };

  const handlePlaceTower = () => {
    if (!selectedObjectType || !placementIndicator) return;

    const towerStats = TOWER_STATS[selectedObjectType];
    if (!towerStats) return;

    if (money < towerStats.cost) {
      // Not enough money, unselect tower
      setSelectedObjectType(null);
      return;
    }

    // Place tower
    addPlacedTower(
      new Vector3(
        Math.round(placementIndicator.x),
        0,
        Math.round(placementIndicator.z)
      ),
      selectedObjectType
    );

    // Spend money
    spendMoney(towerStats.cost);
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    console.log('Click event:', {
      selectedObjectType,
      placementIndicator: placementIndicator?.toArray(),
      money
    });

    if (selectedObjectType && placementIndicator) {
      handlePlaceTower();
    }
  };

  return (
    <group>
      {/* Ground plane for pointer events */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>

      {/* Path */}
      {path.segments.map((segment, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh
            position={segment.position}
            material={pathMaterial}
            receiveShadow
          >
            <boxGeometry args={segment.scale} />
          </mesh>
        </RigidBody>
      ))}

      {/* Decorative Pillars */}
      {[
        [-12, 0, -12],
        [-12, 0, 12],
        [12, 0, -12],
        [12, 0, 12]
      ].map((pos, index) => (
        <Pillar key={index} position={pos as [number, number, number]} />
      ))}

      {/* Start and End Crystals */}
      <Crystal position={[-15, 1.5, -15]} scale={1.5} />
      <Crystal position={[15, 1.5, 15]} scale={1.5} />

      {/* Creeps */}
      {creeps.map(creep => (
        <Creep
          key={creep.id}
          id={creep.id}
          pathPoints={pathPoints}
        />
      ))}

      {/* Placement Preview */}
      {selectedObjectType && placementIndicator && (
        <Tower
          position={placementIndicator}
          type={selectedObjectType}
          preview={true}
          canAfford={money >= TOWER_STATS[selectedObjectType].cost}
        />
      )}

      {/* Placed Towers */}
      {placedTowers.map((tower, index) => (
        <Tower
          key={index}
          position={tower.position}
          type={tower.type}
          onDamageEnemy={(enemyId, damage, effects) => {
            const enemy = creeps.find(c => c.id === enemyId);
            if (enemy) {
              const newHealth = enemy.health - damage;
              useGameStore.getState().updateCreep(enemyId, {
                health: newHealth,
                effects: {
                  ...enemy.effects,
                  slow: Math.max(enemy.effects.slow || 0, effects.slow || 0),
                  amplify: Math.max(enemy.effects.amplify || 0, effects.amplify || 0),
                  poison: Math.max(enemy.effects.poison || 0, effects.poison || 0),
                  armor: Math.max(enemy.effects.armor || 0, effects.armor || 0)
                }
              });
            }
          }}
        />
      ))}

      {/* Wave Manager */}
      <WaveManager pathPoints={pathPoints} />
    </group>
  );
}