import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, useGLTF } from '@react-three/drei';
import { Vector3, Raycaster, Color, DoubleSide, Plane, Vector2, InstancedMesh, Object3D, Matrix4, BoxGeometry, Mesh, Euler } from 'three';
import { TOWER_STATS, useGameStore } from '../store/gameStore';
import { Edges, MeshTransmissionMaterial, Float } from '@react-three/drei';
import { WaveManager } from './WaveManager';
import { Tower } from './Tower';
import { createShaderMaterial } from '../utils/shaders';
import { ObjectPool } from '../utils/objectPool';
import { CreepManager } from './Creep';
import { Player } from './Player';

// Constants and Materials
const pathColor = new Color('#4338ca').convertSRGBToLinear();
const platformColor = new Color('#1e293b').convertSRGBToLinear();
const wallColor = new Color('#334155').convertSRGBToLinear();
const glowColor = new Color('#60a5fa').convertSRGBToLinear();

const pathMaterial = createShaderMaterial('path', {
  color: { value: new Vector3(0.26, 0.22, 0.79) },
  emissive: { value: new Vector3(0.26, 0.22, 0.79) },
  emissiveIntensity: { value: 0.5 },
  roughness: { value: 0.2 },
  metalness: { value: 0.8 }
});

const platformMaterial = createShaderMaterial('platform', {
  color: { value: new Vector3(0.12, 0.16, 0.24) },
  roughness: { value: 0.7 },
  metalness: { value: 0.3 }
});

// Path Generation
function generatePath() {
  const path = {
    segments: [
      { position: [-20, 0.5, -20], scale: [6, 1, 6], rotation: [0, 0, 0] },  // Start platform
      { position: [-20, 0.5, -10], scale: [3, 1, 16], rotation: [0, 0, 0] }, // First straight
      { position: [-15, 0.5, -2], scale: [12, 1, 3], rotation: [0, Math.PI * 0.1, 0] }, // First turn
      { position: [-5, 0.5, 0], scale: [16, 1, 3], rotation: [0, 0, 0] },    // Second straight
      { position: [5, 0.5, 5], scale: [3, 1, 12], rotation: [0, Math.PI * -0.1, 0] }, // Second turn
      { position: [10, 0.5, 15], scale: [12, 1, 3], rotation: [0, 0, 0] },   // Third straight
      { position: [20, 0.5, 20], scale: [6, 1, 6], rotation: [0, 0, 0] }     // End platform
    ],
    points: [
      new Vector3(-20, 0.5, -20),  // Start
      new Vector3(-20, 0.5, -10),  // First straight
      new Vector3(-15, 0.5, -2),   // First turn
      new Vector3(-5, 0.5, 0),     // Second straight
      new Vector3(5, 0.5, 5),      // Second turn
      new Vector3(10, 0.5, 15),    // Third straight
      new Vector3(20, 0.5, 20)     // End
    ],
    decorations: [
      { position: [-18, 0.5, -15], scale: 0.8 },
      { position: [-12, 0.5, -5], scale: 0.8 },
      { position: [-8, 0.5, 2], scale: 0.8 },
      { position: [0, 0.5, 0], scale: 0.8 },
      { position: [8, 0.5, 8], scale: 0.8 },
      { position: [15, 0.5, 18], scale: 0.8 }
    ]
  };
  return path;
}

// Crystal Component
function Crystal({ position, scale = 1, color = '#60a5fa' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const crystalRef = useRef<Mesh>(null);
  const crystalColor = new Color(color).convertSRGBToLinear();

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += 0.01;
      crystalRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={crystalRef} position={position} scale={scale} castShadow>
        <octahedronGeometry args={[1]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          thickness={0.5}
          chromaticAberration={1}
          anisotropy={1}
          distortion={0.5}
          distortionScale={0.1}
          temporalDistortion={0.2}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[0, 1400]}
          color={crystalColor}
          transmission={0.95}
        />
        <Edges scale={1.1} threshold={15} color={crystalColor} />
      </mesh>
      <pointLight intensity={2} distance={5} color={color} />
    </Float>
  );
}

