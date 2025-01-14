import { useGameStore } from "../../../store/gameStore";

// Calculate total magic damage multiplier from passive skills
export const getMagicDamageMultiplier = () => {
  const { skillLevels } = useGameStore.getState();
  const arcanePowerLevel = skillLevels["Arcane Power"] || 0;
  
  // Base multiplier of 1 (100%) plus 20% per level of Arcane Power
  return 1 + arcanePowerLevel * 0.2;
};

// Apply passive effects to damage
export const applyPassiveEffects = (damage: number, damageType: "magic" | "lightning" | "frost" | "physical") => {
  const { skillLevels } = useGameStore.getState();
  
  let multiplier = 1;
  
  // Apply magic damage multiplier from Arcane Power
  if (damageType === "magic") {
    multiplier *= getMagicDamageMultiplier();
  }
  
  // Apply lightning damage multiplier from Storm Mastery
  if (damageType === "lightning") {
    const stormMasteryLevel = skillLevels["Storm Mastery"] || 0;
    multiplier *= (1 + stormMasteryLevel * 0.25);
  }
  
  // Apply frost damage multiplier from Frost Mastery
  if (damageType === "frost") {
    const frostMasteryLevel = skillLevels["Frost Mastery"] || 0;
    multiplier *= (1 + frostMasteryLevel * 0.25);
  }
  
  // Apply physical damage multiplier from Force Amplification
  if (damageType === "physical") {
    const forceAmpLevel = skillLevels["Force Amplification"] || 0;
    multiplier *= (1 + forceAmpLevel * 0.25);
  }
  
  return Math.round(damage * multiplier);
};
