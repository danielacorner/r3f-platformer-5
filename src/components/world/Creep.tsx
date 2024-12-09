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
  CylinderGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Group,
} from "three";
import * as THREE from "three";
import { GoblinMobModel } from "../models/GoblinMobModel";
import { CreeperModel } from "../models/CreeperModel";
import { PortalEffect } from "../effects/PortalEffect";
import { CrabModel } from "../models/CrabModel";
import { useGameStore } from "../../store/gameStore";

// Create geometries for different creep types
const CREEP_GEOMETRIES = {
  normal: null, // We'll use the goblin model instead
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
  normal: null, // We'll use the goblin model's materials
  fast: new MeshStandardMaterial({
    color: new Color("#4a7c59"), // Forest sage
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true,
    transparent: true,
    opacity: 1,
    side: DoubleSide,
  }),
  armored: new MeshStandardMaterial({
    color: new Color("#1f3d0c"), // Deep forest
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true,
    transparent: true,
    opacity: 1,
    side: DoubleSide,
  }),
  boss: new MeshStandardMaterial({
    color: new Color("#8b0000"), // Dark red
    roughness: 0.3,
    metalness: 0.6,
    emissive: new Color("#400000"),
    emissiveIntensity: 0.5,
    flatShading: true,
    transparent: true,
    opacity: 1,
    side: DoubleSide,
  }),
};

interface CreepManagerProps {
  pathPoints: Vector3[];
}

const SPEED_MULTIPLIER = 4;

const creepSizes = {
  normal: [1.0, 1.0, 1.0], // Infantry mech
  fast: [0.8, 0.8, 0.8], // Stealth drone
  armored: [1.2, 1.2, 1.2], // Battle tank
  boss: [1.8, 1.8, 1.8], // Assault walker
};

const creepColors = {
  normal: "#2d4a1c", // Dark forest green
  armored: "#94a3b8", // Bright steel - stands out well
  fast: "#2dd4bf", // Bright teal - distinctive
  boss: "#f43f5e", // Bright rose - imposing
};

const creepRewards = {
  normal: 20,
  armored: 40,
  fast: 25,
  boss: 100,
};

const effectColors = {
  slow: "#00ffff",
  amplify: "#ffff00",
  poison: "#00ff00",
  armor_reduction: "#ff0000",
  splash: "#ff00ff",
  freeze: "#0000ff",
  fear: "#ff0000",
  burn: "#ff9900",
  thorns: "#33cc33",
  curse: "#6600cc",
  mana_burn: "#cc00cc",
  mark: "#ff00ff",
};

const creeps: CreepManagerProps[] = [];

