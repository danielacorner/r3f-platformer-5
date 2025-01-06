import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";


export function castLightningStorm(position: Vector3, level: number) {
    const strikeCount = 3 + level;
    const radius = 5 + level;
    const damage = 50 + level * 25;

    for (let i = 0; i < strikeCount; i++) {
        setTimeout(() => {
            const angle = (i / strikeCount) * Math.PI * 2;
            const x = position.x + Math.cos(angle) * (radius / 2);
            const z = position.z + Math.sin(angle) * (radius / 2);

            const effect = {
                id: Math.random().toString(),
                type: 'lightning',
                position: new Vector3(x, position.y, z),
                startTime: Date.now(),
                duration: 0.5,
                radius: 2,
                damage,
                color: '#7c3aed'
            };
            activeEffects.push(effect);
        }, i * 200);
    }
}
