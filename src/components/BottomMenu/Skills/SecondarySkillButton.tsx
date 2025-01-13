import React, { useState, useEffect, useCallback } from "react";
import { SkillSlot, CooldownOverlay, CooldownText } from "./Skills.styles";
import { ActiveSkill } from "../../skills/skills";
import { useGameStore } from "../../../store/gameStore";

interface SecondarySkillButtonProps {
  skill: ActiveSkill | null;
  onClick: () => void;
  color?: string;
  empty?: boolean;
  isActive?: boolean;
  index: number;
  total: number;
}

export const SecondarySkillButton: React.FC<SecondarySkillButtonProps> = ({
  skill,
  onClick,
  color,
  empty,
  isActive,
  index,
  total,
}) => {
  const [cooldown, setCooldown] = useState(0);
  const [isClicked, setIsClicked] = useState(false);
  const { selectedSkill } = useGameStore();
  console.log(
    "🚀 ~ file: SecondarySkillButton.tsx:28 ~ selectedSkill:",
    selectedSkill
  );

  useEffect(() => {
    if (skill?.lastUsed && skill?.cooldown) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - skill.lastUsed) / 1000;
        const remaining = Math.max(0, skill.cooldown - elapsed);
        setCooldown(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [skill?.lastUsed, skill?.cooldown]);

  const handleClick = useCallback(() => {
    if (cooldown > 0) return;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick();
  }, [cooldown, onClick]);

  const isOnCooldown = cooldown > 0;
  const cooldownProgress = isOnCooldown ? cooldown / (skill?.cooldown || 1) : 0;

  return (
    <SkillSlot
      color={color}
      empty={empty}
      isActive={isActive}
      isOnCooldown={isOnCooldown}
      index={index}
      total={total}
      onClick={handleClick}
      className={isClicked ? "clicked" : ""}
      isHighlighted={selectedSkill !== null}
    >
      {skill?.icon && <skill.icon size="100%" />}
      {isOnCooldown && (
        <>
          <CooldownOverlay progress={cooldownProgress} color={color} />
          <CooldownText>{Math.ceil(cooldown)}s</CooldownText>
        </>
      )}
    </SkillSlot>
  );
};
