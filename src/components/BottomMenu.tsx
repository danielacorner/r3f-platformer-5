import { useState, useEffect } from 'react';
import { useGameStore } from "../store/gameStore";
import { FaTimes } from "react-icons/fa";
import { ActiveSkill, activeSkills } from "./skills/skills";
import { SkillsMenu } from "./skills/SkillsMenu/SkillsMenu";
import { castSkill } from './skills/SkillEffects/castSkill';
import { Vector3 } from "three";
import { CooldownOverlay } from "./skills/SkillsMenu/CooldownOverlay";
import { GiSpellBook } from 'react-icons/gi';
import {
  BottomMenuContainer,
  StatusSection,
  PlayerInfo,
  PlayerIcon,
  LevelInfo,
  LevelNumber,
  XPProgressBar,
  XPProgressFill,
  XPText,
  Resources,
  Money,
  SkillSlots,
  SkillSlot,
  SkillHotkey,
  UnequipButton
} from './BottomMenu.styles';

export function BottomMenu() {
  const {
    equippedSkills,
    selectedSkill,
    selectedSkillSlot,
    setSelectedSkillSlot,
    setSelectedSkill,
    unequipSkill,
    playerRef,
    skillLevels,
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

  // Handle keyboard shortcuts
  useEffect(() => {
    if (isTouchDevice || isSkillsMenuOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        const index = num - 1;
        const skill = equippedSkills[index];
        if (skill) {
          handleCastSkill(skill);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [equippedSkills, isSkillsMenuOpen, isTouchDevice]);

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

  const handleSlotClick = (index: number) => {
    const skill = equippedSkills[index];

    if (isSkillsMenuOpen) {
      if (selectedSkill) {
        equipSkill(selectedSkill, index);
        setSelectedSkill(null);
        setSelectedSkillSlot(null);
      } else {
        setSelectedSkillSlot(index);
      }
    } else {
      if (skill) {
        handleCastSkill(skill);
      } else {
        setSelectedSkillSlot(index);
        setIsSkillsMenuOpen(true);
      }
    }
  };

  // Calculate XP progress
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, level - 1));
  const xpProgress = (experience / xpForNextLevel) * 100;

  const totalSkillSlots = baseSkillSlots + additionalSkillSlots;
  const visibleSkills = equippedSkills.slice(0, totalSkillSlots);

  return (
    <>
      <BottomMenuContainer onClick={(e) => e.stopPropagation()}>
        <StatusSection>
          <PlayerInfo>
            <PlayerIcon
              onClick={(e) => {
                e.stopPropagation();
                setIsSkillsMenuOpen(true);
              }}
              title="Click to open Skills Menu"
            >
              <GiSpellBook />
            </PlayerIcon>
            <LevelInfo>
              <LevelNumber>
                Level {level}
                <XPProgressBar>
                  <XPProgressFill progress={xpProgress} />
                </XPProgressBar>
              </LevelNumber>
              <XPText>
                {experience?.toLocaleString() || 0}/{xpForNextLevel.toLocaleString()} XP
              </XPText>
            </LevelInfo>
          </PlayerInfo>
          <Resources>
            <Money title="Gold">
              {money?.toLocaleString() || 0}
            </Money>
          </Resources>
        </StatusSection>

        <SkillSlots>
          {visibleSkills.map((skill, index) => (
            <SkillSlot
              key={index}
              isSelected={selectedSkillSlot === index}
              isHighlightEmpty={selectedSkill !== null && !skill}
              isOnCooldown={!!(skill && skillCooldowns[skill.name] > 0)}
              borderColor={skill?.color || '#666'}
              onClick={() => handleSlotClick(index)}
            >
              {skill && (
                <>
                  <div className="skill-icon" style={{ color: skill.color, width: '80%', height: '80%' }}>
                    <skill.icon size="100%" />
                  </div>
                  {!isTouchDevice && <SkillHotkey>{index + 1}</SkillHotkey>}
                  {isSkillsMenuOpen && (
                    <UnequipButton
                      className="unequip-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unequipSkill(index);
                      }}
                    >
                      <FaTimes />
                    </UnequipButton>
                  )}
                  {skillCooldowns[skill.name] > 0 && (
                    <CooldownOverlay
                      cooldown={skillCooldowns[skill.name]}
                      maxCooldown={skill.cooldown}
                    />
                  )}
                </>
              )}
            </SkillSlot>
          ))}
        </SkillSlots>
      </BottomMenuContainer>

      {isSkillsMenuOpen && (
        <SkillsMenu isOpen={isSkillsMenuOpen} onClose={() => setIsSkillsMenuOpen(false)} />
      )}
    </>
  );
}
