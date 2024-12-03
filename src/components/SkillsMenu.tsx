import React from 'react';
import { createPortal } from 'react-dom';
import { FaStar, FaBolt, FaRunning, FaBullseye, FaShieldAlt, FaTimes, FaMagic, FaHourglassHalf } from 'react-icons/fa';
import { useGameStore } from '../store/gameStore';

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPGRADE_DETAILS = {
  damage: {
    icon: FaBolt,
    name: 'Arcane Power',
    description: 'Increase magic orb damage by 15%',
    color: '#9333ea'
  },
  speed: {
    icon: FaHourglassHalf,
    name: 'Swift Cast',
    description: 'Decrease magic orb cooldown by 12%',
    color: '#22d3ee'
  },
  range: {
    icon: FaBullseye,
    name: 'Mystic Reach',
    description: 'Increase spell range by 12%',
    color: '#3b82f6'
  },
  multishot: {
    icon: FaMagic,
    name: 'Multi Orb',
    description: 'Chance to cast an additional magic orb',
    color: '#f97316'
  }
};

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const { skillPoints, upgrades, upgradeSkill } = useGameStore();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const menuContent = (
    <>
      <div className="skills-menu-overlay" onClick={handleBackdropClick} />
      <div className="skills-menu" onClick={handleMenuClick}>
        <div className="skills-header">
          <h2>Skills</h2>
          <div className="header-right">
            <div className="skill-points">
              <FaStar className="text-yellow-400" />
              <span>{skillPoints} points</span>
            </div>
            <button className="close-icon-button" onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  upgradeSkill(key as keyof typeof upgrades);
                }}
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

  return createPortal(menuContent, document.body);
}
