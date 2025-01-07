import { Vector3 } from "three";
import { useGameStore } from "../../../store/gameStore";
import { findNearestCreep } from "./SkillEffects";
import { activeEffects } from "./SkillEffects";

export const BOOMERANG_SPEED = 16; // Slightly faster

export const BOOMERANG_RETURN_DISTANCE = 15; // Shorter distance before return

export const getBoomerangCount = (level: number) => {
    return 1 + Math.round(level / 2)
};
export function castMagicBoomerang(position: Vector3, direction: Vector3, level: number) {
    const spawnOffset = new Vector3(0, 1, 0); // Spawn slightly above ground
    const spawnPos = position.clone().add(spawnOffset);

    // Find nearest enemy for targeting
    const creeps = useGameStore.getState().creeps;
    const nearestCreepInfo = findNearestCreep(spawnPos, creeps);

    let targetPos: Vector3;
    if (nearestCreepInfo) {
        targetPos = new Vector3(...nearestCreepInfo.creep.position);
    } else {
        // If no target, just go forward
        targetPos = spawnPos.clone().add(direction.clone().multiplyScalar(BOOMERANG_RETURN_DISTANCE));
    }

    // Calculate initial trajectory
    const toTarget = targetPos.clone().sub(spawnPos).normalize();
    const rightVector = new Vector3(toTarget.z, 0, -toTarget.x).normalize();

    // Spawn ~level+1/2 boomerangs with opposite curves, but closer together
    const spawnSpread = 0.5; // Reduced from default spread
    [...new Array(getBoomerangCount(level))].map(idx => idx % 2 === 0 ? 1 : -1).forEach((curve, idx) => {
        // Offset spawn position slightly to the side
        const offsetPos = spawnPos.clone().add(rightVector.clone().multiplyScalar(curve * spawnSpread));

        // add slight random offset for idx
        offsetPos.x += 1 * (idx - level / 2) * (Math.random() > 0.5 ? 1 : -1);
        offsetPos.z += 1 * (idx - level / 2) * (Math.random() > 0.5 ? 1 : -1);


        const effect = {
            id: Math.random().toString(),
            type: 'magicBoomerang',
            position: offsetPos,
            spawnPos: spawnPos.clone(),
            velocity: toTarget.clone().multiplyScalar(BOOMERANG_SPEED),
            curve,
            phase: 'outward' as const,
            damage: 20 + level * 5,
            age: 0,
            startTime: Date.now(),
            duration: 10,
            hasHitEnemy: false
        };

        console.log('Creating boomerang:', effect);
        activeEffects.push(effect);
    });
}
