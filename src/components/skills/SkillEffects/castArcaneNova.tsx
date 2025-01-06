import { Vector3 } from "three";
import { activeEffects } from "./SkillEffects";

export function castArcaneNova(position: Vector3, level: number) {
  console.log('Casting Arcane Nova at position:', position.toArray());

  const effect = {
    id: Math.random().toString(),
    type: 'arcaneNova',
    position: position.clone().setY(1), // Raise it off the ground
    startTime: Date.now(),
    duration: 1.0,
    radius: 8 + level * 2, // Larger radius
    damage: 30 + level * 10,
    color: '#8B5CF6',
    expansionSpeed: 10,
    level
  };

  activeEffects.push(effect);
}
