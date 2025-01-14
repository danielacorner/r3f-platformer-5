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

export function SkillsContainer() {
  const {
    equippedSkills,
    primarySkill,
    maxSkillSlots,
    playerRef,
    level,
    selectedSkill,
    equipSkill,
  } = useGameStore();

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
              if (!playerRef) return;
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

              castSkill(
                primarySkill,
                position,
                direction,
                primarySkill.level || level
              );
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
                    if (!playerRef) return;
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
              </SkillSlot>
            );
          })}
        </SecondarySkillsContainer>
      </PrimarySkillContainer>
    </SkillsContainerWrapper>
  );
}
