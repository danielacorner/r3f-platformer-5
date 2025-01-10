import React, { useState, useEffect } from 'react';
import { useGameStore } from "../store/gameStore";
import { FaUser } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import "../styles/BottomMenu.css";
import { ActiveSkill, activeSkills, SkillsMenu } from "./SkillsMenu";
import { castLightningStorm } from './skills/SkillEffects/castLightningStorm';
import { castMagicMissiles } from './skills/SkillEffects/castMagicMissiles';
import { castMagicBoomerang } from './skills/SkillEffects/castMagicBoomerang';
import { castArcaneNova } from './skills/SkillEffects/castArcaneNova';
import { castArcaneMultiplication } from './skills/SkillEffects/castArcaneMultiplication';
import { Vector3 } from "three";
import { Tooltip } from "@mui/material";
import { GiMagicSwirl } from "react-icons/gi";

const SKILL_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface CooldownOverlayProps {
  remainingTime: number;
  totalTime: number;
  color: string;
}

function CooldownOverlay({ remainingTime, totalTime, color }: CooldownOverlayProps) {
  const progress = remainingTime / totalTime;
  const angle = progress * 360;

  const conicGradient = `conic-gradient(
    rgba(0, 0, 0, 0.5) ${angle}deg,
    rgba(0, 0, 0, 0.2) ${angle}deg
  )`;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="w-full h-full rounded-lg"
        style={{
          background: conicGradient,
          transform: 'rotate(-90deg)'
        }}
      />
      <div className="absolute text-white font-bold text-lg">
        {Math.ceil(remainingTime)}
      </div>
    </div>
  );
}

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
    equipSkill
  } = useGameStore();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: string]: number }>({});

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

    switch (skill.name) {
      case 'Magic Boomerang':
        castMagicBoomerang(position, direction, level);
        break;
      case 'Magic Missiles':
        castMagicMissiles(position, level);
        break;
      case 'Arcane Nova':
        castArcaneNova(position, level);
        break;
      case 'Lightning Storm':
        castLightningStorm(position, level);
        break;
      case 'Arcane Multiplication':
        castArcaneMultiplication(position, level);
        break;
      case 'Tsunami Wave':
        castTsunamiWave(position, direction, level);
        break;
    }

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
              <FaUser />
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
          {Array.from({ length: 8 }, (_, i) => {
            const skill = equippedSkills[i];
            const isSelected = selectedSkillSlot === i;
            const isHighlighted = selectedSkill !== null;
            const cooldown = skill ? skillCooldowns[skill.name] || 0 : 0;

            return (
              <div
                key={i}
                className={`skill-slot ${isSelected ? 'selected' : ''} ${isHighlighted ? 'slot-highlight' : ''
                  } ${cooldown > 0 ? 'on-cooldown' : ''}`}
                onClick={() => handleSlotClick(i)}
                style={{
                  borderColor: isSelected ? (skill?.color || '#666') : '#666',
                  boxShadow: isSelected ? `0 0 10px ${skill?.color || '#666'}` : 'none'
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
                          unequipSkill(skill, i);
                        }}
                        title="Unequip skill"
                      >
                        <FaTimes />
                      </button>
                    )}
                    {cooldown > 0 && (
                      <div className="cooldown-overlay" style={{
                        height: `${(cooldown / skill.cooldown) * 100}%`
                      }}>
                        {Math.ceil(cooldown)}s
                      </div>
                    )}
                  </>
                )}
                <div className="slot-number">{i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
      <SkillsMenu isOpen={isSkillsMenuOpen} onClose={() => {
        setIsSkillsMenuOpen(false);
        setSelectedSkillSlot(null);
      }} />
    </>
  );
}
