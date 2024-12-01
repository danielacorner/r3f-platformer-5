import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, Matrix4, BufferGeometry, BufferAttribute, BoxGeometry } from 'three';
import { useGameStore } from '../store/gameStore';
import { createShaderMaterial } from '../utils/shaders';
import { InstancedPool } from '../utils/objectPool';

const CREEP_GEOMETRY = new BoxGeometry(0.5, 0.5, 0.5);
const tempObject = new Object3D();
const tempVector = new Vector3();
const tempMatrix = new Matrix4();

interface CreepProps {
  id: number;
  pathPoints: Vector3[];
}

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

const creepSpeeds = {
  normal: 0.1,
  fast: 0.15,
  armored: 0.08,
  boss: 0.06
};

const SPEED_MULTIPLIER = 1;

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

const creeps: CreepProps[] = [];

export const Creep = CreepManager;

export function CreepManager({ id, pathPoints }: CreepProps) {
  const instancedMesh = useRef<InstancedMesh>();
  const creepPool = useRef<InstancedPool>();
  const activeCreeps = useRef<Map<number, { props: CreepProps; instanceId: number }>>(new Map());

  // Create instanced mesh with custom shader
  const material = useMemo(() => createShaderMaterial('creep'), []);

  // Initialize instance attributes
  const { colorArray, healthArray, scaleArray } = useMemo(() => {
    const maxInstances = 1000;
    return {
      colorArray: new Float32Array(maxInstances * 3),
      healthArray: new Float32Array(maxInstances),
      scaleArray: new Float32Array(maxInstances)
    };
  }, []);

  useEffect(() => {
    if (!instancedMesh.current) return;

    // Set up instance attributes
    const geometry = instancedMesh.current.geometry as BufferGeometry;
    geometry.setAttribute('instanceColor', new BufferAttribute(colorArray, 3));
    geometry.setAttribute('instanceHealth', new BufferAttribute(healthArray, 1));
    geometry.setAttribute('instanceScale', new BufferAttribute(scaleArray, 1));

    // Initialize instance pool
    creepPool.current = new InstancedPool(CREEP_GEOMETRY, material, 1000);
  }, []);

  useFrame((state, delta) => {
    if (!instancedMesh.current || !creepPool.current) return;

    // Update existing creeps
    activeCreeps.current.forEach(({ props, instanceId }, index) => {
      const { id, pathPoints } = props;
      const creepData = useGameStore.getState().creeps.find(c => c.id === id);

      if (!creepData) return;

      const { position, type, health } = creepData;

      // Update position along path
      tempVector.set(...position);
      const nextPoint = pathPoints[index + 1];
      if (nextPoint) {
        tempVector.lerp(nextPoint, (creepSpeeds[type] || 0.1) * SPEED_MULTIPLIER * delta);

        // Update instance transform
        tempObject.position.copy(tempVector);
        tempObject.updateMatrix();
        instancedMesh.current.setMatrixAt(instanceId, tempObject.matrix);

        // Update instance attributes
        const baseIndex = instanceId * 3;
        colorArray[baseIndex] = 1 - health / creepData.maxHealth;
        colorArray[baseIndex + 1] = health / creepData.maxHealth;
        colorArray[baseIndex + 2] = 0;
        healthArray[instanceId] = health;
        scaleArray[instanceId] = 0.5 + health / creepData.maxHealth * 0.5;
      }
    });

    // Update instance matrices and attributes
    instancedMesh.current.instanceMatrix.needsUpdate = true;
    instancedMesh.current.geometry.attributes.instanceColor.needsUpdate = true;
    instancedMesh.current.geometry.attributes.instanceHealth.needsUpdate = true;
    instancedMesh.current.geometry.attributes.instanceScale.needsUpdate = true;
  });

  // Handle creep lifecycle
  useEffect(() => {
    // Add new creeps
    useGameStore.getState().creeps.forEach(creepData => {
      if (!activeCreeps.current.has(creepData.id)) {
        const instanceId = creepPool.current?.getInstance();
        if (instanceId !== null && instanceId !== undefined) {
          activeCreeps.current.set(creepData.id, { props: { id: creepData.id, pathPoints: [] }, instanceId });
        }
      }
    });

    // Remove dead creeps
    activeCreeps.current.forEach(({ props, instanceId }, index) => {
      const creepData = useGameStore.getState().creeps.find(c => c.id === index);
      if (!creepData) {
        creepPool.current?.releaseInstance(instanceId);
        activeCreeps.current.delete(index);
      }
    });
  }, []);

  return (
    <instancedMesh
      ref={instancedMesh}
      args={[CREEP_GEOMETRY, material, 1000]}
      castShadow
      receiveShadow
    />
  );
}
