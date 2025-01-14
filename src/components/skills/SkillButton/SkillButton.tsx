import React from "react";
import { useSkillManager } from "../SkillManager/SkillManager";
import { PrimarySkillButton, CooldownOverlay, CooldownText } from "../../BottomMenu/Skills/Skills.styles";
import { Skill } from "../../../types/skills";

interface SkillButtonProps {
  skill: Skill | null;
  isHighlighted?: boolean;
  onClick?: (skill: Skill) => void;
}

export const SkillButton: React.FC<SkillButtonProps> = ({
  skill,
  isHighlighted = false,
  onClick,
}) => {
  const { cooldowns, handleCastSkill } = useSkillManager();

  const handleClick = () => {
    if (!skill) return;
    
    const cooldown = cooldowns[skill.id];
    if (cooldown && cooldown > 0) return;

    if (onClick) {
      onClick(skill);
    } else {
      handleCastSkill(skill);
    }
  };

  const getCooldownProgress = () => {
    if (!skill || !cooldowns[skill.id]) return 0;
    return cooldowns[skill.id] / skill.cooldown;
  };

  const formatCooldown = (seconds: number) => {
    return seconds.toFixed(1);
  };

  return (
    <PrimarySkillButton
      empty={!skill}
      color={skill?.color}
      isHighlighted={isHighlighted}
      isOnCooldown={skill && cooldowns[skill.id] > 0}
      onClick={handleClick}
    >
      {skill?.icon}
      {skill && cooldowns[skill.id] > 0 && (
        <>
          <CooldownOverlay
            progress={getCooldownProgress()}
            color={skill.color}
          />
          <CooldownText>
            {formatCooldown(cooldowns[skill.id])}
          </CooldownText>
        </>
      )}
    </PrimarySkillButton>
  );
};
