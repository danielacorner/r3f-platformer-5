import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, useGLTF, Stars, Float, useTexture } from '@react-three/drei';
import { Vector3, Raycaster, Color, DoubleSide, Plane, Vector2, InstancedMesh, Object3D, Matrix4, BoxGeometry, Mesh, Euler, Float32BufferAttribute } from 'three';
import { TOWER_STATS, useGameStore } from '../../../store/gameStore';
import { Edges, MeshTransmissionMaterial, Float as FloatDrei } from '@react-three/drei';
import { WaveManager } from '../../WaveManager';
import { Tower } from '../../Tower';
import { createShaderMaterial } from '../../../utils/shaders';
import { ObjectPool } from '../../../utils/objectPool';
import { CreepManager } from '../../Creep';
import { Player } from '../../Player';
import { ClickIndicator } from '../../ClickIndicator';
import { TowerConfirmation } from '../../TowerConfirmation';
import { TreeInstances } from './TreeInstances';
import { glowColor, grassColor, platformColor } from '../../../utils/constants';
import { MushroomInstances } from './MushroomInstances';
import { generatePath, PathDecorations } from './PathDecoration';
import { FirefliesInstances } from './FirefliesInstances';

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

function RockInstances({ count = 30, radius = 20 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius + (Math.random() * 10);
      const z = Math.cos(angle) * radius + (Math.random() * 10);
      const scale = 0.5 + Math.random() * 1;
      const rotation = Math.random() * Math.PI * 2;

      tempObject.position.set(x, 0, z);
      tempObject.scale.set(scale, scale, scale);
      tempObject.rotation.y = rotation;
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, radius]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} /> {/* Reduced detail level */}
      <meshStandardMaterial color="#64748b" roughness={0.6} />
    </instancedMesh>
  );
}

function GrassInstances({ count = 100 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 50 - 25;
      const z = Math.random() * 50 - 25;
      const scale = 0.8 + Math.random() * 0.4;
      const rotation = Math.random() * Math.PI * 2;

      tempObject.position.set(x, 0, z);
      tempObject.scale.set(scale, scale, scale);
      tempObject.rotation.y = rotation;
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.3, 0.5]} />
      <meshStandardMaterial
        color={grassColor}
        roughness={0.8}
        transparent
        opacity={0.9}
        side={DoubleSide}
      />
    </instancedMesh>
  );
}

function CrystalInstances({ count = 8, radius = 15 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => ['#60a5fa', '#34d399', '#fbbf24', '#f87171'], []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = 3 + Math.random() * 2;
      const z = Math.cos(angle) * radius;
      const scale = 0.8 + Math.random() * 0.4;

      tempObject.position.set(x, y, z);
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, radius]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial
        color={colors[0]}
        emissive={colors[0]}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}

// Optimized Crystal Component for special locations
function OptimizedCrystal({ position, scale = 1, color = '#60a5fa' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const meshRef = useRef<Mesh>(null);
  const crystalColor = new Color(color).convertSRGBToLinear();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale} castShadow>
        <octahedronGeometry args={[1]} />
        <meshStandardMaterial
          color={crystalColor}
          emissive={crystalColor}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight intensity={1} distance={5} color={color} />
    </Float>
  );
}

