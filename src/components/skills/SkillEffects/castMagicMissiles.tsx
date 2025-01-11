import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";
import { useGameStore } from "../../../store/gameStore";

const MISSILE_COLOR = "#6bb7c8"; // Light blue
const INITIAL_SPEED = 15;

// Track the current arcane multiplication state
let arcaneMultiplier = 1;
let arcaneMultiplierEndTime = 0;

// Listen for arcane multiplication events
window.addEventListener('arcaneMultiplication', (e: any) => {
    arcaneMultiplier = e.detail.multiplier;
    arcaneMultiplierEndTime = Date.now() + e.detail.duration * 1000;
});

export const getMissileCount = (level: number) => {
    return 5 + level * 2;
};

export function castMagicMissiles(position: Vector3, level: number) {
    console.log("Casting Magic Missiles at position:", position.toArray());

    // Check if arcane multiplication is active
    const now = Date.now();
    const currentMultiplier = now < arcaneMultiplierEndTime ? arcaneMultiplier : 1;
    const missileCount = getMissileCount(level) * currentMultiplier;

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
