import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, Matrix4, BufferGeometry, BufferAttribute, BoxGeometry, Color, PlaneGeometry, MeshBasicMaterial, SphereGeometry, CylinderGeometry, TorusGeometry, IcosahedronGeometry, ConeGeometry, MeshStandardMaterial, DoubleSide, Group, OctahedronGeometry, DodecahedronGeometry } from 'three';
import { useGameStore } from '../store/gameStore';
import { createShaderMaterial } from '../utils/shaders';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

// Create geometries for different creep types
const CREEP_GEOMETRIES = {
  normal: (() => {
    // Forest Sprite - Tall and mystical tree creature
    const geometry = new CylinderGeometry(0.2, 0.4, 1.5, 6);
    geometry.translate(0, 0.75, 0);
    return geometry;
  })(),

  fast: (() => {
    // Wind Spirit - Light and ethereal
    const geometry = new ConeGeometry(0.3, 1.2, 5);
    geometry.translate(0, 0.6, 0);
    geometry.rotateY(Math.PI / 4);
    return geometry;
  })(),

  armored: (() => {
    // Ancient Guardian - Heavy and imposing
    const geometry = new CylinderGeometry(0.5, 0.6, 1.2, 6);
    geometry.translate(0, 0.6, 0);
    return geometry;
  })(),

  boss: (() => {
    // Dark Forest Lord - Massive and threatening
    const geometry = new CylinderGeometry(0.8, 1.0, 1.8, 8);
    geometry.translate(0, 0.9, 0);
    return geometry;
  })(),
};

// Speed multipliers for different creep types
const creepSpeeds = {
  normal: 0.8,
  fast: 1.2,
  armored: 0.6,
  boss: 0.4,
};

// Materials for different creep types
const creepMaterials = {
  normal: new MeshStandardMaterial({
    color: new Color('#2d4a1c'),  // Dark forest green
    roughness: 0.7,
    metalness: 0.2,
    flatShading: true,
  }),
  fast: new MeshStandardMaterial({
    color: new Color('#4a7c59'),  // Forest sage
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true,
  }),
  armored: new MeshStandardMaterial({
    color: new Color('#1f3d0c'),  // Deep forest
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true,
  }),
  boss: new MeshStandardMaterial({
    color: new Color('#8b0000'),  // Dark red
    roughness: 0.3,
    metalness: 0.6,
    emissive: new Color('#400000'),
    emissiveIntensity: 0.5,
    flatShading: true,
  }),
};

const tempObject = new Object3D();
const tempVector = new Vector3();
const tempMatrix = new Matrix4();

interface CreepData {
  id: number;
  position: [number, number, number];
  type: 'normal' | 'armored' | 'fast' | 'boss';
  health: number;
  maxHealth: number;
  effects: {
    [key: string]: {
      value: number;
      duration: number;
      startTime: number;
      stacks?: number;
    };
  };
}

interface CreepManagerProps {
  pathPoints: Vector3[];
}

const SPEED_MULTIPLIER = 4;

const creepSizes = {
  normal: [1.0, 1.0, 1.0],    // Infantry mech
  fast: [0.8, 0.8, 0.8],      // Stealth drone
  armored: [1.2, 1.2, 1.2],   // Battle tank
  boss: [1.8, 1.8, 1.8],      // Assault walker
};

const creepColors = {
  normal: '#2d4a1c',    // Dark forest green
  armored: '#94a3b8',   // Bright steel - stands out well
  fast: '#2dd4bf',      // Bright teal - distinctive
  boss: '#f43f5e',      // Bright rose - imposing
};

const creepRewards = {
  normal: 20,
  armored: 40,
  fast: 25,
  boss: 100,
};

const effectColors = {
  slow: '#00ffff',
  amplify: '#ffff00',
  poison: '#00ff00',
  armor_reduction: '#ff0000',
  splash: '#ff00ff',
  freeze: '#0000ff',
  fear: '#ff0000',
  burn: '#ff9900',
  thorns: '#33cc33',
  curse: '#6600cc',
  mana_burn: '#cc00cc',
  mark: '#ff00ff',
};

const creeps: CreepManagerProps[] = [];

