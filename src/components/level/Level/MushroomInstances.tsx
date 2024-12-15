import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D } from 'three';

export function MushroomInstances({ count = 25, radius = 22 }) {
    const capsRef = useRef<InstancedMesh>(null);
    const stemsRef = useRef<InstancedMesh>(null);
    const spotsRef = useRef<InstancedMesh>(null);
    const tempObject = useMemo(() => new Object3D(), []);
  
    // Realistic mushroom varieties with shape variations
    const mushroomTypes = useMemo(() => [
      { 
        cap: '#8B4513', // Saddle brown
        stem: '#F5DEB3',
        shape: { curve: 0.3, width: 1.0, direction: 1 }, // Normal round cap
        spots: false
      },
      { 
        cap: '#B22222', // Fire red (Amanita) - very rare
        stem: '#FFFFFF',
        shape: { curve: 0.5, width: 1.2, direction: 1 }, // Classic toadstool shape
        spots: true,
        rarity: 0.05 // 5% chance
      },
      { 
        cap: '#F4A460', // Sandy brown
        stem: '#FAEBD7',
        shape: { curve: 0.4, width: 1.4, direction: -1 }, // Wide upward-curling cap
        spots: false
      },
      { 
        cap: '#D2B48C', // Tan
        stem: '#FFF8DC',
        shape: { curve: 0.6, width: 0.9, direction: -1 }, // Upward-curling pointy cap
        spots: false
      },
      { 
        cap: '#BC8F8F', // Rosy brown
        stem: '#F5F5DC',
        shape: { curve: 0.4, width: 1.1, direction: 1 }, // Medium dome cap
        spots: false
      },
      { 
        cap: '#E6D5AC', // Light beige
        stem: '#FFFFF0',
        shape: { curve: 0.3, width: 1.2, direction: -1 }, // Upward-curling medium cap
        spots: false
      },
      { 
        cap: '#DAA520', // Goldenrod
        stem: '#FFF8DC',
        shape: { curve: 0.5, width: 1.0, direction: 1 }, // Normal golden cap
        spots: false
      },
      { 
        cap: '#F5DEB3', // Wheat
        stem: '#FFFFFF',
        shape: { curve: 0.4, width: 1.3, direction: 1 }, // Wide pale cap
        spots: false
      },
      { 
        cap: '#8B7355', // Dark wood brown
        stem: '#EEE8AA',
        shape: { curve: 0.6, width: 0.8, direction: -1 }, // Small upward-curling cap
        spots: false
      },
      { 
        cap: '#8B0000', // Dark red
        stem: '#DEB887',
        shape: { curve: 0.45, width: 1.1, direction: 1 }, // Normal dark red cap
        spots: false,
        rarity: 0.15 // 15% chance
      },
      { 
        cap: '#DC143C', // Crimson
        stem: '#F5DEB3',
        shape: { curve: 0.35, width: 0.9, direction: -1 }, // Small upward-curling red cap
        spots: false,
        rarity: 0.15 // 15% chance
      }
    ], []);
  
    useEffect(() => {
      if (!capsRef.current || !stemsRef.current || !spotsRef.current) return;
  
      let spotCount = 0;
  
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const r = radius * (0.5 + Math.random() * 0.5);
        const x = Math.sin(angle) * r + (Math.random() * 6 - 3);
        const z = Math.cos(angle) * r + (Math.random() * 6 - 3);
        const scale = 0.2 + Math.random() * 0.15;
        const rotation = Math.random() * Math.PI * 2;
  
        // Select mushroom type with rarity check
        let mushroomType;
        do {
          mushroomType = mushroomTypes[Math.floor(Math.random() * mushroomTypes.length)];
        } while (mushroomType.rarity && Math.random() > mushroomType.rarity);
  
        const { shape } = mushroomType;
  
        // Cap with curved shape and direction
        tempObject.position.set(x, scale * 0.7, z);
        const capHeight = scale * shape.curve * (0.8 + Math.random() * 0.4);
        tempObject.scale.set(
          scale * shape.width * (0.9 + Math.random() * 0.2),
          capHeight * shape.direction, // Direction affects cap curve
          scale * shape.width * (0.9 + Math.random() * 0.2)
        );
        tempObject.rotation.set(
          Math.random() * 0.2 - 0.1,
          rotation,
          Math.random() * 0.2 - 0.1
        );
        tempObject.updateMatrix();
        capsRef.current.setMatrixAt(i, tempObject.matrix);
  
        // Adjust stem position based on cap direction
        const stemHeight = 0.7 + Math.random() * 0.3;
        const stemY = scale * stemHeight * 0.5;
        tempObject.position.set(x, stemY, z);
        tempObject.scale.set(
          scale * 0.2 * (0.8 + Math.random() * 0.4),
          scale * stemHeight,
          scale * 0.2 * (0.8 + Math.random() * 0.4)
        );
        tempObject.rotation.set(0, rotation, 0);
        tempObject.updateMatrix();
        stemsRef.current.setMatrixAt(i, tempObject.matrix);
  
        // Add spots for red mushrooms
        if (mushroomType.spots) {
          const numSpots = 6 + Math.floor(Math.random() * 4);
          for (let j = 0; j < numSpots; j++) {
            const spotAngle = (j / numSpots) * Math.PI * 2 + Math.random() * 0.5;
            const spotR = scale * (0.3 + Math.random() * 0.4);
            const spotX = x + Math.sin(spotAngle) * spotR;
            const spotZ = z + Math.cos(spotAngle) * spotR;
            const spotScale = scale * 0.15;
            const spotY = scale * 0.7 + Math.sin(spotAngle) * (capHeight * 0.3); // Follow cap curve
  
            tempObject.position.set(spotX, spotY, spotZ);
            tempObject.scale.set(spotScale, spotScale, spotScale);
            tempObject.rotation.copy(capsRef.current.rotation);
            tempObject.updateMatrix();
            spotsRef.current.setMatrixAt(spotCount++, tempObject.matrix);
          }
        }
      }
  
      capsRef.current.instanceMatrix.needsUpdate = true;
      stemsRef.current.instanceMatrix.needsUpdate = true;
      spotsRef.current.instanceMatrix.needsUpdate = true;
    }, [count, radius, mushroomTypes]);
  
    return (
      <group>
        <instancedMesh 
          ref={capsRef} 
          args={[undefined, undefined, count]} 
          castShadow 
          receiveShadow
        >
          <sphereGeometry args={[1, 32, 16]} />
          <meshStandardMaterial 
            color="#8B4513"
            roughness={0.8}
            metalness={0.1}
          />
        </instancedMesh>
        <instancedMesh 
          ref={stemsRef} 
          args={[undefined, undefined, count]} 
          castShadow 
          receiveShadow
        >
          <cylinderGeometry args={[0.5, 0.7, 1, 8]} />
          <meshStandardMaterial 
            color="#F5DEB3"
            roughness={0.6}
            metalness={0.1}
          />
        </instancedMesh>
        <instancedMesh
          ref={spotsRef}
          args={[undefined, undefined, count * 10]}
          castShadow
          visible={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.5}
            metalness={0.1}
          />
        </instancedMesh>
      </group>
    );
  }