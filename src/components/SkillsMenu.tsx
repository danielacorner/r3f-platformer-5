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
  school: MagicSchool;
};

type ActiveSkill = {
  name: string;
  icon: any;
  cooldown: number;
  currentCooldown?: number;
  color: string;
  level: number;
  description: string;
  duration?: number;
  maxLevel: number;
  school: MagicSchool;
}

export type MagicSchool = 'arcane' | 'storm' | 'water' | 'force' | 'frost';

export const magicSchools: Record<MagicSchool, {
  name: string;
  color: string;
  icon: any;
  description: string;
}> = {
  arcane: {
    name: 'Arcane',
    color: '#9333ea',
    icon: RiMagicFill,
    description: 'Fundamental magic focusing on raw magical energy and multiplication of effects'
  },
  storm: {
    name: 'Storm',
    color: '#eab308',
    icon: RiThunderstormsFill,
    description: 'Harness the power of lightning and thunder'
  },
  water: {
    name: 'Water',
    color: '#06b6d4',
    icon: RiContrastDrop2Fill,
    description: 'Control the flow of water and tidal forces'
  },
  force: {
    name: 'Force',
    color: '#10b981',
    icon: GiBoomerang,
    description: 'Manipulate kinetic energy and physical forces'
  },
  frost: {
    name: 'Frost',
    color: '#60a5fa',
    icon: GiMagicSwirl,
    description: 'Command ice and cold energies'
  }
};

export const passiveSkills: (PassiveSkill)[] = [
  // Arcane Skills
  {
    name: 'Arcane Power',
    description: 'Increases magic damage by 20% per level',
    icon: GiFireBowl,
    color: '#9333ea',
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'arcane',
    effect: (level: number) => ({ damage: 1 + level * 0.2 }),
  },
  {
    name: 'Multi Orb',
    description: 'Adds 15% chance per level to cast an additional orb',
    icon: GiCrystalBall,
    color: '#9333ea',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'arcane',
    effect: (level: number) => ({ multiCast: level * 0.15 }),
  },
  {
    name: 'Mana Mastery',
    description: 'Reduces mana cost of spells by 10% per level',
    icon: GiMagicPalm,
    color: '#9333ea',
    basePrice: 250,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'arcane',
    effect: (level: number) => ({ manaCost: 1 - level * 0.1 }),
  },
  // Storm Skills
  {
    name: 'Swift Cast',
    description: 'Reduces spell cooldown by 10% per level',
    icon: GiSpeedometer,
    color: '#eab308',
    basePrice: 150,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'storm',
    effect: (level: number) => ({ cooldownReduction: level * 0.1 }),
  },
  {
    name: 'Storm Mastery',
    description: 'Increases lightning damage by 25% per level',
    icon: RiThunderstormsFill,
    color: '#eab308',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'storm',
    effect: (level: number) => ({ lightningDamage: 1 + level * 0.25 }),
  },
  {
    name: 'Static Charge',
    description: 'Adds 15% chance per level to shock enemies',
    icon: GiLightningStorm,
    color: '#eab308',
    basePrice: 250,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'storm',
    effect: (level: number) => ({ shockChance: level * 0.15 }),
  },
  // Water Skills
  {
    name: 'Mystic Reach',
    description: 'Increases spell range by 15% per level',
    icon: GiMagicSwirl,
    color: '#06b6d4',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'water',
    effect: (level: number) => ({ range: 1 + level * 0.15 }),
  },
  {
    name: 'Tidal Force',
    description: 'Increases knockback effect by 20% per level',
    icon: RiContrastDrop2Fill,
    color: '#06b6d4',
    basePrice: 250,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'water',
    effect: (level: number) => ({ knockback: 1 + level * 0.2 }),
  },
  {
    name: 'Flow State',
    description: 'Increases movement speed by 10% per level while casting',
    icon: GiWaterSplash,
    color: '#06b6d4',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'water',
    effect: (level: number) => ({ moveSpeed: 1 + level * 0.1 }),
  },
  // Force Skills
  {
    name: 'Force Amplification',
    description: 'Increases physical damage by 25% per level',
    icon: RiSwordFill,
    color: '#10b981',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'force',
    effect: (level: number) => ({ forceDamage: 1 + level * 0.25 }),
  },
  {
    name: 'Kinetic Mastery',
    description: 'Increases projectile speed by 15% per level',
    icon: GiBoomerang,
    color: '#10b981',
    basePrice: 180,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'force',
    effect: (level: number) => ({ projectileSpeed: 1 + level * 0.15 }),
  },
  {
    name: 'Impact Resonance',
    description: 'Adds 20% chance per level for force spells to stun',
    icon: GiMagicPalm,
    color: '#10b981',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'force',
    effect: (level: number) => ({ stunChance: level * 0.2 }),
  },
  // Frost Skills
  {
    name: 'Frost Mastery',
    description: 'Increases frost damage by 25% per level',
    icon: GiMagicSwirl,
    color: '#60a5fa',
    basePrice: 200,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'frost',
    effect: (level: number) => ({ frostDamage: 1 + level * 0.25 }),
  },
  {
    name: 'Glacial Presence',
    description: 'Increases slow effect duration by 20% per level',
    icon: GiMagicShield,
    color: '#60a5fa',
    basePrice: 250,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'frost',
    effect: (level: number) => ({ slowDuration: 1 + level * 0.2 }),
  },
  {
    name: 'Deep Freeze',
    description: 'Adds 15% chance per level to freeze enemies solid',
    icon: GiMagicSwirl,
    color: '#60a5fa',
    basePrice: 300,
    priceMultiplier: 1.5,
    maxLevel: 20,
    school: 'frost',
    effect: (level: number) => ({ freezeChance: level * 0.15 }),
  },
];

