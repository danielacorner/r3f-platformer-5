import React from 'react';
import { Vector3 } from '@react-three/rapier';
import { useGameStore } from '../../../store/gameStore';
import { SkillsContainer, PrimarySkillContainer, SecondarySkillsContainer } from './Skills.styles';
import { SkillButton } from './SkillButton';
import { SecondarySkillButton } from './SecondarySkillButton';
import { castSkill } from '../../skills/SkillEffects/castSkill';

export const SkillsSection: React.FC = () => {
  const {
    equippedSkills,
    primarySkill,
    maxSkillSlots,
    playerRef,
    level,
  } = useGameStore();

  const handleCastSkill = (skill: any) => {
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

    castSkill(skill, position, direction, skill.level || level);
  };

  return (
    <SkillsContainer>
      <PrimarySkillContainer>
        <SkillButton
          skill={primarySkill}
          onClick={() => primarySkill && handleCastSkill(primarySkill)}
          color={primarySkill?.color}
          empty={!primarySkill}
        />

        <SecondarySkillsContainer>
          {Array.from({ length: maxSkillSlots }).map((_, index) => {
            const skill = equippedSkills[index + 1];
            return (
              <SecondarySkillButton
                key={index}
                skill={skill}
                onClick={() => skill && handleCastSkill(skill)}
                color={skill?.color}
                empty={!skill}
                index={index}
                total={maxSkillSlots}
              />
            );
          })}
        </SecondarySkillsContainer>
      </PrimarySkillContainer>
    </SkillsContainer>
  );
};
