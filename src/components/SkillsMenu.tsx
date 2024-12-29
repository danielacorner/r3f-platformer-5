import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaBolt,
  FaRunning,
  FaBullseye,
  FaShieldAlt,
  FaTimes,
  FaHourglassHalf,
  FaPlus,
} from "react-icons/fa";
import { GiMultipleTargets } from "react-icons/gi";
import { GiFireBowl, GiSpeedometer, GiMagicSwirl, GiCrystalBall } from 'react-icons/gi';
import { RiShieldFlashFill, RiThunderstormsFill, RiFireFill, RiContrastDrop2Fill } from 'react-icons/ri';
import { useGameStore } from "../store/gameStore";
import { Tabs, Tab, Box } from "@mui/material";

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const passiveSkills = [
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

const activeSkills = [
  {
    name: 'Shield Burst',
    description: 'Creates a protective barrier that blocks projectiles',
    icon: RiShieldFlashFill,
    color: '#2563eb',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 3,
    cooldown: 15,
    duration: 5,
    effect: (level: number) => ({ shieldDuration: 3 + level * 1 }),
  },
  {
    name: 'Lightning Storm',
    description: 'Summons lightning strikes on nearby enemies',
    icon: RiThunderstormsFill,
    color: '#7c3aed',
    basePrice: 250,
    priceMultiplier: 1.5,
    maxLevel: 3,
    cooldown: 20,
    effect: (level: number) => ({ strikeDamage: 50 + level * 25 }),
  },
  {
    name: 'Inferno',
    description: 'Creates a ring of fire damaging nearby enemies',
    icon: RiFireFill,
    color: '#dc2626',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 3,
    cooldown: 25,
    duration: 8,
    effect: (level: number) => ({ burnDamage: 20 + level * 15 }),
  },
  {
    name: 'Time Dilation',
    description: 'Slows down enemies in an area',
    icon: RiContrastDrop2Fill,
    color: '#0891b2',
    basePrice: 350,
    priceMultiplier: 1.5,
    maxLevel: 3,
    cooldown: 30,
    duration: 6,
    effect: (level: number) => ({ slowAmount: 0.3 + level * 0.2 }),
  },
];

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const [activeTab, setActiveTab] = useState<'passive' | 'active'>('passive');
  const { skillPoints, upgrades, upgradeSkill, skillLevels } = useGameStore();

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
        const canAfford = skillPoints >= 1 && currentLevel < skill.maxLevel;

        // Calculate cumulative effect
        let effectText = '';
        if (currentLevel > 0) {
          const effect = skill.effect(currentLevel);
          if ('damage' in effect) {
            effectText = `Current: +${Math.round((effect.damage - 1) * 100)}% damage`;
          } else if ('cooldownReduction' in effect) {
            effectText = `Current: ${Math.round(effect.cooldownReduction * 100)}% cooldown reduction`;
          } else if ('range' in effect) {
            effectText = `Current: +${Math.round((effect.range - 1) * 100)}% range`;
          } else if ('multiCast' in effect) {
            effectText = `Current: ${Math.round(effect.multiCast * 100)}% multi-cast chance`;
          }
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
              color: '#94a3b8',
              '&.Mui-selected': {
                color: '#3b82f6',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3b82f6',
            }
          }}
        >
          <Tab label="Passive Skills" value="passive" />
          <Tab label="Active Skills" value="active" />
        </Tabs>
      </Box>

      <div className="skills-content">
        {activeTab === 'passive' ? renderSkillList(passiveSkills) : renderSkillList(activeSkills)}
      </div>
    </div>,
    document.body
  );
}
