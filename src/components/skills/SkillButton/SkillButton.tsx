import { useEffect } from "react";
import { useGameStore } from "../../../store/gameStore";
import { useSkillManager } from "../SkillManager/SkillManager";
import { ActiveSkill } from "../skills";
import { PrimarySkillButton } from "../../BottomMenu/Skills/Skills.styles";

interface SkillButtonProps {
  skill: ActiveSkill;
  isActive?: boolean;
  isHighlighted?: boolean;
  empty?: boolean;
}

export function SkillButton({ skill, isActive, isHighlighted, empty }: SkillButtonProps) {
  const { playerRef, skillLevels, toggleSkill } = useGameStore();
  const { cooldowns, castSkill, updateCooldowns } = useSkillManager();

  useEffect(() => {
    const interval = setInterval(() => {
      updateCooldowns();
    }, 100);

    return () => clearInterval(interval);
  }, [updateCooldowns]);

  const handleClick = () => {
    if (empty) return;
    
    const level = skillLevels[skill.name] || 0;
    if (skill.toggleable) {
      toggleSkill(skill.name);
      return;
    }

    castSkill(skill, playerRef, level);
  };

  const cooldown = cooldowns[skill.name] || 0;
  const isOnCooldown = cooldown > 0;

  return (
    <PrimarySkillButton
      color={skill.color}
      empty={empty}
      isActive={isActive}
      isOnCooldown={isOnCooldown}
      isHighlighted={isHighlighted}
      onClick={handleClick}
    >
      <skill.icon />
      {isOnCooldown && (
        <div className="cooldown-overlay" style={{ opacity: cooldown / skill.cooldown }} />
      )}
    </PrimarySkillButton>
  );
}
