import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, Matrix4, BufferGeometry, BufferAttribute, BoxGeometry, Color, PlaneGeometry, MeshBasicMaterial, SphereGeometry, CylinderGeometry, TorusGeometry, IcosahedronGeometry } from 'three';
import { useGameStore } from '../store/gameStore';
import { createShaderMaterial } from '../utils/shaders';

// Enhanced geometries for different creep types
const CREEP_GEOMETRIES = {
  normal: new IcosahedronGeometry(0.4, 1), // Spiky crystal-like shape
  fast: new CylinderGeometry(0.1, 0.3, 0.8, 6), // Sleek arrow-like shape
  armored: (() => {
    // Combine geometries for armored unit
    const base = new BoxGeometry(0.6, 0.6, 0.6);
    const top = new CylinderGeometry(0.2, 0.3, 0.3, 6);
    const vertices = [...base.attributes.position.array];
    const topVertices = [...top.attributes.position.array];

    // Adjust top position
    for (let i = 0; i < topVertices.length; i += 3) {
      topVertices[i + 1] += 0.45; // Move up
    }

    // Combine vertices
    const positions = new Float32Array([...vertices, ...topVertices]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  })(),
  boss: new TorusGeometry(0.5, 0.3, 8, 6) // Intimidating ring shape
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

const creepSpeeds = {
  normal: 0.1,
  fast: 0.15,
  armored: 0.08,
  boss: 0.06
};

const SPEED_MULTIPLIER = 4;

const creepSizes = {
  normal: [0.8, 0.8, 0.8],
  armored: [1, 1, 1],
  fast: [0.6, 0.6, 0.6],
  boss: [1.5, 1.5, 1.5],
};

const creepColors = {
  normal: '#ef4444',
  armored: '#6b7280',
  fast: '#22c55e',
  boss: '#8b5cf6',
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
  const instancedMesh = useRef<InstancedMesh>();
  const activeCreeps = useRef<Map<number, {
    props: CreepManagerProps;
    instanceId: number;
    pathIndex: number;
    progress: number;
  }>>(new Map());
  const { removeCreep, loseLife } = useGameStore();
  const creeps = useGameStore(state => state.creeps);

  // Create material with custom shader
  const material = useMemo(() => {
    const mat = createShaderMaterial('creep', {
      time: { value: 0 },
      color: { value: new Vector3(1, 0, 0) },
      emissive: { value: new Vector3(0.2, 0, 0) },
      roughness: { value: 0.4 },
      metalness: { value: 0.6 }
    });
    mat.defines = {
      USE_INSTANCING: ''
    };
    return mat;
  }, []);

  // Create geometry with instance attributes
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(0.8, 0.8, 0.8);
    const maxInstances = 1000;

    // Create instance attributes
    const colors = new Float32Array(maxInstances * 3);
    const healths = new Float32Array(maxInstances);
    const scales = new Float32Array(maxInstances);

    // Initialize all instances as hidden
    for (let i = 0; i < maxInstances; i++) {
      colors[i * 3] = 1;     // R
      colors[i * 3 + 1] = 0; // G
      colors[i * 3 + 2] = 0; // B
      healths[i] = 1;
      scales[i] = 0; // Hidden by default
    }

    geo.setAttribute('instanceColor', new BufferAttribute(colors, 3));
    geo.setAttribute('instanceHealth', new BufferAttribute(healths, 1));
    geo.setAttribute('instanceScale', new BufferAttribute(scales, 1));

    return geo;
  }, []);

  // Initialize instance matrices
  useEffect(() => {
    if (!instancedMesh.current) return;
    console.log('Initializing instance matrices');

    // Set initial transforms
    const matrix = new Matrix4();
    for (let i = 0; i < 1000; i++) {
      matrix.makeTranslation(0, -1000, 0); // Move unused instances far away
      instancedMesh.current.setMatrixAt(i, matrix);
    }
    instancedMesh.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Update creep positions and attributes
  useFrame((state, delta) => {
    if (!instancedMesh.current) return;

    // Update shader time
    if (material.uniforms) {
      material.uniforms.time.value += delta;
    }

    let needsMatrixUpdate = false;
    let needsAttributeUpdate = false;

    // Update existing creeps
    activeCreeps.current.forEach((creepState, creepId) => {
      const { instanceId, pathIndex, progress } = creepState;
      const creepData = creeps.find(c => c.id === creepId);

      if (!creepData) return;

      const { type, health, maxHealth } = creepData;
      const speed = (creepSpeeds[type] || 0.1) * SPEED_MULTIPLIER;

      // Get current and next path points
      const currentPoint = pathPoints[pathIndex];
      const nextPoint = pathPoints[pathIndex + 1];

      if (currentPoint && nextPoint) {
        // Update progress along current path segment
        creepState.progress += speed * delta;

        // Move to next segment if we've completed this one
        if (creepState.progress >= 1) {
          creepState.pathIndex++;
          creepState.progress = 0;

          // Check if we've reached the end
          if (creepState.pathIndex >= pathPoints.length - 1) {
            console.log(`Creep ${creepId} reached the end`);
            loseLife();
            removeCreep(creepId);

            // Hide the instance
            tempObject.position.set(0, -1000, 0);
            tempObject.scale.set(0, 0, 0);
            tempObject.updateMatrix();
            instancedMesh.current.setMatrixAt(instanceId, tempObject.matrix);
            needsMatrixUpdate = true;

            // Reset instance attributes
            const colorAttr = instancedMesh.current.geometry.getAttribute('instanceColor');
            const healthAttr = instancedMesh.current.geometry.getAttribute('instanceHealth');
            const scaleAttr = instancedMesh.current.geometry.getAttribute('instanceScale');

            if (colorAttr && healthAttr && scaleAttr) {
              const baseIndex = instanceId * 3;
              (colorAttr.array as Float32Array)[baseIndex] = 1;
              (colorAttr.array as Float32Array)[baseIndex + 1] = 0;
              (colorAttr.array as Float32Array)[baseIndex + 2] = 0;
              (healthAttr.array as Float32Array)[instanceId] = 1;
              (scaleAttr.array as Float32Array)[instanceId] = 0;

              colorAttr.needsUpdate = true;
              healthAttr.needsUpdate = true;
              scaleAttr.needsUpdate = true;
              needsAttributeUpdate = true;
            }

            activeCreeps.current.delete(creepId);
            return;
          }
        }

        // Interpolate position
        tempVector.lerpVectors(currentPoint, nextPoint, creepState.progress);
        tempVector.y = 1;

        // Update instance transform
        tempObject.position.copy(tempVector);

        // Calculate rotation to face movement direction
        const direction = nextPoint.clone().sub(currentPoint).normalize();
        tempObject.lookAt(nextPoint);

        // Apply size
        const size = creepSizes[type][0];
        tempObject.scale.set(size, size, size);

        tempObject.updateMatrix();
        instancedMesh.current.setMatrixAt(instanceId, tempObject.matrix);
        needsMatrixUpdate = true;

        // Update instance attributes
        const colorAttr = instancedMesh.current.geometry.getAttribute('instanceColor');
        const healthAttr = instancedMesh.current.geometry.getAttribute('instanceHealth');
        const scaleAttr = instancedMesh.current.geometry.getAttribute('instanceScale');

        if (colorAttr && healthAttr && scaleAttr) {
          const color = new Color(creepColors[type]);
          const baseIndex = instanceId * 3;
          (colorAttr.array as Float32Array)[baseIndex] = color.r;
          (colorAttr.array as Float32Array)[baseIndex + 1] = color.g;
          (colorAttr.array as Float32Array)[baseIndex + 2] = color.b;
          (healthAttr.array as Float32Array)[instanceId] = health / maxHealth;
          (scaleAttr.array as Float32Array)[instanceId] = size;

          colorAttr.needsUpdate = true;
          healthAttr.needsUpdate = true;
          scaleAttr.needsUpdate = true;
          needsAttributeUpdate = true;
        }
      }
    });

    // Only update if needed
    if (needsMatrixUpdate) {
      instancedMesh.current.instanceMatrix.needsUpdate = true;
    }
    if (needsAttributeUpdate) {
      instancedMesh.current.geometry.attributes.instanceColor.needsUpdate = true;
      instancedMesh.current.geometry.attributes.instanceHealth.needsUpdate = true;
      instancedMesh.current.geometry.attributes.instanceScale.needsUpdate = true;
    }
  });

  // Handle creep lifecycle
  useEffect(() => {
    console.log('Creeps updated:', creeps.length);
    if (!instancedMesh.current) return;

    // Add new creeps
    creeps.forEach(creepData => {
      if (!activeCreeps.current.has(creepData.id)) {
        // Find first available instance slot
        let instanceId = 0;
        while (instanceId < 1000) {
          if (![...activeCreeps.current.values()].some(c => c.instanceId === instanceId)) {
            break;
          }
          instanceId++;
        }

        if (instanceId < 1000) {
          console.log(`Adding creep ${creepData.id} at instance ${instanceId}`);
          activeCreeps.current.set(creepData.id, {
            props: { pathPoints },
            instanceId,
            pathIndex: 0,
            progress: 0
          });

          // Set initial position
          if (pathPoints.length > 0) {
            const startPos = pathPoints[0];
            tempObject.position.copy(startPos);
            const size = creepSizes[creepData.type][0];
            tempObject.scale.set(size, size, size);
            tempObject.updateMatrix();
            instancedMesh.current.setMatrixAt(instanceId, tempObject.matrix);
            instancedMesh.current.instanceMatrix.needsUpdate = true;

            // Set initial attributes
            const colorAttr = instancedMesh.current.geometry.getAttribute('instanceColor');
            const healthAttr = instancedMesh.current.geometry.getAttribute('instanceHealth');
            const scaleAttr = instancedMesh.current.geometry.getAttribute('instanceScale');

            if (colorAttr && healthAttr && scaleAttr) {
              const color = new Color(creepColors[creepData.type]);
              const baseIndex = instanceId * 3;
              (colorAttr.array as Float32Array)[baseIndex] = color.r;
              (colorAttr.array as Float32Array)[baseIndex + 1] = color.g;
              (colorAttr.array as Float32Array)[baseIndex + 2] = color.b;
              (healthAttr.array as Float32Array)[instanceId] = 1;
              (scaleAttr.array as Float32Array)[instanceId] = size;

              colorAttr.needsUpdate = true;
              healthAttr.needsUpdate = true;
              scaleAttr.needsUpdate = true;
            }
          }
        } else {
          console.warn('No available instance slots for new creep');
        }
      }
    });

    // Remove dead creeps
    activeCreeps.current.forEach((creepState, creepId) => {
      if (!creeps.find(c => c.id === creepId)) {
        console.log(`Removing creep ${creepId}`);

        // Hide the instance
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        instancedMesh.current.setMatrixAt(creepState.instanceId, tempObject.matrix);
        instancedMesh.current.instanceMatrix.needsUpdate = true;

        // Reset attributes
        const colorAttr = instancedMesh.current.geometry.getAttribute('instanceColor');
        const healthAttr = instancedMesh.current.geometry.getAttribute('instanceHealth');
        const scaleAttr = instancedMesh.current.geometry.getAttribute('instanceScale');

        if (colorAttr && healthAttr && scaleAttr) {
          const baseIndex = creepState.instanceId * 3;
          (colorAttr.array as Float32Array)[baseIndex] = 1;
          (colorAttr.array as Float32Array)[baseIndex + 1] = 0;
          (colorAttr.array as Float32Array)[baseIndex + 2] = 0;
          (healthAttr.array as Float32Array)[creepState.instanceId] = 1;
          (scaleAttr.array as Float32Array)[creepState.instanceId] = 0;

          colorAttr.needsUpdate = true;
          healthAttr.needsUpdate = true;
          scaleAttr.needsUpdate = true;
        }

        activeCreeps.current.delete(creepId);
      }
    });
  }, [creeps]);

  return (
    <group>
      <instancedMesh
        ref={instancedMesh}
        args={[geometry, material, 1000]}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
      />
      {/* Enhanced Health bars */}
      {creeps.map((creep) => {
        const creepData = activeCreeps.current.get(creep.id);
        if (!creepData) return null;
        const position = tempObject.position.clone();
        position.y += 1.5; // Position higher above creep

        const healthPercent = creep.health / creep.maxHealth;
        const barWidth = 1.2; // Wider bar
        const barHeight = 0.15; // Taller bar

        return (
          <group key={creep.id} position={position.toArray()}>
            {/* Health bar background with border */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[barWidth + 0.1, barHeight + 0.1]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.8} />
            </mesh>
            {/* Health bar background */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[barWidth, barHeight]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
            </mesh>
            {/* Health bar fill with gradient */}
            <mesh
              position={[-barWidth / 2 + (barWidth / 2 * healthPercent), 0, 0.02]}
              scale={[healthPercent, 1, 1]}
            >
              <planeGeometry args={[barWidth, barHeight]} />
              <meshBasicMaterial
                color={healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444'}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
