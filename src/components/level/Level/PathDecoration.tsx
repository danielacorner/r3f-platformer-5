import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D, Vector3 } from 'three';


// Optimized Path Decoration Crystals
export function PathDecorations({ pathPoints }: { pathPoints: any[] }) {
    const decorations = useMemo(() => generatePath().decorations, []);
    const meshRef = useRef<InstancedMesh>(null);
    const tempObject = useMemo(() => new Object3D(), []);
  
    useEffect(() => {
      if (!meshRef.current) return;
  
      decorations.forEach((dec, i) => {
        tempObject.position.set(dec.position[0], dec.position[1] + 1, dec.position[2]);
        tempObject.scale.set(dec.scale, dec.scale, dec.scale);
        tempObject.rotation.y = Math.random() * Math.PI * 2;
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }, [decorations]);
  
    return (
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, decorations.length]}
        castShadow
      >
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>
    );
  }

  // Path Generation
export function generatePath() {
    const baseHeight = 0.25; // Lower base height to reduce visual impact
    const path = {
      segments: [
        // Start area - natural clearing
        { position: [-20, baseHeight, -20], scale: [7, 0.2, 7], rotation: [0, Math.PI * 0.03, 0] },
  
        // Initial winding approach
        { position: [-20, baseHeight + 0.01, -15], scale: [4, 0.2, 8], rotation: [0, Math.PI * 0.05, 0] },
        { position: [-19, baseHeight + 0.02, -10], scale: [3.5, 0.2, 6], rotation: [0, Math.PI * 0.08, 0] },
        { position: [-18, baseHeight + 0.03, -8], scale: [3.8, 0.2, 5], rotation: [0, Math.PI * 0.12, 0] },
  
        // Meandering right turn
        { position: [-15, baseHeight + 0.02, -7.5], scale: [5, 0.2, 3.5], rotation: [0, Math.PI * 0.15, 0] },
        { position: [-12, baseHeight + 0.01, -7], scale: [4.5, 0.2, 3.8], rotation: [0, Math.PI * 0.1, 0] },
  
        // Wavy descent
        { position: [-11.5, baseHeight + 0.03, -10], scale: [3.2, 0.2, 6], rotation: [0, -Math.PI * 0.08, 0] },
        { position: [-11, baseHeight + 0.02, -13], scale: [3.5, 0.2, 5], rotation: [0, Math.PI * 0.06, 0] },
        { position: [-10.5, baseHeight + 0.01, -15], scale: [3.8, 0.2, 4.5], rotation: [0, -Math.PI * 0.04, 0] },
  
        // Curved horizontal traverse
        { position: [-7, baseHeight + 0.03, -15.8], scale: [7, 0.2, 3.2], rotation: [0, Math.PI * 0.03, 0] },
        { position: [0, baseHeight + 0.02, -15.2], scale: [8, 0.2, 3.5], rotation: [0, -Math.PI * 0.04, 0] },
        { position: [7, baseHeight + 0.01, -15.5], scale: [7, 0.2, 3.8], rotation: [0, Math.PI * 0.05, 0] },
  
        // Organic ascent
        { position: [11, baseHeight + 0.03, -12], scale: [3.5, 0.2, 7], rotation: [0, -Math.PI * 0.12, 0] },
        { position: [11.2, baseHeight + 0.02, -8], scale: [3.2, 0.2, 6], rotation: [0, Math.PI * 0.08, 0] },
        { position: [11.5, baseHeight + 0.01, -5], scale: [3.8, 0.2, 5], rotation: [0, -Math.PI * 0.06, 0] },
  
        // Winding middle path
        { position: [8, baseHeight + 0.03, -3.8], scale: [7, 0.2, 3.5], rotation: [0, Math.PI * 0.04, 0] },
        { position: [0, baseHeight + 0.02, -3.2], scale: [8, 0.2, 3.8], rotation: [0, -Math.PI * 0.05, 0] },
        { position: [-7, baseHeight + 0.01, -3.5], scale: [7, 0.2, 3.2], rotation: [0, Math.PI * 0.06, 0] },
  
        // Natural descent
        { position: [-11, baseHeight + 0.03, 0], scale: [3.5, 0.2, 7], rotation: [0, Math.PI * 0.1, 0] },
        { position: [-11.2, baseHeight + 0.02, 4], scale: [3.8, 0.2, 6], rotation: [0, -Math.PI * 0.08, 0] },
        { position: [-11.5, baseHeight + 0.01, 7], scale: [3.2, 0.2, 5], rotation: [0, Math.PI * 0.06, 0] },
  
        // Meandering bottom path
        { position: [-8, baseHeight + 0.03, 8.2], scale: [7, 0.2, 3.5], rotation: [0, -Math.PI * 0.05, 0] },
        { position: [0, baseHeight + 0.02, 8.8], scale: [8, 0.2, 3.2], rotation: [0, Math.PI * 0.04, 0] },
        { position: [7, baseHeight + 0.01, 8.5], scale: [7, 0.2, 3.8], rotation: [0, -Math.PI * 0.03, 0] },
  
        // Final winding ascent
        { position: [11, baseHeight + 0.03, 12], scale: [3.5, 0.2, 7], rotation: [0, -Math.PI * 0.15, 0] },
        { position: [13, baseHeight + 0.02, 15], scale: [3.8, 0.2, 6], rotation: [0, -Math.PI * 0.12, 0] },
        { position: [15, baseHeight + 0.01, 18], scale: [3.2, 0.2, 5], rotation: [0, -Math.PI * 0.08, 0] },
  
        // End area - natural clearing
        { position: [20, baseHeight, 20], scale: [7, 0.2, 7], rotation: [0, -Math.PI * 0.03, 0] }
      ],
      points: [
        new Vector3(-20, baseHeight, -20),   // Start
        new Vector3(-20, baseHeight, -15),   // Begin winding
        new Vector3(-19, baseHeight, -10),   // First curve
        new Vector3(-18, baseHeight, -8),    // Approach turn
        new Vector3(-15, baseHeight, -7.5),  // Begin turn
        new Vector3(-12, baseHeight, -7),    // Complete turn
        new Vector3(-11.5, baseHeight, -10), // Start descent
        new Vector3(-11, baseHeight, -13),   // Mid descent
        new Vector3(-10.5, baseHeight, -15), // End descent
        new Vector3(-7, baseHeight, -15.8),  // Begin traverse
        new Vector3(0, baseHeight, -15.2),   // Mid traverse
        new Vector3(7, baseHeight, -15.5),   // End traverse
        new Vector3(11, baseHeight, -12),    // Start ascent
        new Vector3(11.2, baseHeight, -8),   // Mid ascent
        new Vector3(11.5, baseHeight, -5),   // End ascent
        new Vector3(8, baseHeight, -3.8),    // Begin middle
        new Vector3(0, baseHeight, -3.2),    // Mid middle
        new Vector3(-7, baseHeight, -3.5),   // End middle
        new Vector3(-11, baseHeight, 0),     // Start second descent
        new Vector3(-11.2, baseHeight, 4),   // Mid descent
        new Vector3(-11.5, baseHeight, 7),   // End descent
        new Vector3(-8, baseHeight, 8.2),    // Begin bottom
        new Vector3(0, baseHeight, 8.8),     // Mid bottom
        new Vector3(7, baseHeight, 8.5),     // End bottom
        new Vector3(11, baseHeight, 12),     // Begin final ascent
        new Vector3(13, baseHeight, 15),     // Mid final
        new Vector3(15, baseHeight, 18),     // Near end
        new Vector3(20, baseHeight, 20)      // End
      ],
      decorations: [
        { position: [-20, baseHeight + 0.02, -15], scale: 0.8 },
        { position: [-19, baseHeight + 0.02, -10], scale: 0.7 },
        { position: [-15, baseHeight + 0.02, -7.5], scale: 0.75 },
        { position: [-11.5, baseHeight + 0.02, -10], scale: 0.7 },
        { position: [-10.5, baseHeight + 0.02, -15], scale: 0.8 },
        { position: [0, baseHeight + 0.02, -15.2], scale: 0.7 },
        { position: [11, baseHeight + 0.02, -12], scale: 0.75 },
        { position: [11.5, baseHeight + 0.02, -5], scale: 0.7 },
        { position: [0, baseHeight + 0.02, -3.2], scale: 0.8 },
        { position: [-11, baseHeight + 0.02, 0], scale: 0.7 },
        { position: [-11.5, baseHeight + 0.02, 7], scale: 0.75 },
        { position: [0, baseHeight + 0.02, 8.8], scale: 0.7 },
        { position: [11, baseHeight + 0.02, 12], scale: 0.8 },
        { position: [13, baseHeight + 0.02, 15], scale: 0.7 },
        { position: [15, baseHeight + 0.02, 18], scale: 0.75 }
      ]
    };
    return path;
  }
  