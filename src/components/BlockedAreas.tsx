import { Vector3 } from 'three';
import { LEVEL_CONFIGS } from './Level';

export const BlockedAreas = ({ currentLevel }: { currentLevel: number }) => {
  const config = LEVEL_CONFIGS[currentLevel];
  
  return (
    <>
      {config.initialBoxes.map((box, index) => {
        const boxPos = new Vector3(box.position[0], box.position[1], box.position[2]);
        const boxDim = new Vector3(box.dimensions[0], box.dimensions[1], box.dimensions[2]);
        
        // Account for rotation in dimension check
        const effectiveDimX = Math.abs(Math.cos(box.rotation)) * boxDim.x + Math.abs(Math.sin(box.rotation)) * boxDim.z;
        const effectiveDimZ = Math.abs(Math.sin(box.rotation)) * boxDim.x + Math.abs(Math.cos(box.rotation)) * boxDim.z;
        
        return (
          <mesh
            key={index}
            position={[boxPos.x, boxPos.y + 0.5, boxPos.z]}
            rotation={[0, box.rotation, 0]}
          >
            <boxGeometry args={[effectiveDimX, 1, effectiveDimZ]} />
            <meshStandardMaterial color="#ff0000" transparent opacity={0.3} />
          </mesh>
        );
      })}
    </>
  );
};
