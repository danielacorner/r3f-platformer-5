import { useMemo, } from "react";
import {
  Vector3,
  CatmullRomCurve3,

} from "three";
import { PATH_CONFIGS } from "../../config/pathConfigs";

export interface PathSegment {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const FIXED_WIDTH = 2;
const MIN_LENGTH = 1;
const MAX_LENGTH = 1;
const CRYSTAL_HEIGHT = 1;
const CRYSTAL_SCALE = 0.5;
const CHEVRON_SCALE = 0.6;

export function PathDecorations({ pathPoints, segmentCount }: { pathPoints: Vector3[], segmentCount?: number }) {
  const segments = useMemo(
    () => generatePathSegments(pathPoints, segmentCount),
    [pathPoints]
  );

  // Memoize crystal rotations
  const crystalRotations = useMemo(
    () => segments.map(() => Math.random() * Math.PI * 2),
    [segments]
  );

  return (
    <>
      {segments.map((segment, index) => (
        <group key={index}>
          {/* Regular or Chevron path segment */}
          {index % 8 === 0 ? (
            <ChevronTile
              position={segment.position}
              rotation={segment.rotation}
              scale={[
                segment.scale[0] * CHEVRON_SCALE,
                segment.scale[1] * CHEVRON_SCALE,
                segment.scale[2] * CHEVRON_SCALE,
              ]}
            />
          ) : (
            <mesh
              position={segment.position}
              rotation={segment.rotation}
              scale={segment.scale}
            >
              <boxGeometry />
              <meshStandardMaterial color="#444" />
            </mesh>
          )}

          {/* Crystal decoration - only on every 8th segment */}
          {index % 8 === 0 && (
            <mesh
              position={[
                segment.position[0],
                segment.position[1] + CRYSTAL_HEIGHT,
                segment.position[2],
              ]}
              rotation={[0, crystalRotations[index], 0]}
              scale={CRYSTAL_SCALE}
            >
              <octahedronGeometry args={[0.5]} />
              <meshStandardMaterial
                color="#60a5fa"
                emissive="#60a5fa"
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

export function generatePath(currentLevel: number) {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    console.warn(
      `No path configuration found for level ${currentLevel}, using level 1`
    );
    return {
      points: PATH_CONFIGS[1].pathPoints,
      segments: generatePathSegments(PATH_CONFIGS[1].pathPoints, PATH_CONFIGS[1].segmentCount),
    };
  }
  return {
    points: config.pathPoints,
    segments: generatePathSegments(config.pathPoints, config.segmentCount),
    segmentCount: config.segmentCount,
  };
}

function generatePathSegments(pathPoints: Vector3[], segmentCount = 100): PathSegment[] {
  const segments: PathSegment[] = [];
  const curve = new CatmullRomCurve3(pathPoints, false, "catmullrom", 0.5);


  for (let i = 0; i < segmentCount; i++) {
    const t = i / segmentCount;
    const point = curve.getPoint(t);
    const nextT = Math.min((i + 1) / segmentCount, 1);
    const nextPoint = curve.getPoint(nextT);
    const direction = nextPoint.clone().sub(point).normalize();

    // Calculate rotation to face the next point
    const rotation: [number, number, number] = [
      0,
      Math.atan2(direction.x, direction.z),
      0,
    ];

    // Generate random length for this segment
    const length = MIN_LENGTH + Math.random() * (MAX_LENGTH - MIN_LENGTH);

    segments.push({
      position: [point.x, point.y, point.z],
      rotation,
      scale: [FIXED_WIDTH, 0.1, length],
    });
  }

  return segments;
}

export function getSpawnerPosition(
  currentLevel: number
): [number, number, number] {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    return PATH_CONFIGS[1].spawnerPosition;
  }
  return config.spawnerPosition;
}

export function getPortalPosition(
  currentLevel: number
): [number, number, number] {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    return PATH_CONFIGS[1].portalPosition;
  }
  return config.portalPosition;
}

function ChevronTile({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  const vertices = useMemo(
    () =>
      new Float32Array([
        // Front face - chevron
        -1,
        0,
        -1, // back left
        1,
        0,
        -1, // back right
        -0.7,
        0,
        0, // middle left
        0.7,
        0,
        0, // middle right
        -0.3,
        0,
        1, // front left
        0.3,
        0,
        1, // front right

        // Back face - chevron
        -1,
        -0.1,
        -1, // back left
        1,
        -0.1,
        -1, // back right
        -0.7,
        -0.1,
        0, // middle left
        0.7,
        -0.1,
        0, // middle right
        -0.3,
        -0.1,
        1, // front left
        0.3,
        -0.1,
        1, // front right
      ]),
    []
  );

  const indices = useMemo(
    () =>
      new Uint16Array([
        // Top face
        0,
        1,
        2, // back triangle left
        1,
        3,
        2, // back triangle right
        2,
        3,
        4, // front triangle left
        3,
        5,
        4, // front triangle right

        // Bottom face
        6,
        8,
        7, // back triangle left
        7,
        8,
        9, // back triangle right
        8,
        10,
        9, // front triangle left
        9,
        10,
        11, // front triangle right

        // Side faces
        0,
        2,
        6, // left back
        2,
        8,
        6,
        2,
        4,
        8, // left front
        4,
        10,
        8,
        1,
        7,
        3, // right back
        3,
        7,
        9,
        3,
        9,
        5, // right front
        5,
        9,
        11,
        0,
        6,
        1, // back
        1,
        6,
        7,
        4,
        5,
        10, // front
        5,
        11,
        10,
      ]),
    []
  );

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length / 3}
          array={vertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={indices}
          count={indices.length}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial
        color="#444444"
        emissive="#9b9b9b"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}
