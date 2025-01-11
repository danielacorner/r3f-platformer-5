import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { useGameStore } from "../../../store/gameStore";
import { Tabs, Tab, Box } from "@mui/material";
import "../../../styles/SkillsMenu.css";
import { getMissileCount } from "../SkillEffects/castMagicMissiles";
import { getBoomerangCount } from "../SkillEffects/castMagicBoomerang";
import { ActiveSkill, activeSkills, MagicSchool, magicSchools, PassiveSkill, passiveSkills } from "../skills";

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}


export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const [activeSchool, setActiveSchool] = useState<MagicSchool>('arcane');
  const {
    skillPoints,
    upgradeSkill,
    skillLevels,
    equippedSkills,
    selectedSkillSlot,
    selectedSkill,
    setSelectedSkill,
    equipSkill,
    setSelectedSkillSlot
  } = useGameStore();

  const handleUpgrade = (skillName: string) => {
    const skills = [...activeSkills, ...passiveSkills];
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return;

    const currentLevel = skillLevels[skillName] || 0;
    if (currentLevel >= skill.maxLevel) return;

    if (skillPoints >= 1) {
      upgradeSkill(skillName, 1); // Using 1 skill point instead of money
    }
  };

  const handleSkillClick = (skill: ActiveSkill) => {
    if (selectedSkillSlot !== null) {
      // If a slot is selected, equip the skill directly
      equipSkill(skill, selectedSkillSlot);
      setSelectedSkill(null);
      setSelectedSkillSlot(null);
      onClose();
    } else {
      // Otherwise, select this skill for later equipping
      setSelectedSkill(skill);
      // Clear slot selection when selecting a skill
      setSelectedSkillSlot(null);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const getSkillStats = (skill: typeof activeSkills[0], level: number) => {
    switch (skill.name) {
      case 'Magic Missiles':
        return `Missiles: ${getMissileCount(level)}`;
      case 'Magic Boomerang':
        return `Boomerangs: ${getBoomerangCount(level)}`;
      case 'Arcane Nova':
        return `Damage: ${Math.round((10 + level * 5) * 10) / 10}`;
      case 'Lightning Storm':
        return `Lightning Bolts: ${3 + Math.floor(level / 4)}`;
      case 'Arcane Multiplication':
        return `Spell Copies: ${1 + Math.floor(level / 4)}`;
      case 'Tsunami Wave':
        return `Wave Size: ${Math.round((1 + level * 0.2) * 10) / 10}x`;
      default:
        return '';
    }
  };

  const renderSkillList = (skills: (PassiveSkill | ActiveSkill)[]) => (
    <div className="skills-grid">
      {skills.map((skill) => {
        const currentLevel = skillLevels[skill.name] || 0;
        const canAfford = skillPoints >= 1 && currentLevel < skill.maxLevel;
        const skillStats = 'effect' in skill ? '' : getSkillStats(skill as typeof activeSkills[0], currentLevel);
        const isEquipped = equippedSkills.some(s => s?.name === skill.name);
        const isSelected = selectedSkill?.name === skill.name;

        let effectText = '';
        if ('effect' in skill) {
          const effects = skill.effect?.(currentLevel);
          effectText = Object.entries(effects)
            .map(([key, value]) => {
              // Format the key by converting camelCase to Title Case with spaces
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());

              // Format the value based on if it's a percentage or not
              const formattedValue = key.toLowerCase().includes('chance') ||
                key.toLowerCase().includes('reduction')
                ? `${Math.round(Number(value) * 100)}%`
                : Math.round(Number(value) * 10) / 10;

              return `${formattedKey}: ${formattedValue}`;
            })
            .join(' | ');
        }

        return (
          <div
            key={skill.name}
            className={`skill-item ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}`}
            onClick={() => !('effect' in skill) && handleSkillClick(skill as ActiveSkill)}
            style={{
              boxShadow: isSelected ? `0 0 16px ${skill.color} inset` : 'none',
              cursor: !('effect' in skill) ? 'pointer' : 'default'
            }}
          >
            <div className="skill-background-icon" aria-hidden="true">
              <skill.icon />
            </div>
            <div className="skill-icon" style={{ borderColor: skill.color }}>
              <skill.icon />
            </div>
            <div className="skill-info">
              <h3>{skill.name}</h3>
              <p>{skill.description}</p>
              {effectText && <p className="skill-effect">{effectText}</p>}
              {'duration' in skill && (
                <p className="skill-duration">
                  <span className="stat-label">Duration:</span> {skill.duration}s
                </p>
              )}
              {'cooldown' in skill && (
                <p className="skill-cooldown">
                  <span className="stat-label">Cooldown:</span> {skill.cooldown}s
                </p>
              )}
              {!('effect' in skill) && skillStats && (
                <p className="skill-stats">{skillStats}</p>
              )}
            </div>
            <div className="skill-level">
              Level {currentLevel}/{skill.maxLevel}
            </div>
            {currentLevel < skill.maxLevel ? (
              <button
                className="skill-upgrade-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade(skill.name);
                }}
                disabled={!canAfford}
                title={`Upgrade (1 SP)`}
              >
                <FaPlus />
              </button>
            ) : (
              <div className="skill-maxed">MAX</div>
            )}
            {isEquipped && (
              <div className="equipped-indicator" style={{ color: skill.color }}>
                (Equipped)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(
    <div className="skills-menu" onClick={handleMenuClick} onWheel={handleScroll}>
      <div className="skills-header">
        <h2>Magic Skills</h2>
        <div className="header-right">
          <div className="skill-points">
            <FaStar className="text-yellow-400" />
            <span>{skillPoints} {window.innerWidth < 640 ? "" : "skill points"}</span>
          </div>
          <button
            className="close-icon-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeSchool}
          onChange={(_, newValue) => setActiveSchool(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              flexGrow: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: magicSchools[activeSchool].color,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: magicSchools[activeSchool].color,
            }
          }}
        >
          {Object.entries(magicSchools).map(([key, school]) => (
            <Tab
              key={key}
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <school.icon style={{ color: school.color }} />
                  {school.name}
                </div>
              }
              value={key}
            />
          ))}
        </Tabs>
      </Box>

      <div className="skills-content">
        <div className="school-description" style={{ color: magicSchools[activeSchool].color, marginBottom: '1rem', textShadow: '0px 0px 24px rgba(255, 255, 255, 0.99)' }}>
          {magicSchools[activeSchool].description}
        </div>

        {renderSkillList([
          ...activeSkills.filter(skill => skill.school === activeSchool),
          ...passiveSkills.filter(skill => skill.school === activeSchool)
        ])}
      </div>
    </div>,
    document.body
  );
}
