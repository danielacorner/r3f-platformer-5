import { useGameStore } from "../../../store/gameStore";
import {
  SkillsContainerWrapper,
  PrimarySkillContainer,
  SecondarySkillsContainer,
  SkillSlot,
} from "./SkillsContainer.styles";
import { castSkill } from "../SkillEffects/castSkill";
import { PrimarySkillButton } from "../../BottomMenu/Skills/Skills.styles";
import { Vector3 } from "three";
import { useCallback, useEffect, useState } from "react";
import { ActiveSkill, activeSkills } from "../skills";

export function SkillsContainer() {
  const {
    equippedSkills,
    primarySkill,
    maxSkillSlots,
    playerRef,
    toggleSkill,
    selectedSkill,
    equipSkill,
    skillLevels,
  } = useGameStore();
  const [skillCooldowns, setSkillCooldowns] = useState<{
    [key: string]: number;
  }>({});

  // Set Magic Missile as default skill in slot 1
  useEffect(() => {
    if (
      Object.values(equippedSkills).length === 0 ||
      !Object.values(equippedSkills)[0]
    ) {
      const magicMissile = activeSkills.find(
        (skill) => skill.name === "Magic Missiles"
      );
      if (magicMissile) {
        equipSkill(magicMissile, 0);
      }
    }
  }, []);

  // Handle cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns((prev) => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach((key) => {
          if (newCooldowns[key] > 0) {
            newCooldowns[key] = Math.max(0, newCooldowns[key] - 0.1);
          }
        });
        return newCooldowns;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCastSkill = useCallback(
    (skill: ActiveSkill) => {
      const level = skillLevels[skill.name] || 0;
      if (level === 0) return;

      if (skill.toggleable) {
        toggleSkill(skill.name);
        return;
      }

      const cooldown = skillCooldowns[skill.name] || 0;
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

      castSkill(skill, position, direction, skill.level ?? 1);

      setSkillCooldowns((prev) => ({
        ...prev,
        [skill.name]: skill.cooldown,
      }));
    },
    [
      playerRef,
      skillLevels,
      skillCooldowns,
      setSkillCooldowns,
      castSkill,
      toggleSkill,
    ]
  );

  return (
    <SkillsContainerWrapper>
      <PrimarySkillContainer>
        <PrimarySkillButton
          color={primarySkill?.color}
          empty={!primarySkill}
          isHighlighted={selectedSkill !== null}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedSkill) {
              equipSkill(selectedSkill, 0);
            } else if (primarySkill) {
              handleCastSkill(primarySkill);
            }
          }}
        >
          {primarySkill && <primarySkill.icon size="100%" />}
        </PrimarySkillButton>

        <SecondarySkillsContainer>
          {Array.from({ length: maxSkillSlots }).map((_, index) => {
            const slotIndex = index + 1;
            const skill = equippedSkills[slotIndex];
            return (
              <SkillSlot
                key={index}
                color={skill?.color}
                isActive={skill?.isActive}
                index={index}
                total={maxSkillSlots}
                empty={!skill}
                isHighlighted={selectedSkill !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedSkill) {
                    equipSkill(selectedSkill, slotIndex);
                  } else if (skill) {
                    handleCastSkill(skill);
                  }
                }}
              >
                {skill && <skill.icon size="100%" />}
              </SkillSlot>
            );
          })}
        </SecondarySkillsContainer>
      </PrimarySkillContainer>
    </SkillsContainerWrapper>
  );
}
