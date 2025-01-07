import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";
const MISSILE_COLOR = "#6bb7c8"; // Light blue

const INITIAL_SPEED = 15;
export const getMissileCount = (level: number) => {
    return 5 + level * 2;
};
export function castMagicMissiles(position: Vector3, level: number) {
    console.log("Casting Magic Missiles at position:", position.toArray());

    const missileCount = getMissileCount(level);
    const baseDamage = 30;
    const damagePerLevel = 5;
    const damage = baseDamage + level * damagePerLevel;
    const missileRadius = 0.2;

    const angleStep = (2 * Math.PI) / missileCount;

    for (let i = 0; i < missileCount; i++) {
        const angle = i * angleStep;
        const horizontalDir = new Vector3(
            Math.cos(angle),
            0,
            Math.sin(angle)
        ).normalize();

        // Create initial velocity with upward and outward components
        const initialVelocity = new Vector3(
            horizontalDir.x * INITIAL_SPEED * 0.7, // Horizontal component
            INITIAL_SPEED, // Vertical component
            horizontalDir.z * INITIAL_SPEED * 0.7 // Horizontal component
        );

        const timeOffset = i * 0.08 / (level ** 0.5);
        const startPos = position.clone();
        startPos.y += 1;

        const effect = {
            id: Math.random().toString(),
            type: "magicMissile",
            position: startPos.clone(),
            startTime: Date.now() + timeOffset * 1000,
            duration: 8,
            radius: missileRadius,
            damage,
            color: MISSILE_COLOR,
            velocity: initialVelocity,
            phase: "rising" as const,
            timeOffset,
            spawnDir: horizontalDir,
        };

        console.log(
            "Created missile:",
            i,
            "at position:",
            effect.position.toArray(),
            "with velocity:",
            effect.velocity.toArray()
        );
        activeEffects.push(effect);
    }

    window.dispatchEvent(new CustomEvent("effectsChanged"));
}
