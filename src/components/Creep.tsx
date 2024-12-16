import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Vector3,
  InstancedMesh,
  Object3D,
  Matrix4,
  Color,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Group,
} from "three";
import { useGLTF, Clone } from "@react-three/drei";
import { useGameStore } from "../store/gameStore";

// Load the creeper model
function CreeperModel() {
  const { scene } = useGLTF("/models/minecraft_creeper/scene.gltf");
  return <Clone object={scene} />;
}

// Preload the model
useGLTF.preload("/models/minecraft_creeper/scene.gltf");

const SPEED_MULTIPLIER = 1;

const creepSizes = {
  normal: [0.8, 0.8, 0.8],    // Normal creeper size
  fast: [0.6, 0.6, 0.6],      // Smaller, faster creeper
  armored: [1.0, 1.0, 1.0],   // Bigger, armored creeper
  boss: [1.5, 1.5, 1.5],      // Large boss creeper
};

const creepSpeeds = {
  normal: 1,
  fast: 1.5,
  armored: 0.7,
  boss: 0.5,
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

const creeps: CreepManagerProps[] = [];

export function CreepManager({ pathPoints }: CreepManagerProps) {
  const groupRef = useRef<Group>(null);
  const healthBarBackgroundRef = useRef<InstancedMesh>(null);
  const healthBarForegroundRef = useRef<InstancedMesh>(null);
  const creepPaths = useRef<Map<string, { pathIndex: number; progress: number }>>(new Map());
  const creeps = useGameStore(state => state.creeps);
  const removeCreep = useGameStore(state => state.removeCreep);
  const loseLife = useGameStore(state => state.loseLife);

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

  // Update creep positions and health bars
  useFrame((state, delta) => {
    if (!healthBarBackgroundRef.current || !healthBarForegroundRef.current) return;

    // Get camera quaternion for billboard effect
    const cameraQuaternion = state.camera.quaternion;
    const matrix = new Matrix4();
    const tempMatrix = new Matrix4();
    const tempScaleMatrix = new Matrix4();
    const tempTranslateMatrix = new Matrix4();

    creeps.forEach((creep, index) => {
      const pathState = creepPaths.current.get(creep.id);
      if (!pathState) return;

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

        // Update creep position in store
        creep.position = [position.x, position.y, position.z];

        // Update health bars
        const healthPercent = creep.health / creep.maxHealth;
        const barWidth = 1.3;
        const barHeight = 0.2;
        const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        const barY = position.y + 1.5;

        // Update health bar matrices
        matrix.makeTranslation(position.x, barY, position.z);
        matrix.multiply(new Matrix4().makeRotationFromQuaternion(cameraQuaternion));

        // Background bar
        tempMatrix.copy(matrix);
        tempScaleMatrix.makeScale(barWidth, barHeight, 1);
        tempMatrix.multiply(tempScaleMatrix);
        healthBarBackgroundRef.current.setMatrixAt(index, tempMatrix);

        // Health bar
        const healthBarWidth = barWidth * healthPercent;
        const offsetX = (barWidth - healthBarWidth) / 2;
        tempMatrix.copy(matrix);
        tempTranslateMatrix.makeTranslation(-offsetX, 0, 0.001);
        tempMatrix.multiply(tempTranslateMatrix);
        tempScaleMatrix.makeScale(healthBarWidth, barHeight, 1);
        tempMatrix.multiply(tempScaleMatrix);
        healthBarForegroundRef.current.setMatrixAt(index, tempMatrix);
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

    // Update matrices
    healthBarBackgroundRef.current.instanceMatrix.needsUpdate = true;
    healthBarForegroundRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <group ref={groupRef}>
        {creeps.map((creep) => {
          const position = new Vector3(...creep.position);
          const pathState = creepPaths.current.get(creep.id);
          if (!pathState) return null;

          const currentPoint = pathPoints[pathState.pathIndex];
          const nextPoint = pathPoints[pathState.pathIndex + 1];
          if (!currentPoint || !nextPoint) return null;

          const direction = nextPoint.clone().sub(currentPoint).normalize();
          const angle = Math.atan2(direction.x, direction.z);
          const scale = creepSizes[creep.type];

          return (
            <group
              key={creep.id}
              position={position}
              rotation={[0, angle + Math.PI, 0]}
              scale={scale}
            >
              <CreeperModel />
            </group>
          );
        })}
      </group>

      <instancedMesh
        ref={healthBarBackgroundRef}
        args={[new PlaneGeometry(1, 1), new MeshBasicMaterial({
          color: "#1a1a1a",
          transparent: true,
          opacity: 0.8,
          depthTest: false,
          depthWrite: false,
          side: DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
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
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }), 100]}
        renderOrder={11}
      />
    </group>
  );
}