export function Level() {
  // Game State
  const {
    phase,
    placedTowers,
    selectedObjectType,
    money,
    creeps,
    addPlacedTower,
    setSelectedObjectType
  } = useGameStore();

  // Refs and State
  const pathRef = useRef<InstancedMesh>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [canAffordTower, setCanAffordTower] = useState(true);

  // Path Generation
  const { segments, points: pathPoints } = useMemo(() => generatePath(), []);

  // Raycasting for Tower Placement
  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();
  const intersectPoint = new Vector3();
  const { camera, size } = useThree();

  // Tower Placement Logic
  const handlePointerMove = (event: any) => {
    if (!selectedObjectType) return;

    const mouse = new Vector2(
      (event.offsetX / size.width) * 2 - 1,
      -(event.offsetY / size.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersectPoint);

    // Snap to grid
    const snappedPosition: [number, number, number] = [
      Math.round(intersectPoint.x),
      0.5,
      Math.round(intersectPoint.z)
    ];

    setPreviewPosition(snappedPosition);
    setShowPreview(true);
    setCanAffordTower(money >= TOWER_STATS[selectedObjectType].cost);
  };

  const handlePlaceTower = () => {
    if (!selectedObjectType || !canAffordTower) return;

    // Check if position is valid (not on path, not occupied)
    const isValidPosition = !segments.some(segment => {
      const [x, y, z] = previewPosition;
      const [sx, sy, sz] = segment.position;
      const [sw, sh, sd] = segment.scale;
      return (
        x >= sx - sw / 2 && x <= sx + sw / 2 &&
        z >= sz - sd / 2 && z <= sz + sd / 2
      );
    });

    if (isValidPosition) {
      addPlacedTower(new Vector3(...previewPosition), selectedObjectType);
      setSelectedObjectType(null);
      setShowPreview(false);
    }
  };

  // Instance Matrices for Path
  const matrices = useMemo(() => {
    return segments.map(segment => {
      const matrix = new Matrix4();
      const rotationMatrix = new Matrix4();

      // Apply rotation first
      rotationMatrix.makeRotationFromEuler(new Euler(
        segment.rotation[0],
        segment.rotation[1],
        segment.rotation[2]
      ));

      // Then position and scale
      matrix
        .multiply(rotationMatrix)
        .setPosition(...segment.position)
        .scale(new Vector3(...segment.scale));

      return matrix;
    });
  }, [segments]);

  // Update Instance Matrices
  useEffect(() => {
    if (pathRef.current) {
      matrices.forEach((matrix, i) => {
        pathRef.current?.setMatrixAt(i, matrix);
      });
      pathRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  return (
    <group>
      {/* Environment */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.001}
      />

      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[60, 1, 60]} />
          <meshStandardMaterial color={platformColor} roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>

      {/* Path */}
      <instancedMesh
        ref={pathRef}
        args={[new BoxGeometry(1, 1, 1), pathMaterial, segments.length]}
        receiveShadow
        castShadow
      >
        <Edges scale={1.1} threshold={15} color={glowColor} />
      </instancedMesh>

      {/* Path Decorations */}
      {segments.map((segment, index) => (
        <group key={`decoration-${index}`} position={segment.position} rotation={segment.rotation}>
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <boxGeometry args={[segment.scale[0] * 1.1, 0.1, segment.scale[2] * 1.1]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.2} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Crystals */}
      <Crystal position={[-20, 1.5, -20]} scale={2} color="#22c55e" />
      <Crystal position={[20, 1.5, 20]} scale={2} color="#ef4444" />

      {/* Decorative Crystals */}
      {generatePath().decorations.map((dec, index) => (
        <Crystal
          key={`crystal-${index}`}
          position={[dec.position[0], dec.position[1] + 1, dec.position[2]]}
          scale={dec.scale}
          color="#60a5fa"
        />
      ))}

      {/* Game Elements */}
      <WaveManager pathPoints={pathPoints} />

      {/* Towers */}
      {placedTowers.map((tower) => (
        <Tower
          key={tower.id}
          {...tower}
          onDamageEnemy={(damage: number) => {
            // Handle damage
          }}
        />
      ))}

      <CreepManager pathPoints={pathPoints} />

      <Player />

      {/* Tower Preview */}
      {showPreview && selectedObjectType && (
        <Tower
          position={new Vector3(...previewPosition)}
          type={selectedObjectType}
          preview={true}
          canAfford={canAffordTower}
        />
      )}

      {/* Hit Testing Plane */}
      <mesh
        visible={false}
        position={[0, 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handlePlaceTower}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}