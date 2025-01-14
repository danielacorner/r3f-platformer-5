import { Vector3 } from "three";
import { create } from "zustand";
import { ActiveSkill } from "../skills";
import { castSkill } from "../SkillEffects/castSkill";

interface SkillManagerState {
  cooldowns: { [key: string]: number };
  setCooldown: (skillName: string, cooldown: number) => void;
  updateCooldowns: () => void;
  castSkill: (skill: ActiveSkill, playerRef: any, level: number) => void;
}

export const useSkillManager = create<SkillManagerState>((set, get) => ({
  cooldowns: {},

  setCooldown: (skillName: string, cooldown: number) =>
    set((state) => ({
      cooldowns: { ...state.cooldowns, [skillName]: cooldown },
    })),

  updateCooldowns: () =>
    set((state) => {
      const newCooldowns = { ...state.cooldowns };
      Object.keys(newCooldowns).forEach((key) => {
        if (newCooldowns[key] > 0) {
          newCooldowns[key] = Math.max(0, newCooldowns[key] - 0.1);
        }
      });
      return { cooldowns: newCooldowns };
    }),

  castSkill: (skill: ActiveSkill, playerRef: any, level: number) => {
    const state = get();
    if (level === 0) return;

    const cooldown = state.cooldowns[skill.name] || 0;
    if (cooldown > 0) return;

    if (!playerRef) return;
    const playerPosition = playerRef.translation();
    if (!playerPosition) return;

    const position = new Vector3(playerPosition.x, 1, playerPosition.z);
    let direction: Vector3;

    if (window.gameState?.mousePosition) {
      const mousePos = new Vector3(
        window.gameState.mousePosition.x,
        0,
        window.gameState.mousePosition.z
      );
      direction = mousePos.clone().sub(position).normalize();
    } else {
      direction = new Vector3(0, 0, 1);
    }

    castSkill(skill, position, direction, level);
    
    // Only start cooldown for non-toggleable skills or when deactivating toggleable skills
    if (!skill.toggleable) {
      state.setCooldown(skill.name, skill.cooldown);
    }
  },
}));
