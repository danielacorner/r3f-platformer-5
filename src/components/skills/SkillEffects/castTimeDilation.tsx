import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";


export function castTimeDilation(position: Vector3, level: number) {
    const effect = {
        id: Math.random().toString(),
        type: 'timeDilation',
        position: position.clone(),
        startTime: Date.now(),
        duration: 5 + level,
        radius: 6 + level,
        color: '#0891b2',
        level
    };
    activeEffects.push(effect);
}
