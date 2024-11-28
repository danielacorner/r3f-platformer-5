import { useRef, useState, useEffect, useCallback } from 'react';
import { Vector3 } from 'three';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { pathFinder } from '../utils/pathfinding';
import { useGameStore } from '../store/gameStore';
import { LEVEL_CONFIGS } from '../components/Level';

interface EnemyProps {
  position: Vector3;
  target: Vector3;
  onDeath: () => void;
}

export function Enemy({ position, target, onDeath }: EnemyProps) {
  const rigidBodyRef = useRef<any>(null);
  const [health, setHealth] = useState(100);
  const [isHit, setIsHit] = useState(false);
  const [currentPath, setCurrentPath] = useState<Vector3[]>([]);
  const [currentWaypoint, setCurrentWaypoint] = useState<Vector3 | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const lastPosition = useRef<Vector3>(new Vector3());
  const stuckCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  const moveSpeed = 2;
  const ENEMY_SIZE = 0.6;
  const ARENA_Y_LEVEL = 0.5;
  const WAYPOINT_THRESHOLD = 0.5;
  const STUCK_THRESHOLD = 0.1;
  const STUCK_CHECK_INTERVAL = 1000; // 1 second
  const PATH_UPDATE_INTERVAL = 500; // 0.5 seconds
  
  const currentLevel = useGameStore(state => state.currentLevel);

  useEffect(() => {
    console.log('Enemy spawned at:', position.toArray());
  }, [position]);

  useEffect(() => {
    if (LEVEL_CONFIGS[currentLevel]) {
      pathFinder.updateObstacles(LEVEL_CONFIGS[currentLevel].initialBoxes);
    }
  }, [currentLevel]);

  // Check if enemy is stuck
  useEffect(() => {
    const checkIfStuck = () => {
      if (rigidBodyRef.current) {
        const currentPos = new Vector3(
          rigidBodyRef.current.translation().x,
          0,
          rigidBodyRef.current.translation().z
        );
        
        if (currentPos.distanceTo(lastPosition.current) < STUCK_THRESHOLD) {
          setIsStuck(true);
          // Force path recalculation
          updatePath(true);
          console.log('Enemy is stuck');
        } else {
          setIsStuck(false);
        }
        
        lastPosition.current.copy(currentPos);
      }
    };

    stuckCheckTimeout.current = setInterval(checkIfStuck, STUCK_CHECK_INTERVAL);
    return () => {
      if (stuckCheckTimeout.current) {
        clearInterval(stuckCheckTimeout.current);
      }
    };
  }, []);

  const updatePath = useCallback((forceUpdate: boolean = false) => {
    if (rigidBodyRef.current && (forceUpdate || isStuck)) {
      const currentPos = rigidBodyRef.current.translation();
      const newPath = pathFinder.findPath(
        new Vector3(currentPos.x, 0, currentPos.z),
        target
      );
      
      if (newPath.length > 0) {
        setCurrentPath(newPath);
        setCurrentWaypoint(newPath[0]);
        setIsStuck(false);
        console.log('Updated enemy path');
      }
    }
  }, [target, isStuck]);

  // Regularly update path
  useEffect(() => {
    pathUpdateInterval.current = setInterval(() => updatePath(), PATH_UPDATE_INTERVAL);
    return () => {
      if (pathUpdateInterval.current) {
        clearInterval(pathUpdateInterval.current);
      }
    };
  }, [updatePath]);

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    const currentPosition = rigidBodyRef.current.translation();

    // Move towards current waypoint or target
    let moveTarget = currentWaypoint || target;
    if (!moveTarget) {
      console.warn('No valid target for enemy movement');
      return;
    }
    
    const direction = new Vector3(
      moveTarget.x - currentPosition.x,
      0,
      moveTarget.z - currentPosition.z
    );

    // Check if we've reached the current waypoint
    if (currentWaypoint && direction.length() < WAYPOINT_THRESHOLD) {
      const nextWaypointIndex = currentPath.indexOf(currentWaypoint) + 1;
      if (nextWaypointIndex < currentPath.length) {
        setCurrentWaypoint(currentPath[nextWaypointIndex]);
      } else {
        setCurrentWaypoint(null);
      }
    }

    // Apply movement
    if (direction.length() > 0.1) {
      direction.normalize();
      const velocity = rigidBodyRef.current.linvel();
      
      // Add slight randomization to movement to prevent getting stuck
      const randomOffset = isStuck ? new Vector3(
        (Math.random() - 0.5) * 0.2,
        0,
        (Math.random() - 0.5) * 0.2
      ) : new Vector3();
      
      direction.add(randomOffset).normalize();

      rigidBodyRef.current.setLinvel({
        x: direction.x * moveSpeed,
        y: velocity.y,
        z: direction.z * moveSpeed
      });

      // Rotate enemy to face movement direction
      const angle = Math.atan2(direction.x, direction.z);
      rigidBodyRef.current.setRotation({ x: 0, y: angle, z: 0 });
    }
  });

  const handleDeath = () => {
    if (health <= 0) return;
    setHealth(0);
    
    // Drop money on death
    useGameStore.getState().addMoney(1);
    
    // Update enemy count
    useGameStore.getState().setEnemiesAlive(prev => Math.max(0, prev - 1));
    
    // Check if level is complete
    if (useGameStore.getState().enemiesAlive <= 1) {
      useGameStore.getState().setLevelComplete(true);
    }
  };

  useEffect(() => {
    if (health <= 0) {
      console.log('Enemy died');
      handleDeath();
      onDeath();
    }
  }, [health, onDeath]);

  const handleHit = (damage: number, knockback: Vector3) => {
    if (!rigidBodyRef.current) return;

    console.log('Enemy taking damage:', damage, 'Current health:', health);
    setHealth(prev => prev - damage);
    setIsHit(true);

    // Apply knockback
    const currentVel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel(
      {
        x: currentVel.x + knockback.x,
        y: currentVel.y + knockback.y,
        z: currentVel.z + knockback.z
      },
      true
    );

    // Reset hit effect
    setTimeout(() => setIsHit(false), 200);
  };

  const handleCollision = (event: any) => {
    if (event.other.rigidBodyObject?.name === 'projectile') {
      const projectileData = event.other.rigidBodyObject.userData;
      const damage = projectileData.isAOE ? 15 : 20; // Less damage for AOE hits
      const projectileVel = event.other.rigidBody.linvel();
      const knockback = new Vector3(projectileVel.x, 0.5, projectileVel.z).normalize().multiplyScalar(5);
      handleHit(damage, knockback);
    }
  };

  if (health <= 0) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[position.x, position.y, position.z]}
      enabledRotations={[false, false, false]}
      type="dynamic"
      mass={1}
      restitution={0.2}
      friction={1}
      linearDamping={0.5}
      gravityScale={1}
      onCollisionEnter={handleCollision}
      userData={{ type: 'enemy', takeDamage: handleHit }}
    >
      <group>
        {/* Health bar */}
        <Html
          position={[0, ENEMY_SIZE * 2, 0]}
          center
          style={{
            width: '60px',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            width: '100%',
            height: '6px',
            background: '#333',
            border: '1px solid #000',
            borderRadius: '3px',
            overflow: 'hidden',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              background: health > 50 ? '#00ff00' : health > 25 ? '#ffff00' : '#ff0000',
              transition: 'all 0.2s',
              boxShadow: isHit ? '0 0 8px #fff' : 'none'
            }} />
          </div>
        </Html>

        {/* Enemy mesh */}
        <mesh castShadow scale={isHit ? 1.2 : 1}>
          <sphereGeometry args={[ENEMY_SIZE]} />
          <meshStandardMaterial
            color={isHit ? '#ff0000' : '#aa0000'}
            emissive={isHit ? '#ff0000' : '#000000'}
            emissiveIntensity={isHit ? 0.5 : 0}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}