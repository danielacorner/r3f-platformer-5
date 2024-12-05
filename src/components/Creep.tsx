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
    // Forest Guardian - Crystal-like structure
    const base = new CylinderGeometry(0.4, 0.8, 2.0, 6);
    base.translate(0, 1.0, 0);
    
    const top = new SphereGeometry(0.6, 8, 8);
    top.translate(0, 2.0, 0);
    
    const crystal1 = new CylinderGeometry(0.2, 0, 0.8, 4);
    crystal1.translate(0.4, 1.8, 0.4);
    
    const crystal2 = crystal1.clone();
    crystal2.translate(-0.8, 0, -0.8);
    
    return BufferGeometryUtils.mergeGeometries([base, top, crystal1, crystal2]);
  })(),
  
  fast: (() => {
    // Wind Dancer - Sleek with trailing ribbons
    const body = new CylinderGeometry(0.3, 0.6, 1.8, 5);
    body.rotateZ(Math.PI / 6);
    
    const wing1 = new BoxGeometry(1.2, 0.15, 0.4);
    wing1.translate(0.6, 0.3, 0);
    
    const wing2 = wing1.clone();
    wing2.translate(-1.2, -0.6, 0);
    
    const tail = new CylinderGeometry(0.2, 0.05, 1.2, 4);
    tail.rotateZ(-Math.PI / 3);
    tail.translate(-0.4, -0.8, 0);
    
    return BufferGeometryUtils.mergeGeometries([body, wing1, wing2, tail]);
  })(),
  
  armored: (() => {
    // War Machine - Heavy tank with details
    const body = new BoxGeometry(1.8, 1.2, 2.2);
    
    const turret = new CylinderGeometry(0.5, 0.5, 0.6, 8);
    turret.rotateX(Math.PI / 2);
    turret.translate(0, 0.6, 0);
    
    const barrel = new CylinderGeometry(0.15, 0.15, 1.2, 8);
    barrel.rotateZ(Math.PI / 2);
    barrel.translate(0.6, 0.6, 0);
    
    const armor1 = new BoxGeometry(2.0, 0.3, 0.4);
    armor1.translate(0, -0.2, 0.8);
    
    const armor2 = armor1.clone();
    armor2.translate(0, 0, -1.6);
    
    return BufferGeometryUtils.mergeGeometries([body, turret, barrel, armor1, armor2]);
  })(),
  
  boss: (() => {
    // Doom Harbinger - Complex and intimidating
    const core = new SphereGeometry(1.2, 8, 8);
    
    const crown = new CylinderGeometry(0.9, 1.2, 0.9, 6);
    crown.translate(0, 1.0, 0);
    
    const spike1 = new CylinderGeometry(0.15, 0, 0.9, 4);
    spike1.translate(0.6, 1.3, 0.6);
    
    const spike2 = spike1.clone();
    spike2.translate(-1.2, 0, -1.2);
    
    const ring1 = new TorusGeometry(1.8, 0.15, 8, 24);
    ring1.rotateX(Math.PI / 3);
    
    const ring2 = ring1.clone();
    ring2.rotateX(-Math.PI / 3);
    ring2.rotateY(Math.PI / 4);
    
    return BufferGeometryUtils.mergeGeometries([core, crown, spike1, spike2, ring1, ring2]);
  })(),
};

// Base sizes for different creep types (increased further)
const creepSizes = {
  normal: [2.0, 2.0, 2.0],    // Even larger balanced size
  fast: [1.6, 1.6, 1.6],      // Larger but still agile
  armored: [2.4, 2.4, 2.4],   // Massive tank
  boss: [3.6, 3.6, 3.6],      // Truly imposing
};

// Materials for different creep types (enhanced visibility)
const creepMaterials = {
  normal: new MeshStandardMaterial({
    color: new Color('#4CAF50'),  // Brighter forest green
    roughness: 0.6,
    metalness: 0.4,
    flatShading: true,
  }),
  fast: new MeshStandardMaterial({
    color: new Color('#00BCD4'),  // Bright cyan
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true,
  }),
  armored: new MeshStandardMaterial({
    color: new Color('#B0BEC5'),  // Brighter steel
    roughness: 0.2,
    metalness: 0.9,
    flatShading: true,
  }),
  boss: new MeshStandardMaterial({
    color: new Color('#FF5252'),  // Bright crimson
    roughness: 0.4,
    metalness: 0.8,
    emissive: new Color('#FF1744'),  // Brighter red glow
    emissiveIntensity: 0.5,
    flatShading: true,
  }),
};

// Speed multipliers remain the same as they're already fast
const creepSpeeds = {
  normal: 0.3,
  fast: 0.45,
  armored: 0.225,
  boss: 0.15,
};

// Rewards for killing creeps
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

const creeps: any[] = [];

export function CreepManager({ pathPoints }: any) {
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
        const speed = creepSpeeds[creep.type] * 1 || 0.1;
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
        const tempObject = new Object3D();
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
        const tempObject2 = new Object3D();
        tempObject2.position.set(position.x, position.y + 1.5, position.z);
        tempObject2.quaternion.copy(cameraQuaternion);
        tempObject2.scale.set(barWidth, barHeight, 1);
        tempObject2.updateMatrix();
        healthBarBackgroundRef.current.setMatrixAt(index, tempObject2.matrix);

        // Update foreground (health) bar
        const healthBarWidth = barWidth * healthPercent;
        const healthBarX = position.x + (-barWidth * (1 - healthPercent)) / 2;
        const tempObject3 = new Object3D();
        tempObject3.position.set(healthBarX, position.y + 1.5, position.z + 0.01);
        tempObject3.quaternion.copy(cameraQuaternion);
        tempObject3.scale.set(healthBarWidth, barHeight, 1);
        tempObject3.updateMatrix();
        healthBarForegroundRef.current.setMatrixAt(index, tempObject3.matrix);
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
      const tempObject4 = new Object3D();
      tempObject4.position.set(0, -1000, 0);
      tempObject4.scale.set(0, 0, 0);
      tempObject4.updateMatrix();
      healthBarBackgroundRef.current.setMatrixAt(i, tempObject4.matrix);
      healthBarForegroundRef.current.setMatrixAt(i, tempObject4.matrix);
    }

    // Hide unused creep instances
    Object.entries(creepMeshes.current).forEach(([type, mesh]) => {
      const usedCount = usedIndices[type] || 0;
      for (let i = usedCount; i < mesh.count; i++) {
        const tempObject5 = new Object3D();
        tempObject5.position.set(0, -1000, 0);
        tempObject5.scale.set(0, 0, 0);
        tempObject5.updateMatrix();
        mesh.setMatrixAt(i, tempObject5.matrix);
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