export function CreepManager({ pathPoints }: CreepManagerProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const creepMeshes = useRef<{ [key: string]: InstancedMesh }>({});
  const creepPaths = useRef<Map<number, { pathIndex: number; progress: number }>>(new Map());
  const creeps = useGameStore(state => state.creeps);
  const removeCreep = useGameStore(state => state.removeCreep);
  const loseLife = useGameStore(state => state.loseLife);

  // Set up meshes for each creep type
  useEffect(() => {
    console.log('Setting up creep meshes');
    
    // Clean up old meshes first
    if (meshRef.current) {
      while (meshRef.current.children.length > 0) {
        meshRef.current.remove(meshRef.current.children[0]);
      }
    }

    // Create new meshes
    Object.entries(CREEP_GEOMETRIES).forEach(([type, geometry]) => {
      console.log(`Creating mesh for type: ${type}`);
      const mesh = new InstancedMesh(
        geometry,
        creepMaterials[type as keyof typeof creepMaterials],
        100 // Max instances per type
      );
      mesh.name = type; // Add name for identification
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // Ensure it's always rendered
      creepMeshes.current[type] = mesh;
      meshRef.current?.add(mesh);
    });

    return () => {
      // Cleanup meshes on unmount
      Object.values(creepMeshes.current).forEach(mesh => {
        meshRef.current?.remove(mesh);
      });
      creepMeshes.current = {};
    };
  }, [creepMaterials]);

  // Initialize new creeps
  useEffect(() => {
    creeps.forEach(creep => {
      if (!creepPaths.current.has(creep.id)) {
        console.log(`Initializing path for creep ${creep.id}`);
        creepPaths.current.set(creep.id, {
          pathIndex: 0,
          progress: 0
        });
      }
    });
  }, [creeps]);

  // Update creep instances
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Create a map to track used indices per type
    const usedIndices: { [key: string]: number } = {};

    // Update visible creeps
    creeps.forEach((creep) => {
      const mesh = creepMeshes.current[creep.type];
      if (!mesh) {
        console.warn(`No mesh found for creep type: ${creep.type}`);
        return;
      }

      // Initialize or get the index counter for this type
      if (typeof usedIndices[creep.type] === 'undefined') {
        usedIndices[creep.type] = 0;
      }
      const instanceIndex = usedIndices[creep.type]++;

      const pathState = creepPaths.current.get(creep.id);
      if (!pathState) {
        console.warn(`No path state for creep ${creep.id}`);
        return;
      }

      // Get current and next path points
      const currentPoint = pathPoints[pathState.pathIndex];
      const nextPoint = pathPoints[pathState.pathIndex + 1];

      if (currentPoint && nextPoint) {
        // Update progress along current path segment
        const speed = creepSpeeds[creep.type] || 0.1;
        pathState.progress += speed * delta;

        // Calculate position along path
        const position = new Vector3().lerpVectors(
          currentPoint,
          nextPoint,
          pathState.progress
        );

        // Calculate rotation to face movement direction
        const direction = nextPoint.clone().sub(currentPoint).normalize();
        const angle = Math.atan2(direction.x, direction.z);

        // Update instance
        tempObject.position.copy(position);
        tempObject.position.y += 0.5; // Lift slightly above ground
        tempObject.rotation.y = angle;
        tempObject.scale.set(1, 1, 1); // Ensure proper scale
        tempObject.updateMatrix();

        // Set the matrix for this instance
        mesh.setMatrixAt(instanceIndex, tempObject.matrix);
        mesh.instanceMatrix.needsUpdate = true;

        // Update creep position in store
        creep.position = [position.x, position.y, position.z];

        // Move to next path segment if needed
        if (pathState.progress >= 1) {
          pathState.pathIndex++;
          pathState.progress = 0;

          // Check if reached end of path
          if (pathState.pathIndex >= pathPoints.length - 1) {
            console.log(`Creep ${creep.id} reached end of path`);
            loseLife();
            removeCreep(creep.id);
            creepPaths.current.delete(creep.id);
          }
        }
      }
    });

    // Hide unused instances for each type
    Object.entries(creepMeshes.current).forEach(([type, mesh]) => {
      const usedCount = usedIndices[type] || 0;
      for (let i = usedCount; i < mesh.count; i++) {
        tempObject.position.set(0, -1000, 0); // Move unused instances far away
        tempObject.scale.set(0, 0, 0); // Scale to 0 to ensure they're not visible
        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group ref={meshRef}>
      {creeps.map(creep => {
        const healthPercent = creep.health / creep.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        const barWidth = 1.3;
        const barHeight = 0.2;

        return (
          <Billboard
            key={creep.id}
            position={[creep.position[0], creep.position[1] + 1.5, creep.position[2]]}
            follow={true}
            renderOrder={2}
          >
            {/* Background */}
            <mesh position={[0, 0, 0]} renderOrder={10}>
              <planeGeometry args={[barWidth, barHeight]} />
              <meshBasicMaterial 
                color="#1a1a1a" 
                transparent 
                opacity={0.8} 
                depthTest={false}
                depthWrite={false}
                side={DoubleSide}
              />
            </mesh>

            {/* Health bar */}
            <mesh 
              position={[(-barWidth * (1 - healthPercent)) / 2, 0, 0.01]} 
              renderOrder={11}
            >
              <planeGeometry args={[barWidth * healthPercent, barHeight]} />
              <meshBasicMaterial 
                color={healthColor} 
                transparent 
                opacity={0.9} 
                depthTest={false}
                depthWrite={false}
                side={DoubleSide}
              />
            </mesh>
          </Billboard>
        );
      })}
    </group>
  );
}
