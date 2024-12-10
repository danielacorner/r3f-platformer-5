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
import { MushroomModel } from "../models/MushroomModel";
import { AllayModel } from "../models/AllayModel";
import { SpiderModel } from "../models/SpiderModel";
import { WitherBossModel } from "../models/WitherBossModel";
import { BeeModel } from "../models/BeeModel";
import { EndermanModel } from "../models/EndermanModel";
import { DrownedModel } from "../models/DrownedModel";
import { GuardianModel } from "../models/GuardianModel";
import { CreeperModel } from "../models/CreeperModel";
import { PortalEffect } from "../effects/PortalEffect";
import { CreepState, useGameStore } from "../../store/gameStore";

// Speed multipliers for different creep types
const creepSpeeds = {
  normal: 1.0, // Mushroom - Standard speed
  fast: 1.5, // Allay - Fast and agile
  spider: 1.2, // Spider - Slightly faster than normal
  wither: 0.8, // Wither Boss - Slow but powerful
  bee: 1.3, // Bee - Quick and nimble
  enderman: 1.4, // Enderman - Very fast
  drowned: 0.9, // Drowned - Slow and shambling
  guardian: 0.7, // Guardian - Slow but tough
  creeper: 1.1, // Creeper - Standard speed
  armored: 0.6, // Heavily armored, very slow
  boss: 0.5, // Boss enemies, extremely slow
};

const creepSizes = {
  normal: [0.8, 0.8, 0.8], // Mushroom
  fast: [0.6, 0.6, 0.6], // Allay
  spider: [1.0, 0.5, 1.0], // Spider
  wither: [2.0, 2.0, 2.0], // Wither Boss
  bee: [0.5, 0.5, 0.5], // Bee
  enderman: [1.2, 2.5, 1.2], // Enderman
  drowned: [1.0, 2.0, 1.0], // Drowned
  guardian: [1.5, 1.5, 1.5], // Guardian
  creeper: [1.0, 2.0, 1.0], // Creeper
  armored: [1.2, 1.2, 1.2], // Armored units
  boss: [2.5, 2.5, 2.5], // Boss units
};

interface CreepManagerProps {
  pathPoints: Vector3[];
}

const SPEED_MULTIPLIER = 1;

export function CreepManager({ pathPoints }: CreepManagerProps) {
  const groupRef = useRef<Group>(null);
  const healthBarBackgroundRef = useRef<InstancedMesh>(null);
  const healthBarForegroundRef = useRef<InstancedMesh>(null);
  const creepPaths = useRef<
    Map<string, { pathIndex: number; progress: number }>
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
        const speed =
          creepSpeeds[creep.type as keyof typeof creepSpeeds] *
          SPEED_MULTIPLIER;
        pathState.progress += speed * delta;

        // Calculate position along path
        const position = new Vector3().lerpVectors(
          currentPoint,
          nextPoint,
          pathState.progress
        );
        position.y = 0.5; // Lift slightly off ground

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
        healthBarBackgroundRef.current?.setMatrixAt(index, tempMatrix);

        // Health bar
        const healthBarWidth = barWidth * healthPercent;
        const offsetX = (barWidth - healthBarWidth) / 2;

        tempMatrix.copy(matrix);
        tempTranslateMatrix.makeTranslation(-offsetX, 0, 0.001);
        tempMatrix.multiply(tempTranslateMatrix);
        tempScaleMatrix.makeScale(healthBarWidth, barHeight, 1);
        tempMatrix.multiply(tempScaleMatrix);
        healthBarForegroundRef.current?.setMatrixAt(index, tempMatrix);
        (
          healthBarForegroundRef.current?.material as MeshBasicMaterial
        )?.color.set(healthColor);

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
        {creeps.map((creep: CreepState) => {
          const position = new Vector3(...creep.position);
          // ignore next line
          const size = creepSizes[creep.type as keyof typeof creepSizes] || [
            1, 1, 1,
          ];
          const angle = Math.atan2(
            pathPoints[1].x - pathPoints[0].x,
            pathPoints[1].z - pathPoints[0].z
          );

          return (
            <group key={creep.id}>
              <group position={position} rotation={[0, angle + Math.PI, 0]}>
                <group position={[0, 0.5, 0]}>
                  {creep.type === "normal" && <MushroomModel scale={size[0]} />}
                  {/* {creep.type === "fast" && <AllayModel scale={size[0]} />} */}
                  {creep.type === "spider" && (
                    <SpiderModel scale={size[0] * 2} />
                  )}
                  {creep.type === "wither" && (
                    <WitherBossModel scale={size[0] * 2} />
                  )}
                  {/* {creep.type === "bee" && <BeeModel scale={size[0]} />} */}
                  {creep.type === "enderman" && (
                    <EndermanModel scale={size[0] * 2} />
                  )}
                  {creep.type === "drowned" && (
                    <DrownedModel scale={size[0] * 2} />
                  )}
                  {/* {creep.type === "guardian" && <GuardianModel scale={size[0]*2} />} */}
                  {creep.type === "creeper" && <CreeperModel scale={size[0]} />}
                </group>
              </group>
            </group>
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
