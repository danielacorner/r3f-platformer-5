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
import { Portal } from "@mui/material";

export function SkillsContainer() {
  const {
    equippedSkills,
    primarySkill,
    maxSkillSlots,
    playerRef,
    level,
    selectedSkill,
    equipSkill,
    setSelectedSkill,
    setSelectedSkillSlot,
  } = useGameStore();

  const handleSlotClick = (slot: number) => {
    if (selectedSkill) {
      equipSkill(selectedSkill, slot);
      setSelectedSkill(null);
      setSelectedSkillSlot(null);
    }
  };

  return (
    <Portal>
      <SkillsContainerWrapper>
        <PrimarySkillContainer>
          <PrimarySkillButton
            color={primarySkill?.color}
            empty={!primarySkill}
            isHighlighted={selectedSkill && !primarySkill}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedSkill) {
                equipSkill(selectedSkill, 0);
                setSelectedSkill(null);
                setSelectedSkillSlot(null);
              } else if (primarySkill && playerRef) {
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

                castSkill(primarySkill, position, direction, primarySkill.level || level);
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
                  isHighlighted={selectedSkill && !skill}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedSkill) {
                      handleSlotClick(index + 1);
                    } else if (skill && playerRef) {
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

                      castSkill(skill, position, direction, skill.level || level);
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
    </Portal>
  );
}
