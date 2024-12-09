import { useEffect, useMemo, useRef } from "react";
import { Vector3, CatmullRomCurve3, InstancedMesh, Object3D, Matrix4, Euler } from "three";
import { useGameStore } from "../../store/gameStore";
import { PATH_CONFIGS } from "../../config/pathConfigs";

export interface PathSegment {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function generatePath(currentLevel: number) {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    console.warn(`No path configuration found for level ${currentLevel}, using level 1`);
    return {
      points: PATH_CONFIGS[1].pathPoints,
      segments: generatePathSegments(PATH_CONFIGS[1].pathPoints)
    };
  }
  return {
    points: config.pathPoints,
    segments: generatePathSegments(config.pathPoints)
  };
}

function generatePathSegments(pathPoints: Vector3[]): PathSegment[] {
  const segments: PathSegment[] = [];
  const curve = new CatmullRomCurve3(pathPoints, false, "catmullrom", 0.5);
  const segmentCount = 50;

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
      0
    ];

    segments.push({
      position: [point.x, point.y, point.z],
      rotation,
      scale: [2, 0.1, 2]
    });
  }

  return segments;
}

export function getSpawnerPosition(currentLevel: number): [number, number, number] {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    return PATH_CONFIGS[1].spawnerPosition;
  }
  return config.spawnerPosition;
}

export function getPortalPosition(currentLevel: number): [number, number, number] {
  const config = PATH_CONFIGS[currentLevel];
  if (!config) {
    return PATH_CONFIGS[1].portalPosition;
  }
  return config.portalPosition;
}

export function PathDecorations({ pathPoints }: { pathPoints: Vector3[] }) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  // Generate segments for the path
  const segments = useMemo(() => generatePathSegments(pathPoints), [pathPoints]);

  // Update instance matrices
  useEffect(() => {
    if (!meshRef.current) return;

    segments.forEach((segment, i) => {
      tempObject.position.set(...segment.position);
      tempObject.rotation.set(...segment.rotation);
      tempObject.scale.set(...segment.scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [segments, tempObject]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, segments.length]}
      castShadow
    >
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial
        color="#312e81"
        emissive="#312e81"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}