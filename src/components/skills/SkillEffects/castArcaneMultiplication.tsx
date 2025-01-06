import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";


export function castArcaneMultiplication(position: Vector3, level: number) {
    const effect = {
        id: Math.random().toString(),
        type: 'arcaneMultiplication',
        position: position.clone(),
        startTime: Date.now(),
        duration: 8 + level * 0.5,
        radius: 4 + level * 0.5,
        color: '#8A2BE2'
    };
    activeEffects.push(effect);

    window.dispatchEvent(new CustomEvent('arcaneMultiplication', {
        detail: { multiplier: 3, duration: 8 + level * 0.5 }
    }));
}
