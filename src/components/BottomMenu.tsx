import { useState, useEffect } from 'react';
import { useGameStore } from "../store/gameStore";
import { FaTimes } from "react-icons/fa";
import "../styles/BottomMenu.css";
import { ActiveSkill, activeSkills, } from "./skills/skills";
import { SkillsMenu } from "./skills/SkillsMenu/SkillsMenu";
import { castSkill } from './skills/SkillEffects/castSkill';
import { Vector3 } from "three";
import { CooldownOverlay } from "./skills/SkillsMenu/CooldownOverlay";
import { GiSpellBook } from 'react-icons/gi';

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
      // Convert key to number (1-8)
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
        // If a skill is selected in the menu, equip it to this slot
        equipSkill(selectedSkill, index);
        setSelectedSkill(null);
        setSelectedSkillSlot(null);
        setIsSkillsMenuOpen(false);
      } else {
        // Otherwise just select this slot
        setSelectedSkillSlot(index);
      }
    } else {
      if (skill) {
        // If slot has a skill and menu is closed, cast the skill
        handleCastSkill(skill);
      } else {
        // If slot is empty and menu is closed, open menu and select this slot
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
      <div className="bottom-menu">
        <div className="status-section">
          <div className="player-info">
            <div
              className="player-icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSkillsMenuOpen(true);
              }}
              title="Click to open Skills Menu"
            >
              <GiSpellBook />
            </div>
            <div className="level-info">
              <div className="level-number">Level {level}</div>
              <div className="xp-bar">
                <div
                  className="xp-progress"
                  style={{ width: `${xpProgress}%` }}
                  title={`${experience?.toLocaleString() || 0}/${xpForNextLevel.toLocaleString()} XP`}
                />
              </div>
              <div className="xp-text">
                {experience?.toLocaleString() || 0}/{xpForNextLevel.toLocaleString()} XP
              </div>
            </div>
          </div>
          <div className="resources">
            <div className="money" title="Gold">
              {money?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        <div className="skill-slots">
          {visibleSkills.map((skill, index) => (
            <div
              key={index}
              className={`skill-slot ${selectedSkillSlot === index ? 'selected' : ''} ${selectedSkill !== null ? 'slot-highlight' : ''} ${skill && skillCooldowns[skill.name] > 0 ? 'on-cooldown' : ''}`}
              onClick={() => handleSlotClick(index)}
              style={{
                borderColor: selectedSkillSlot === index ? (skill?.color || '#666') : '#666',
                boxShadow: selectedSkillSlot === index ? `0 0 10px ${skill?.color || '#666'}` : 'none'
              }}
            >
              {skill && (
                <>
                  <div className="skill-icon" style={{ color: skill.color }}>
                    <skill.icon size={32} />
                  </div>
                  {isSkillsMenuOpen && (
                    <button
                      className="unequip-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unequipSkill(index);
                      }}
                      title="Unequip skill"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {skillCooldowns[skill.name] > 0 && (
                    <CooldownOverlay
                      remainingTime={skillCooldowns[skill.name]}
                      totalTime={skill.cooldown}
                      color={skill.color}
                    />
                  )}
                </>
              )}
              {!isTouchDevice && (
                <div className="key-indicator">{index + 1}</div>
              )}
              <div className="slot-number">{index + 1}</div>
            </div>
          ))}
        </div>
      </div>
      <SkillsMenu isOpen={isSkillsMenuOpen} onClose={() => {
        setIsSkillsMenuOpen(false);
        setSelectedSkillSlot(null);
      }} />
    </>
  );
}
