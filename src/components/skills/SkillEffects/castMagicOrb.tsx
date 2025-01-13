import { Vector3 } from "three";
import { useGameStore } from "../../../store/gameStore";

export function castMagicOrb(
  position: Vector3,
  direction: Vector3,
  level: number
) {
  // Toggle the skill in the game store
  useGameStore.getState().toggleSkill("Magic Orb");

  // Dispatch a custom event to toggle the Magic Orb
  const toggleEvent = new CustomEvent("toggleMagicOrb", {
    detail: {
      isActive: true,
    },
  });
  window.dispatchEvent(toggleEvent);
}
