import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";


export function castArcaneNova(position: Vector3, level: number) {
    const waveCount = 2 + Math.floor(level / 2); // Fewer waves
    const baseDamage = 50 + level * 20; // More damage
    const baseRadius = 3;
    const expansionSpeed = 12; // Faster expansion
    const waveDuration = 0.6; // Shorter duration
    const waveSpacing = 0.12; // Less delay between waves

    for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
            const effect = {
                id: Math.random().toString(),
                type: 'arcaneNova',
                position: position.clone(),
                startTime: Date.now(),
                duration: waveDuration,
                radius: baseRadius,
                damage: baseDamage * (1 - i * 0.15),
                color: '#8A2BE2',
                expansionSpeed: expansionSpeed * (1 + i * 0.2)
            };
            activeEffects.push(effect);
        }, i * waveSpacing * 1000);
    }
}