export function Level() {
  // Game State
  const {
    phase,
    placedTowers,
    money,
    creeps,
    addPlacedTower,
    setSelectedObjectType, 
    selectedObjectType, 
    selectedObjectLevel,
    updateCreep,
    damageCreep,
  } = useGameStore();

  const { wave, currentLevel } = useGameStore();
  const { highlightedPathSegment } = useGameStore();

  // Refs and State
  const pathRef = useRef<InstancedMesh>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [pendingTowerPosition, setPendingTowerPosition] = useState<[number, number, number] | null>(null);
  const [canAffordTower, setCanAffordTower] = useState(true);
  const groundRef = useRef(null);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [clickCounter, setClickCounter] = useState(0); // Add counter for key prop
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const planeIntersectPoint = useMemo(() => new Vector3(), []);
  const moveTargetRef = useRef({ x: 0, z: 0, active: false });

  // Track dragging state
  const isDragging = useRef(false);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5; // pixels

  // Handle click events
  const handleClick = (event: any) => {
    // Don't handle clicks if:
    // 1. We're in tower placement mode
    // 2. We're dragging/have dragged
    if (selectedObjectType || isDragging.current) return;

    // Convert mouse position to normalized device coordinates
    const mouse = new Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Calculate intersection with ground plane
    if (raycaster.ray.intersectPlane(groundPlane, planeIntersectPoint)) {
      // Update click position for visual indicator
      setClickPosition(planeIntersectPoint.clone());
      setClickCounter(prev => prev + 1);

      // Update move target
      moveTargetRef.current = {
        x: planeIntersectPoint.x,
        z: planeIntersectPoint.z,
        active: true
      };
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragStartPosition.current) return;

    const dx = e.clientX - dragStartPosition.current.x;
    const dy = e.clientY - dragStartPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > DRAG_THRESHOLD) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = () => {
    // Reset drag tracking
    dragStartPosition.current = null;
    // Keep isDragging true until next pointerdown
  };

  // Add event listeners
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => handleClick(e);
    const pointerDownHandler = (e: PointerEvent) => handlePointerDown(e);
    const pointerMoveHandler = (e: PointerEvent) => handlePointerMove(e);
    const pointerUpHandler = (e: PointerEvent) => handlePointerUp();

    window.addEventListener('click', clickHandler);
    window.addEventListener('pointerdown', pointerDownHandler);
    window.addEventListener('pointermove', pointerMoveHandler);
    window.addEventListener('pointerup', pointerUpHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
      window.removeEventListener('pointerdown', pointerDownHandler);
      window.removeEventListener('pointermove', pointerMoveHandler);
      window.removeEventListener('pointerup', pointerUpHandler);
    };
  }, [selectedObjectType]);

  // Path Generation
  const { segments, points: pathPoints } = useMemo(() => generatePath(), []);

  // Tower Placement Logic
  const handleTowerPointerMove = (event: any) => {
    if (!selectedObjectType || pendingTowerPosition) return;

    // Snap to grid
    const snappedPosition: [number, number, number] = [
      Math.round(event.point.x),
      0.5,
      Math.round(event.point.z)
    ];

    setPreviewPosition(snappedPosition);
    setShowPreview(true);
    setCanAffordTower(money >= (TOWER_STATS[selectedObjectType]?.cost ?? 0));
  };

  const handlePlaceTower = (event: any) => {
    event.stopPropagation();
    
    if (selectedObjectType && event.point) {
      // Snap to grid
      const snappedPosition = new Vector3(
        Math.round(event.point.x),
        0,
        Math.round(event.point.z)
      );

      // Check if position is already occupied
      const isOccupied = placedTowers.some(tower => {
        const towerPos = tower.position instanceof Vector3 
          ? tower.position 
          : new Vector3(...tower.position);
        return towerPos.distanceTo(snappedPosition) < 0.1;
      });

      if (!isOccupied) {
        const stats = TOWER_STATS[selectedObjectType];
        if (money >= stats.cost) {
          addPlacedTower({
            id: Date.now(),
            position: snappedPosition.toArray(),
            type: selectedObjectType,
            level: selectedObjectLevel,
          });
          setSelectedObjectType(null);
        }
      }
    }
  };

  const handleConfirmTower = () => {
    if (pendingTowerPosition && selectedObjectType) {
      addPlacedTower(pendingTowerPosition, selectedObjectType, selectedObjectLevel);
      setSelectedObjectType(null);
      setPendingTowerPosition(null);
    }
  };

  const handleCancelTower = () => {
    setPendingTowerPosition(null);
    // setSelectedObjectType(null);
  };

  const handleTowerPreview = (event: any) => {
    event.stopPropagation();
    
    if (selectedObjectType && event.point) {
      // Snap preview position to grid
      const snappedPosition = new Vector3(
        Math.round(event.point.x),
        0,
        Math.round(event.point.z)
      );

      // Check if position is already occupied
      const isOccupied = placedTowers.some(tower => {
        const towerPos = tower.position instanceof Vector3 
          ? tower.position 
          : new Vector3(...tower.position);
        return towerPos.distanceTo(snappedPosition) < 0.1;
      });

      if (!isOccupied) {
        setPreviewPosition(snappedPosition);
      }
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

      {/* Ground with event handlers */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[0, -0.5, 0]}
          receiveShadow
          onPointerMove={handleTowerPointerMove}
          onClick={handlePlaceTower}
        >
          <boxGeometry args={[60, 1, 60]} />
          <meshStandardMaterial
            color={platformColor}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      </RigidBody>

      {/* Sky and Atmosphere */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Decorative Elements - Using Instanced Meshes */}
      <TreeInstances count={15} radius={25} />
      <RockInstances count={30} radius={20} />
      <CrystalInstances count={8} radius={15} />
      <MushroomInstances count={16} radius={18} />
      <FirefliesInstances count={24}/>
      <GrassInstances count={100} />

      {/* Special Crystals */}
      <OptimizedCrystal position={[-20, 1.5, -20]} scale={2} color="#22c55e" />
      <OptimizedCrystal position={[20, 1.5, 20]} scale={2} color="#ef4444" />

      {/* Path Decoration Crystals */}
      <PathDecorations pathPoints={pathPoints} />

      {/* Path segments */}
      {segments.map((segment, index) => (
        <group key={`decoration-${index}`} position={segment.position} rotation={segment.rotation}>
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <boxGeometry args={[segment.scale[0] * 1.1, 0.1, segment.scale[2] * 1.1]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.2} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Highlighted path segment */}
      {highlightedPathSegment && (
        <group
          position={highlightedPathSegment.position}
          rotation={highlightedPathSegment.rotation}
        >
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[highlightedPathSegment.scale[0], 0.1, highlightedPathSegment.scale[2]]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[highlightedPathSegment.scale[0], 0.05, highlightedPathSegment.scale[2]]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.2} />
          </mesh>
        </group>
      )}

      {/* Game Elements */}
      <WaveManager pathPoints={pathPoints} />

      {/* Towers */}
      {placedTowers.map((tower) => (
        <Tower
          key={tower.id}
          {...tower}
          onDamageEnemy={(creepId: number, damage: number, effects: any) => {
            // Apply damage to the creep
            damageCreep(creepId, damage);

            // Find the creep and apply effects
            const creep = creeps.find(c => c.id === creepId);
            if (creep && creep.health > 0) {
              const updatedCreep = {
                ...creep,
                effects: {
                  ...creep.effects,
                  ...effects
                }
              };
              updateCreep(updatedCreep);
            }
          }}
        />
      ))}

      <CreepManager pathPoints={pathPoints} />

      <Player moveTargetRef={moveTargetRef} />

      {/* Click indicator */}
      {clickPosition && (
        <ClickIndicator
          key={clickCounter} // Add key prop to force remount
          position={clickPosition}
          onComplete={() => setClickPosition(null)}
        />
      )}

      {/* Tower preview and confirmation */}
      {showPreview && selectedObjectType && (
        <Tower
          position={previewPosition}
          type={selectedObjectType}
          level={selectedObjectLevel}
          preview={true}
          canAfford={canAffordTower}
        />
      )}
      {pendingTowerPosition && (
        <TowerConfirmation
          position={pendingTowerPosition}
          onConfirm={handleConfirmTower}
          onCancel={handleCancelTower}
          camera={camera}
        />
      )}
    </group>
  );
}