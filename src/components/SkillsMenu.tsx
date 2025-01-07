import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { GiFireBowl, GiSpeedometer, GiMagicSwirl, GiCrystalBall, GiInfinity, GiBoomerang, GiLightningStorm, GiMagicPalm, GiMagicShield, GiWaterSplash } from 'react-icons/gi';
import { RiFireFill, RiThunderstormsFill, RiContrastDrop2Fill, RiSwordFill, RiMagicFill } from 'react-icons/ri';
import { useGameStore } from "../store/gameStore";
import { Tabs, Tab, Box } from "@mui/material";
import "../styles/SkillsMenu.css";
import { getMissileCount } from "./skills/SkillEffects/castMagicMissiles";
import { getBoomerangCount } from "./skills/SkillEffects/castMagicBoomerang";

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
    maxLevel: 20,
    effect: (level: number) => ({ damage: 1 + level * 0.2 }),
  },
  {
    name: 'Swift Cast',
    description: 'Reduces spell cooldown by 10% per level',
    icon: GiSpeedometer,
    color: '#06b6d4',
    basePrice: 150,
    priceMultiplier: 1.5,
    maxLevel: 20,
    effect: (level: number) => ({ cooldownReduction: level * 0.1 }),
  },
  {
    name: 'Mystic Reach',
    description: 'Increases spell range by 15% per level',
    icon: GiMagicSwirl,
    color: '#2563eb',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    effect: (level: number) => ({ range: 1 + level * 0.15 }),
  },
  {
    name: 'Multi Orb',
    description: 'Adds 15% chance per level to cast an additional orb',
    icon: GiCrystalBall,
    color: '#ea580c',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 20,
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
    color: '#4F46E5',
    cooldown: 2,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Magic Boomerang',
    description: 'Launch a magical boomerang that damages enemies in its path',
    icon: GiBoomerang,
    color: '#10B981',
    cooldown: 4,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Arcane Nova',
    description: 'Release a burst of arcane energy, damaging nearby enemies',
    icon: GiMagicSwirl,
    color: '#EC4899',
    cooldown: 6,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Lightning Storm',
    description: 'Call down lightning strikes on random enemies',
    icon: GiLightningStorm,
    color: '#EAB308',
    cooldown: process.env.NODE_ENV === "development" ? 1 : 8,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Arcane Multiplication',
    description: 'Temporarily triple all your magical effects',
    icon: GiMagicPalm,
    color: '#9333EA',
    cooldown: 10,
    duration: 5,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
  },
  {
    name: 'Tsunami Wave',
    description: 'Summon a massive wave that damages and pushes back enemies',
    icon: GiWaterSplash,
    color: '#06B6D4',
    cooldown: 12,
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

  const renderSkillList = (skills: typeof passiveSkills) => (
    <div className="skills-grid">
      {skills.map((skill) => {
        const currentLevel = skillLevels[skill.name] || 0;
        const canAfford = skillPoints >= 1 && currentLevel < skill.maxLevel;
        const skillStats = 'effect' in skill ? '' : getSkillStats(skill as typeof activeSkills[0], currentLevel);

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