export const activeSkills: (ActiveSkill)[] = [
  // Arcane Skills
  {
    name: 'Magic Missiles',
    description: 'Launch multiple homing missiles that deal damage to enemies',
    icon: RiMagicFill,
    color: '#9333ea',
    cooldown: 2,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'arcane',
  },
  {
    name: 'Arcane Nova',
    description: 'Release a burst of arcane energy, damaging nearby enemies',
    icon: GiMagicSwirl,
    color: '#9333ea',
    cooldown: 6,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'arcane',
  },
  {
    name: 'Arcane Multiplication',
    description: 'Temporarily triple all your magical effects',
    icon: GiMagicPalm,
    color: '#9333ea',
    cooldown: 10,
    duration: 5,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'arcane',
  },
  // Storm Skills
  {
    name: 'Lightning Storm',
    description: 'Call down lightning strikes on random enemies',
    icon: GiLightningStorm,
    color: '#eab308',
    duration: 8,
    cooldown: process.env.NODE_ENV === "development" ? 1 : 8,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'storm',
  },
  {
    name: 'Chain Lightning',
    description: 'Launch a lightning bolt that chains between enemies',
    icon: RiThunderstormsFill,
    color: '#eab308',
    cooldown: 4,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'storm',
  },
  {
    name: 'Thunder Strike',
    description: 'Call down a massive thunderbolt at target location',
    icon: GiLightningStorm,
    color: '#eab308',
    cooldown: 12,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'storm',
  },
  // Water Skills
  {
    name: 'Tsunami Wave',
    description: 'Summon a massive wave that damages and pushes back enemies',
    icon: GiWaterSplash,
    color: '#06b6d4',
    cooldown: 12,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'water',
  },
  {
    name: 'Water Jet',
    description: 'Fire a high-pressure water beam that pierces enemies',
    icon: RiContrastDrop2Fill,
    color: '#06b6d4',
    cooldown: 3,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'water',
  },
  {
    name: 'Whirlpool',
    description: 'Create a vortex that pulls and damages enemies',
    icon: GiWaterSplash,
    color: '#06b6d4',
    cooldown: 8,
    duration: 4,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'water',
  },
  // Force Skills
  {
    name: 'Magic Boomerang',
    description: 'Launch a magical boomerang that damages enemies in its path',
    icon: GiBoomerang,
    color: '#10b981',
    cooldown: 4,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'force',
  },
  {
    name: 'Force Push',
    description: 'Release a powerful shockwave that knocks back enemies',
    icon: RiSwordFill,
    color: '#10b981',
    cooldown: 6,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'force',
  },
  {
    name: 'Gravity Well',
    description: 'Create a zone that crushes enemies with intense gravity',
    icon: GiMagicPalm,
    color: '#10b981',
    cooldown: 10,
    duration: 5,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'force',
  },
  // Frost Skills
  {
    name: 'Ice Lance',
    description: 'Fire a piercing lance of ice that freezes enemies',
    icon: GiMagicSwirl,
    color: '#60a5fa',
    cooldown: 3,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'frost',
  },
  {
    name: 'Frost Nova',
    description: 'Release a burst of frost that slows nearby enemies',
    icon: GiMagicShield,
    color: '#60a5fa',
    cooldown: 8,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'frost',
  },
  {
    name: 'Blizzard',
    description: 'Summon a blizzard that continuously damages and slows enemies',
    icon: GiMagicSwirl,
    color: '#60a5fa',
    cooldown: 15,
    duration: 6,
    level: process.env.NODE_ENV === "development" ? 1 : 0,
    maxLevel: 20,
    school: 'frost',
  },
];

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const [activeSchool, setActiveSchool] = useState<MagicSchool>('arcane');
  const { skillPoints, upgrades, upgradeSkill, skillLevels, } = useGameStore();

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
        <div className="school-description" style={{ color: magicSchools[activeSchool].color, marginBottom: '1rem' }}>
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
