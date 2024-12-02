import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, Matrix4, BufferGeometry, BufferAttribute, BoxGeometry, Color, PlaneGeometry, MeshBasicMaterial, SphereGeometry, CylinderGeometry, TorusGeometry, IcosahedronGeometry, ConeGeometry, MeshStandardMaterial, DoubleSide } from 'three';
import { useGameStore } from '../store/gameStore';
import { createShaderMaterial } from '../utils/shaders';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three'
// Realistic geometries for different creep types
const CREEP_GEOMETRIES = {
  normal: (() => {
    // Infantry mech unit
    const torso = new BoxGeometry(0.4, 0.3, 0.3);        // Main body
    const waist = new CylinderGeometry(0.15, 0.2, 0.15, 8); // Connection piece
    const legs = new CylinderGeometry(0.1, 0.15, 0.4, 8);   // Leg structure
    const head = new BoxGeometry(0.2, 0.2, 0.2);         // Head unit
    const shoulder = new BoxGeometry(0.5, 0.15, 0.2);    // Shoulder piece

    const vertices = [...torso.attributes.position.array];
    const waistVertices = [...waist.attributes.position.array];
    const legVertices = [...legs.attributes.position.array];
    const headVertices = [...head.attributes.position.array];
    const shoulderVertices = [...shoulder.attributes.position.array];

    // Position components
    for (let i = 0; i < waistVertices.length; i += 3) {
      waistVertices[i + 1] -= 0.2;  // Lower waist
    }
    for (let i = 0; i < legVertices.length; i += 3) {
      legVertices[i + 1] -= 0.4;  // Position legs
    }
    for (let i = 0; i < headVertices.length; i += 3) {
      headVertices[i + 1] += 0.25;  // Raise head
    }
    for (let i = 0; i < shoulderVertices.length; i += 3) {
      shoulderVertices[i + 1] += 0.1;  // Position shoulders
    }

    const positions = new Float32Array([
      ...vertices,
      ...waistVertices,
      ...legVertices,
      ...headVertices,
      ...shoulderVertices
    ]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  })(),

  fast: (() => {
    // Stealth drone unit
    const body = new CylinderGeometry(0.2, 0.4, 0.15, 8);     // Low-profile body
    const wings = new BoxGeometry(1.0, 0.05, 0.4);           // Swept wings
    const engines = new CylinderGeometry(0.08, 0.1, 0.3, 8);  // Engine nacelles
    const nose = new ConeGeometry(0.15, 0.3, 8);             // Pointed nose

    const vertices = [...body.attributes.position.array];
    const wingsVertices = [...wings.attributes.position.array];
    const engineVertices = [...engines.attributes.position.array];
    const noseVertices = [...nose.attributes.position.array];

    // Position wings at angle
    for (let i = 0; i < wingsVertices.length; i += 3) {
      wingsVertices[i + 2] -= 0.2;  // Sweep back
      wingsVertices[i + 1] *= 0.8;  // Angle down slightly
    }

    // Add engines under wings
    let allEngineVertices = [];
    for (let side = -1; side <= 1; side += 2) {
      const enginePos = [...engineVertices];
      for (let i = 0; i < enginePos.length; i += 3) {
        enginePos[i] += side * 0.3;     // Position on wing
        enginePos[i + 1] -= 0.1;        // Lower slightly
        enginePos[i + 2] -= 0.1;        // Move back
      }
      allEngineVertices.push(...enginePos);
    }

    // Position nose
    for (let i = 0; i < noseVertices.length; i += 3) {
      noseVertices[i + 2] += 0.2;  // Extend forward
    }

    const positions = new Float32Array([
      ...vertices,
      ...wingsVertices,
      ...allEngineVertices,
      ...noseVertices
    ]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  })(),

  armored: (() => {
    // Heavy battle tank
    const hull = new BoxGeometry(0.9, 0.3, 1.2);          // Main hull
    const turret = new CylinderGeometry(0.35, 0.4, 0.25, 8); // Rotating turret
    const barrel = new CylinderGeometry(0.08, 0.1, 0.6, 8);  // Main gun
    const tracks = new BoxGeometry(0.2, 0.15, 1.3);        // Tank tracks
    const armor = new BoxGeometry(1.0, 0.35, 0.15);        // Front armor plate

    const vertices = [...hull.attributes.position.array];
    const turretVertices = [...turret.attributes.position.array];
    const barrelVertices = [...barrel.attributes.position.array];
    const trackVertices = [...tracks.attributes.position.array];
    const armorVertices = [...armor.attributes.position.array];

    // Position components
    for (let i = 0; i < turretVertices.length; i += 3) {
      turretVertices[i + 1] += 0.3;   // Place turret on hull
    }
    for (let i = 0; i < barrelVertices.length; i += 3) {
      barrelVertices[i + 1] += 0.3;   // Align with turret
      barrelVertices[i + 2] += 0.4;   // Extend forward
    }

    // Add tracks on both sides
    let allTrackVertices = [];
    for (let side = -1; side <= 1; side += 2) {
      const trackPos = [...trackVertices];
      for (let i = 0; i < trackPos.length; i += 3) {
        trackPos[i] += side * 0.35;    // Position on sides
        trackPos[i + 1] -= 0.1;        // Lower slightly
      }
      allTrackVertices.push(...trackPos);
    }

    // Position front armor
    for (let i = 0; i < armorVertices.length; i += 3) {
      armorVertices[i + 2] += 0.6;     // Move to front
      armorVertices[i + 1] += 0.1;     // Raise slightly
    }

    const positions = new Float32Array([
      ...vertices,
      ...turretVertices,
      ...barrelVertices,
      ...allTrackVertices,
      ...armorVertices
    ]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  })(),

  boss: (() => {
    // Heavy assault walker
    const body = new BoxGeometry(1.2, 0.6, 1.0);           // Main body
    const cockpit = new BoxGeometry(0.6, 0.4, 0.5);        // Cockpit section
    const legs = new CylinderGeometry(0.15, 0.2, 0.8, 8);  // Walker legs
    const weapons = new BoxGeometry(0.3, 0.2, 0.7);        // Weapon pods
    const armor = new BoxGeometry(1.4, 0.7, 0.2);          // Heavy armor plates

    const vertices = [...body.attributes.position.array];
    const cockpitVertices = [...cockpit.attributes.position.array];
    const legVertices = [...legs.attributes.position.array];
    const weaponVertices = [...weapons.attributes.position.array];
    const armorVertices = [...armor.attributes.position.array];

    // Position cockpit
    for (let i = 0; i < cockpitVertices.length; i += 3) {
      cockpitVertices[i + 1] += 0.5;   // Raise up
      cockpitVertices[i + 2] += 0.2;   // Move forward
    }

    // Add four legs
    let allLegVertices = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const legPos = [...legVertices];
        for (let i = 0; i < legPos.length; i += 3) {
          legPos[i] += x * 0.4;      // X position
          legPos[i + 1] -= 0.4;      // Lower
          legPos[i + 2] += z * 0.3;  // Z position
        }
        allLegVertices.push(...legPos);
      }
    }

    // Add weapon pods on sides
    let allWeaponVertices = [];
    for (let side = -1; side <= 1; side += 2) {
      const weaponPos = [...weaponVertices];
      for (let i = 0; i < weaponPos.length; i += 3) {
        weaponPos[i] += side * 0.6;   // Position on sides
        weaponPos[i + 1] += 0.2;      // Raise slightly
      }
      allWeaponVertices.push(...weaponPos);
    }

    // Position armor plates
    for (let i = 0; i < armorVertices.length; i += 3) {
      armorVertices[i + 2] += 0.5;    // Move to front
      armorVertices[i + 1] += 0.1;    // Raise slightly
    }

    const positions = new Float32Array([
      ...vertices,
      ...cockpitVertices,
      ...allLegVertices,
      ...allWeaponVertices,
      ...armorVertices
    ]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  })()
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
  normal: [1.0, 1.0, 1.0],    // Infantry mech
  fast: [0.8, 0.8, 0.8],      // Stealth drone
  armored: [1.2, 1.2, 1.2],   // Battle tank
  boss: [1.8, 1.8, 1.8],      // Assault walker
};

const creepColors = {
  normal: '#6366f1',    // Bright indigo - highly visible
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
    const mat = new MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.6,
      side: DoubleSide,     // Render both sides of faces
      flatShading: true,    // Creates more defined edges
      emissive: '#000000',  // Slight glow for better visibility
      emissiveIntensity: 0.1,
    });
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
      instancedMesh.current!.setMatrixAt(i, matrix);
    }
    instancedMesh.current!.instanceMatrix.needsUpdate = true;
  }, []);

  // Update creep positions and attributes
  useFrame((state, delta) => {
    if (!instancedMesh.current) return;

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

        // Interpolate position between current and next points
        const position = currentPoint.clone().lerp(nextPoint, creepState.progress);

        // Update instance matrix
        tempMatrix.makeTranslation(position.x, position.y + 0.5, position.z);
        instancedMesh.current.setMatrixAt(instanceId, tempMatrix);
        needsMatrixUpdate = true;

        // Update creep's stored position
        creepData.position = [position.x, position.y + 0.5, position.z];

        // Move to next segment if we've completed this one
        if (creepState.progress >= 1) {
          creepState.pathIndex++;
          creepState.progress = 0;

          // Check if we've reached the end
          if (creepState.pathIndex >= pathPoints.length - 1) {
            loseLife();
            removeCreep(creepId);
            activeCreeps.current.delete(creepId);
            needsMatrixUpdate = true;
          }
        }
      }
    });

    if (needsMatrixUpdate) {
      instancedMesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  // Handle creep lifecycle
  useEffect(() => {
    // console.log('Creeps updated:', creeps.length);
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

  const healthBarRefs = useRef<{ [key: string]: THREE.Group }>({});
  const healthBarMatrices = useRef<{ [key: string]: THREE.Matrix4 }>({});

  useFrame(() => {
    if (!instancedMesh.current) return;

    creeps.forEach(creep => {
      const creepState = activeCreeps.current.get(creep.id);
      if (!creepState) return;

      // Get creep position from instance matrix
      const matrix = new THREE.Matrix4();
      instancedMesh.current!.getMatrixAt(creepState.instanceId, matrix);
      const position = new THREE.Vector3();
      position.setFromMatrixPosition(matrix);
      position.y += 2; // Offset above creep

      // Update health bar position
      if (healthBarRefs.current[creep.id]) {
        healthBarRefs.current[creep.id].position.copy(position);
      }

      // Store matrix for new health bars
      healthBarMatrices.current[creep.id] = matrix;
    });
  });

  return (
    <group>
      <instancedMesh
        ref={instancedMesh}
        args={[geometry, material, 1000]}
        castShadow
        receiveShadow
      />

      {/* Health Bars */}
      {creeps.map(creep => {
        const healthPercent = creep.health / creep.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        const barWidth = 1.3;
        const barHeight = 0.2;

        return (
          <group
            key={creep.id}
            ref={ref => {
              if (ref) healthBarRefs.current[creep.id] = ref;
            }}
          >
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
              {/* Black outline */}
              <mesh position={[0, 0, -0.01]} renderOrder={1}>
                <planeGeometry args={[barWidth + 0.1, barHeight + 0.1]} />
                <meshBasicMaterial color="black" transparent opacity={0.8} depthWrite={false} />
              </mesh>

              {/* Background */}
              <mesh position={[0, 0, 0]} renderOrder={2}>
                <planeGeometry args={[barWidth, barHeight]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.8} depthWrite={false} />
              </mesh>

              {/* Health bar */}
              <mesh position={[(-barWidth * (1 - healthPercent)) / 2, 0, 0.01]} renderOrder={3}>
                <planeGeometry args={[barWidth * healthPercent, barHeight]} />
                <meshBasicMaterial
                  color={healthColor}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
