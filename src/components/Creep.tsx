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
  normal: 0.2,
  fast: 0.3,
  armored: 0.15,
  boss: 0.1,
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

const SPEED_MULTIPLIER = 1;

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
  const healthBarBackgroundRef = useRef<InstancedMesh>(null);
  const healthBarForegroundRef = useRef<InstancedMesh>(null);
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
  }, []);

  // Set up health bar meshes
  useEffect(() => {
    // Create health bar geometries
    const barGeometry = new PlaneGeometry(1, 1);

    // Create background bar mesh
    const backgroundMesh = new InstancedMesh(
      barGeometry,
      new MeshBasicMaterial({
        color: "#1a1a1a",
        transparent: true,
        opacity: 0.8,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
      }),
      100
    );
    backgroundMesh.renderOrder = 10;
    healthBarBackgroundRef.current = backgroundMesh;

    // Create foreground bar mesh
    const foregroundMesh = new InstancedMesh(
      barGeometry,
      new MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
      }),
      100
    );
    foregroundMesh.renderOrder = 11;
    healthBarForegroundRef.current = foregroundMesh;

    return () => {
      barGeometry.dispose();
    };
  }, []);

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

  // Update creep instances and health bars
  useFrame((state, delta) => {
    if (!meshRef.current || !healthBarBackgroundRef.current || !healthBarForegroundRef.current) return;

    // Get camera quaternion for billboard effect
    const cameraQuaternion = state.camera.quaternion;

    // Create a map to track used indices per type
    const usedIndices: { [key: string]: number } = {};

    // Update visible creeps
    creeps.forEach((creep, index) => {
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
        const speed = creepSpeeds[creep.type] * SPEED_MULTIPLIER || 0.1;
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

        // Update creep instance
        tempObject.position.copy(position);
        tempObject.position.y += 0.5;
        tempObject.rotation.y = angle;
        tempObject.updateMatrix();
        mesh.setMatrixAt(instanceIndex, tempObject.matrix);
        mesh.instanceMatrix.needsUpdate = true;

        // Update creep position in store
        creep.position = [position.x, position.y, position.z];

        // Update health bars
        const healthPercent = creep.health / creep.maxHealth;
        const barWidth = 1.3;
        const barHeight = 0.2;
        const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';

        // Update background bar
        tempObject.position.set(position.x, position.y + 1.5, position.z);
        tempObject.quaternion.copy(cameraQuaternion);
        tempObject.scale.set(barWidth, barHeight, 1);
        tempObject.updateMatrix();
        healthBarBackgroundRef.current.setMatrixAt(index, tempObject.matrix);

        // Update foreground (health) bar
        const healthBarWidth = barWidth * healthPercent;
        const healthBarX = position.x + (-barWidth * (1 - healthPercent)) / 2;
        tempObject.position.set(healthBarX, position.y + 1.5, position.z + 0.01);
        tempObject.quaternion.copy(cameraQuaternion);
        tempObject.scale.set(healthBarWidth, barHeight, 1);
        tempObject.updateMatrix();
        healthBarForegroundRef.current.setMatrixAt(index, tempObject.matrix);
        (healthBarForegroundRef.current.material as MeshBasicMaterial).color.set(healthColor);

        // Move to next path segment if needed
        if (pathState.progress >= 1) {
          pathState.pathIndex++;
          pathState.progress = 0;

          if (pathState.pathIndex >= pathPoints.length - 1) {
            console.log(`Creep ${creep.id} reached end of path`);
            loseLife();
            removeCreep(creep.id);
            creepPaths.current.delete(creep.id);
          }
        }
      }
    });

    // Update instance matrices
    healthBarBackgroundRef.current.instanceMatrix.needsUpdate = true;
    healthBarForegroundRef.current.instanceMatrix.needsUpdate = true;

    // Hide unused instances
    for (let i = creeps.length; i < 100; i++) {
      tempObject.position.set(0, -1000, 0);
      tempObject.scale.set(0, 0, 0);
      tempObject.updateMatrix();
      healthBarBackgroundRef.current.setMatrixAt(i, tempObject.matrix);
      healthBarForegroundRef.current.setMatrixAt(i, tempObject.matrix);
    }

    // Hide unused creep instances
    Object.entries(creepMeshes.current).forEach(([type, mesh]) => {
      const usedCount = usedIndices[type] || 0;
      for (let i = usedCount; i < mesh.count; i++) {
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      <group ref={meshRef} />
      <instancedMesh 
        ref={healthBarBackgroundRef}
        args={[new PlaneGeometry(1, 1), new MeshBasicMaterial({
          color: "#1a1a1a",
          transparent: true,
          opacity: 0.8,
          depthTest: false,
          depthWrite: false,
          side: DoubleSide,
        }), 100]}
        renderOrder={10}
        />
      <instancedMesh
        ref={healthBarForegroundRef}
        args={[new PlaneGeometry(1, 1), new MeshBasicMaterial({
          color: "#22c55e",
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false,
          side: DoubleSide,
        }), 100]}
        renderOrder={11}
        />
    </group>
  );
}
