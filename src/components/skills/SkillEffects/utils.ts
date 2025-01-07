import { Vector3 } from 'three';

export function findNearestCreep(position: Vector3, creeps: any[]) {
  let nearestDist = Infinity;
  let nearestCreep = null;
  let nearestPos = null;

  for (const creep of creeps) {
    if (creep.isDead) continue;
    
    const creepPos = new Vector3(...creep.position);
    const dist = position.distanceTo(creepPos);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestCreep = creep;
      nearestPos = creepPos;
    }
  }

  if (nearestCreep && nearestPos) {
    return { creep: nearestCreep, position: nearestPos, distance: nearestDist };
  }
  return null;
}
