import { useState } from "react";
import { useGameStore } from "../../../store/gameStore";
import { Vector3 } from "three";
import { castSkill } from "../SkillEffects/castSkill";
import {
  SkillsContainerWrapper,
  PrimarySkillContainer,
  PrimarySkillButton,
  SecondarySkillsContainer,
  SkillSlot,
} from "./SkillsContainer.styles";

export function SkillsContainer() {
  const {
    equippedSkills,
    primarySkill,
    maxSkillSlots,
    playerRef,
    level,
  } = useGameStore();

  const [skillCooldowns, setSkillCooldowns] = useState<{
    [key: string]: number;
  }>({});

  const handleCastSkill = (skill: any, position: Vector3, direction: Vector3) => {
    if (!skill) return;
    castSkill(skill, position, direction, skill.level || level);

    setSkillCooldowns((prev) => ({
      ...prev,
      [skill.name]: skill.cooldown,
    }));
  };

  return (
    <SkillsContainerWrapper>
      <PrimarySkillContainer>
        <PrimarySkillButton
          color={primarySkill?.color}
          empty={!primarySkill}
          onClick={(e) => {
            e.stopPropagation();
            if (primarySkill && playerRef) {
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
              
              handleCastSkill(primarySkill, position, direction);
            }
          }}
        >
          {primarySkill && <primarySkill.icon size="100%" />}
        </PrimarySkillButton>

        <SecondarySkillsContainer>
          {Array.from({ length: maxSkillSlots }).map((_, index) => {
            const skill = equippedSkills[index + 1];
            return (
              <SkillSlot
                key={index}
                color={skill?.color}
                isActive={skill?.isActive}
                index={index}
                total={maxSkillSlots}
                empty={!skill}
                onClick={(e) => {
                  e.stopPropagation();
                  if (skill && playerRef) {
                    const playerPosition = playerRef.translation();
                    if (!playerPosition) return;

                    const position = new Vector3(
                      playerPosition.x,
                      1,
                      playerPosition.z
                    );
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

                    handleCastSkill(skill, position, direction);
                  }
                }}
              >
                {skill && <skill.icon size="100%" />}
                {skill?.cooldown > 0 && (
                  <div className="cooldown">{skill.cooldown.toFixed(1)}s</div>
                )}
              </SkillSlot>
            );
          })}
        </SecondarySkillsContainer>
      </PrimarySkillContainer>
    </SkillsContainerWrapper>
  );
}
