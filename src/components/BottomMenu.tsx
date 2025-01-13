import { useState, useEffect } from 'react';
import { useGameStore } from "../store/gameStore";
import { GiMissileSwarm } from 'react-icons/gi';
import { ActiveSkill, activeSkills } from "./skills/skills";
import { castSkill } from './skills/SkillEffects/castSkill';
import { Vector3 } from "three";
import {
  BottomMenuContainer,
  SkillsContainer,
  SkillSlot,
  JoystickContainer,
  PrimarySkillButton
} from './BottomMenu.styles';

export function BottomMenu() {
  const {
    equippedSkills,
    selectedSkillSlot,
    setSelectedSkillSlot,
    toggleSkill,
    skillLevels,
    playerRef,
    money,
    experience,
    level,
    equipSkill,
    baseSkillSlots,
    additionalSkillSlots,
  } = useGameStore();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: string]: number }>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Set Magic Missile as default skill in slot 1
  useEffect(() => {
    if (equippedSkills.length === 0 || !equippedSkills[0]) {
      const magicMissile = activeSkills.find(skill => skill.name === 'Magic Missiles');
      if (magicMissile) {
        equipSkill(magicMissile, 0);
      }
    }
  }, []);

  // Handle cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns(prev => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach(key => {
          if (newCooldowns[key] > 0) {
            newCooldowns[key] = Math.max(0, newCooldowns[key] - 0.1);
          }
        });
        return newCooldowns;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCastSkill = (skill: ActiveSkill) => {
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

    castSkill(skill, position, direction, level);

    setSkillCooldowns(prev => ({
      ...prev,
      [skill.name]: skill.cooldown
    }));
  };

  const handleSkillClick = (index: number) => {
    const skill = equippedSkills[index];
    if (!skill) return;

    if (skill.toggleable) {
      toggleSkill(skill.name);
    } else {
      handleCastSkill(skill);
    }
  };

  return (
    <BottomMenuContainer>
      <JoystickContainer />
      <SkillsContainer>
        {equippedSkills.map((skill, index) => {
          if (!skill) return null;
          
          return index === 0 ? (
            <PrimarySkillButton
              key={index}
              color={skill.color}
              onClick={() => handleSkillClick(index)}
            >
              <div className="skill-icon">
                <skill.icon size="100%" />
              </div>
            </PrimarySkillButton>
          ) : (
            <SkillSlot
              key={index}
              color={skill.color}
              isActive={skill.toggleable && skill.isActive}
              onClick={() => handleSkillClick(index)}
            >
              <div className="skill-icon">
                <skill.icon size="100%" />
              </div>
              {skillCooldowns[skill.name] > 0 && (
                <div className="cooldown">{skillCooldowns[skill.name].toFixed(1)}s</div>
              )}
            </SkillSlot>
          );
        })}
      </SkillsContainer>
    </BottomMenuContainer>
  );
}