export function CreepManager({ pathPoints }: CreepManagerProps) {
  const groupRef = useRef<Group>(null);
  const healthBarBackgroundRef = useRef<InstancedMesh>(null);
  const healthBarForegroundRef = useRef<InstancedMesh>(null);
  const creepPaths = useRef<
    Map<number, { pathIndex: number; progress: number }>
  >(new Map());
  const creeps = useGameStore((state) => state.creeps);
  const removeCreep = useGameStore((state) => state.removeCreep);
  const loseLife = useGameStore((state) => state.loseLife);
  const updateCreep = useGameStore((state) => state.updateCreep);

  // Initialize new creeps
  useEffect(() => {
    creeps.forEach((creep) => {
      if (!creepPaths.current.has(creep.id)) {
        creepPaths.current.set(creep.id, {
          pathIndex: 0,
          progress: 0,
        });
      }
    });
  }, [creeps]);

  // Update creep positions and health bars
  useFrame((state, delta) => {
    if (
      !groupRef.current ||
      !healthBarBackgroundRef.current ||
      !healthBarForegroundRef.current
    )
      return;

    const matrix = new Matrix4();
    const tempMatrix = new Matrix4();
    const tempScaleMatrix = new Matrix4();
    const tempTranslateMatrix = new Matrix4();
    const cameraQuaternion = state.camera.quaternion;

    creeps.forEach((creep, index) => {
      const pathState = creepPaths.current.get(creep.id);
      if (!pathState) return;

      // Get current and next path points
      const currentPoint = pathPoints[pathState.pathIndex];
      const nextPoint = pathPoints[pathState.pathIndex + 1];

      if (currentPoint && nextPoint) {
        // Update progress along current path segment
        const speed = creepSpeeds[creep.type] * SPEED_MULTIPLIER;
        pathState.progress += speed * delta;

        // Calculate position along path
        const position = new Vector3().lerpVectors(
          currentPoint,
          nextPoint,
          pathState.progress
        );
        position.y = 0.5; // Lift slightly off ground

        // Calculate rotation to face movement direction
        const direction = nextPoint.clone().sub(currentPoint).normalize();
        const angle = Math.atan2(direction.x, direction.z);

        // Update creep position in store
        updateCreep(creep.id, {
          position: [position.x, position.y, position.z],
        });

        // Update health bars
        const healthPercent = creep.health / creep.maxHealth;
        const barWidth = 1.3;
        const barHeight = 0.2;
        const healthColor =
          healthPercent > 0.5
            ? "#22c55e"
            : healthPercent > 0.25
            ? "#eab308"
            : "#ef4444";
        const barY = position.y + 1.5;

        // Base matrix for both bars
        matrix.identity();
        matrix.makeTranslation(position.x, barY, position.z);
        matrix.multiply(
          new Matrix4().makeRotationFromQuaternion(cameraQuaternion)
        );

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
        (
          healthBarForegroundRef.current.material as MeshBasicMaterial
        ).color.set(healthColor);

        // Move to next path segment if needed
        if (pathState.progress >= 1) {
          pathState.pathIndex++;
          pathState.progress = 0;

          if (pathState.pathIndex >= pathPoints.length - 1) {
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
        {/* Spawn point portal */}
        {pathPoints.length > 0 && (
          <PortalEffect
            position={[pathPoints[0].x, 0, pathPoints[0].z]}
            color={new THREE.Color("#4a9eff")}
          />
        )}
        {/* Creeps */}
        {creeps.map((creep) => {
          const position = new Vector3(...creep.position);
          const pathState = creepPaths.current.get(creep.id);
          if (!pathState) return null;

          const currentPoint = pathPoints[pathState.pathIndex];
          const nextPoint = pathPoints[pathState.pathIndex + 1];

          if (!currentPoint || !nextPoint) return null;

          const direction = nextPoint.clone().sub(currentPoint).normalize();
          const angle = Math.atan2(direction.x, direction.z);

          if (creep.type === "normal") {
            return (
              <group
                key={creep.id}
                position={position}
                rotation={[0, angle + Math.PI, 0]}
              >
                <group position={[0, 0.5, 0]}>
                  <GoblinMobModel scale={1.5} />
                </group>
              </group>
            );
          }

          if (creep.type === "fast") {
            return (
              <group
                key={creep.id}
                position={position}
                rotation={[0, angle + Math.PI, 0]}
              >
                <group position={[0, 0.5, 0]}>
                  <CreeperModel scale={1} />
                </group>
              </group>
            );
          }

          if (creep.type === "armored") {
            return (
              <group
                key={creep.id}
                position={position}
                rotation={[0, angle + Math.PI, 0]}
              >
                <group position={[0, 0.5, 0]}>
                  <CrabModel scale={0.8} />
                </group>
              </group>
            );
          }

          // Boss type
          return (
            <mesh
              key={creep.id}
              geometry={CREEP_GEOMETRIES[creep.type]}
              material={creepMaterials[creep.type]}
              position={position}
              rotation={[0, angle, 0]}
              scale={creepSizes[creep.type]}
            >
              <meshStandardMaterial
                color={creepColors[creep.type]}
                roughness={0.7}
                metalness={0.3}
              />
            </mesh>
          );
        })}
      </group>

      <instancedMesh
        ref={healthBarBackgroundRef}
        args={[
          new PlaneGeometry(1, 1),
          new MeshBasicMaterial({
            color: "#1a1a1a",
            transparent: true,
            opacity: 0.8,
            depthTest: false,
            depthWrite: false,
            side: DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            visible: creeps.length > 0,
          }),
          100,
        ]}
        renderOrder={10}
      />
      <instancedMesh
        ref={healthBarForegroundRef}
        args={[
          new PlaneGeometry(1, 1),
          new MeshBasicMaterial({
            color: "#22c55e",
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            depthWrite: false,
            side: DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            visible: creeps.length > 0,
          }),
          100,
        ]}
        renderOrder={11}
      />
    </group>
  );
}
