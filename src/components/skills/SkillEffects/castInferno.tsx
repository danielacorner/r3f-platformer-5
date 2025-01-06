import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";


export function castInferno(position: Vector3, level: number) {
    const effect = {
        id: Math.random().toString(),
        type: 'inferno',
        position: position.clone(),
        startTime: Date.now(),
        duration: 3 + level,
        radius: 4 + level * 0.5,
        damage: 20 + level * 15,
        color: '#dc2626'
    };
    activeEffects.push(effect);
}
