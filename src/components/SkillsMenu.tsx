import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { GiFireBowl, GiSpeedometer, GiMagicSwirl, GiCrystalBall, GiInfinity, GiBoomerang } from 'react-icons/gi';
import { RiFireFill, RiThunderstormsFill, RiContrastDrop2Fill, RiSwordFill, RiMagicFill } from 'react-icons/ri';
import { useGameStore } from "../store/gameStore";
import { Tabs, Tab, Box } from "@mui/material";

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type Skill = PassiveSkill | ActiveSkill;

type PassiveSkill = {
  name: string;
  description: string;
  icon: any;
  color: string;
  basePrice: number;
  priceMultiplier: number;
  maxLevel: number;
  cooldown?: number;
  duration?: number;
  effect?: (level: number) => any;
};

export const passiveSkills: PassiveSkill[] = [
  {
    name: 'Arcane Power',
    description: 'Increases magic damage by 20% per level',
    icon: GiFireBowl,
    color: '#9333ea',
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ damage: 1 + level * 0.2 }),
  },
  {
    name: 'Swift Cast',
    description: 'Reduces spell cooldown by 10% per level',
    icon: GiSpeedometer,
    color: '#06b6d4',
    basePrice: 150,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ cooldownReduction: level * 0.1 }),
  },
  {
    name: 'Mystic Reach',
    description: 'Increases spell range by 15% per level',
    icon: GiMagicSwirl,
    color: '#2563eb',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ range: 1 + level * 0.15 }),
  },
  {
    name: 'Multi Orb',
    description: 'Adds 15% chance per level to cast an additional orb',
    icon: GiCrystalBall,
    color: '#ea580c',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ multiCast: level * 0.15 }),
  },
];

export interface ActiveSkill {
  name: string;
  icon: any;
  cooldown: number;
  currentCooldown?: number;
  color: string;
  level: number;
  description: string;
  duration?: number;
  maxLevel: number;
}
export const activeSkills: ActiveSkill[] = [
  {
    name: 'Magic Missiles',
    description: 'Launch multiple homing missiles that deal damage to enemies',
    icon: RiMagicFill,
    color: '#8b5cf6',
    cooldown: 5,
    level: 1,
    maxLevel: 20,
  },
  {
    name: 'Magic Boomerang',
    description: 'Cast two magical boomerangs that curve outward and return',
    icon: GiBoomerang,
    color: '#8b5cf6',
    cooldown: 5,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Arcane Nova',
    description: 'Release waves of arcane energy that expand outward, dealing heavy damage to enemies caught in the rings.',
    icon: GiMagicSwirl,
    color: '#2563eb',
    cooldown: 8,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 5,
  },
  {
    name: 'Lightning Storm',
    description: 'Summons lightning strikes on nearby enemies',
    icon: RiThunderstormsFill,
    color: '#7c3aed',
    cooldown: 16,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,

  },
  {
    name: 'Arcane Multiplication',
    description: 'Temporarily triples your magic orbs for devastating burst damage',
    icon: GiInfinity,
    color: '#8A2BE2',
    cooldown: 25,
    duration: 8,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Time Dilation',
    description: 'Slows down enemies in an area',
    icon: RiContrastDrop2Fill,
    color: '#0891b2',
    cooldown: 30,
    duration: 6,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
];

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const [activeTab, setActiveTab] = useState<'passive' | 'active'>('active');
  const { skillPoints, upgrades, upgradeSkill, skillLevels, } = useGameStore();

  const handleUpgrade = (skillName: string) => {
    const skills = activeTab === 'passive' ? passiveSkills : activeSkills;
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return;

    const currentLevel = skillLevels[skillName] || 0;
    if (currentLevel >= skill.maxLevel) return;

    if (skillPoints >= 1) {
      upgradeSkill(skillName, 1); // Using 1 skill point instead of money
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

  const renderSkillList = (skills: typeof passiveSkills) => (
    <div className="skills-grid">
      {skills.map((skill) => {
        const currentLevel = skillLevels[skill.name] || 0;
        console.log("🚀 ~ file: SkillsMenu.tsx:108 ~ currentLevel:", currentLevel, skill.maxLevel)
        const canAfford = skillPoints >= 1 && currentLevel < skill.maxLevel;

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
                ? `${Math.round(value * 100)}%`
                : Math.round(value * 10) / 10;

              return `${formattedKey}: ${formattedValue}`;
            })
            .join(' | ');
        }

        return (
          <div
            key={skill.name}
            className="skill-item"
          >
            <div className="skill-icon" style={{ borderColor: skill.color }}>
              <skill.icon />
            </div>
            <div className="skill-info">
              <h3>{skill.name}</h3>
              <p>{skill.description}</p>
              {effectText && <p className="skill-effect">{effectText}</p>}
              {'duration' in skill && (
                <p className="skill-duration">Duration: {skill.duration}s</p>
              )}
              {'cooldown' in skill && (
                <p className="skill-cooldown">Cooldown: {skill.cooldown}s</p>
              )}
              <div className="skill-level">
                Level {currentLevel}/{skill.maxLevel}
              </div>
            </div>
            {currentLevel < skill.maxLevel ? (
              <button
                className="skill-upgrade-btn"
                onClick={() => handleUpgrade(skill.name)}
                disabled={!canAfford}
                title={`Upgrade (1 SP)`}
              >
                <FaPlus />
              </button>
            ) : (
              <div className="skill-maxed">MAX</div>
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(
    <div className="skills-menu" onClick={handleMenuClick}>
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
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#3b82f6',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3b82f6',
            }
          }}
        >
          <Tab
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RiSwordFill />
                Active Skills
              </div>
            }
            value="active"
          />
          <Tab
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GiInfinity />
                Passive Skills
              </div>
            }
            value="passive"
          />
        </Tabs>
      </Box>

      <div className="skills-content">
        {activeTab === 'passive' ? renderSkillList(passiveSkills) : renderSkillList(activeSkills)}
      </div>
    </div>,
    document.body
  );
}
