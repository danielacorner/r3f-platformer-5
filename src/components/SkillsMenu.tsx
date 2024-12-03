import React from 'react';
import { FaStar, FaBolt, FaRunning, FaBullseye, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { useGameStore } from '../store/gameStore';

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPGRADE_DETAILS = {
  damage: {
    icon: FaBolt,
    name: 'Damage',
    description: 'Increase magic orb damage by 10%',
    color: '#ef4444'
  },
  speed: {
    icon: FaRunning,
    name: 'Speed',
    description: 'Increase movement speed by 8%',
    color: '#22c55e'
  },
  range: {
    icon: FaBullseye,
    name: 'Range',
    description: 'Increase attack range by 12%',
    color: '#3b82f6'
  },
  defense: {
    icon: FaShieldAlt,
    name: 'Defense',
    description: 'Reduce damage taken by 8%',
    color: '#a855f7'
  }
};

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const { skillPoints, upgrades, upgradeSkill } = useGameStore();

  if (!isOpen) return null;

  return (
    <>
      <div className="skills-menu-overlay" onClick={onClose} />
      <div className="skills-menu">
        <div className="skills-header">
          <h2>Skills</h2>
          <div className="header-right">
            <div className="skill-points">
              <FaStar className="text-yellow-400" />
              <span>{skillPoints} points</span>
            </div>
            <button className="close-icon-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="skills-grid">
          {Object.entries(UPGRADE_DETAILS).map(([key, { icon: Icon, name, description, color }]) => (
            <div key={key} className="skill-item">
              <div className="skill-icon" style={{ backgroundColor: color }}>
                <Icon />
              </div>
              <div className="skill-info">
                <div className="skill-name">{name}</div>
                <div className="skill-description">{description}</div>
                <div className="skill-level">
                  Level {upgrades[key as keyof typeof upgrades]}
                </div>
              </div>
              <button
                className="upgrade-button"
                onClick={() => upgradeSkill(key as keyof typeof upgrades)}
                disabled={skillPoints === 0}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
