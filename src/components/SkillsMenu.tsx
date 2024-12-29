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
    description: 'Increases magic damage',
    icon: GiFireBowl,
    color: '#9333ea',
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ damage: 1 + level * 0.2 }),
  },
  {
    name: 'Swift Cast',
    description: 'Reduces spell cooldown',
    icon: GiSpeedometer,
    color: '#06b6d4',
    basePrice: 150,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ cooldownReduction: level * 0.1 }),
  },
  {
    name: 'Mystic Reach',
    description: 'Increases spell range',
    icon: GiMagicSwirl,
    color: '#2563eb',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 5,
    effect: (level: number) => ({ range: 1 + level * 0.15 }),
  },
  {
    name: 'Multi Orb',
    description: 'Chance to cast an additional orb',
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
  const { skillPoints, upgrades, upgradeSkill, money, skillLevels } = useGameStore();

  const handleUpgrade = (skillName: string) => {
    const skills = activeTab === 'passive' ? passiveSkills : activeSkills;
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return;

    const currentLevel = skillLevels[skillName] || 0;
    if (currentLevel >= skill.maxLevel) return;

    const price = Math.floor(skill.basePrice * Math.pow(skill.priceMultiplier, currentLevel));
    if (money >= price) {
      upgradeSkill(skillName, price);
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
        const price = Math.floor(
          skill.basePrice * Math.pow(skill.priceMultiplier, currentLevel)
        );
        const canAfford = money >= price && currentLevel < skill.maxLevel;

        return (
          <div
            key={skill.name}
            className={`skill-card ${canAfford ? 'can-afford' : ''}`}
            onClick={() => handleUpgrade(skill.name)}
          >
            <div className="skill-icon" style={{ borderColor: skill.color }}>
              <skill.icon />
            </div>
            <div className="skill-info">
              <h3>{skill.name}</h3>
              <p>{skill.description}</p>
              {'duration' in skill && (
                <p className="skill-duration">Duration: {skill.duration}s</p>
              )}
              {'cooldown' in skill && (
                <p className="skill-cooldown">Cooldown: {skill.cooldown}s</p>
              )}
              <div className="skill-level">
                Level {currentLevel}/{skill.maxLevel}
              </div>
              {currentLevel < skill.maxLevel ? (
                <div className={`skill-price ${canAfford ? 'can-afford' : ''}`}>
                  {price}
                </div>
              ) : (
                <div className="skill-maxed">MAXED</div>
              )}
            </div>
          </div>
        );
      })}
    </div >
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
