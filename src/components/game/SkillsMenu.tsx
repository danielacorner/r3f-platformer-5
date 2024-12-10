import React from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaBolt,
  FaBullseye,
  FaTimes,
  FaHourglassHalf,
} from "react-icons/fa";
import { GiMultipleTargets, GiSplash } from "react-icons/gi";
import { useGameStore } from "../../store/gameStore";
import "../../styles/SkillsMenu.css";

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPGRADE_DETAILS = {
  damage: {
    icon: FaBolt,
    name: "Arcane Power",
    description: "Increase magic orb damage by 15%",
    color: "#9333ea",
  },
  speed: {
    icon: FaHourglassHalf,
    name: "Swift Cast",
    description: "Decrease magic orb cooldown by 12%",
    color: "#22d3ee",
  },
  range: {
    icon: FaBullseye,
    name: "Mystic Reach",
    description: "Increase spell range by 12%",
    color: "#3b82f6",
  },
  multishot: {
    icon: GiMultipleTargets,
    name: "Multi Orb",
    description: "Chance to cast an additional magic orb (+15%)",
    color: "#f97316",
  },
  splash: {
    icon: GiSplash,
    name: "Arcane Explosion",
    description: "Magic orbs deal splash damage to nearby enemies",
    color: "#ec4899",
  },
};

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const { skillPoints, upgrades, upgradeSkill } = useGameStore();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onClose();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <>
      <div className="skills-menu-overlay" onClick={handleBackdropClick} />
      <div className="skills-menu" onClick={handleMenuClick}>
        <div className="skills-header">
          <h2>Magic Skills</h2>
          <div className="header-right">
            <div className="skill-points">
              <FaStar className="text-yellow-400" />
              <span>
                {skillPoints} {window.innerWidth < 640 ? "" : "skill points"}
              </span>
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

        <div className="skills-grid">
          {Object.entries(UPGRADE_DETAILS).map(
            ([key, { icon: Icon, name, description, color }]) => {
              const level = upgrades[key as keyof typeof upgrades];
              let effectText = "";
              if (key === "damage") {
                effectText = `+${level * 15}% Damage`;
              } else if (key === "speed") {
                const totalSpeedReduction = level * 12;
                if (totalSpeedReduction >= 100) {
                  const excessReduction = totalSpeedReduction - 100;
                  effectText = `-100% Cooldown, +${Math.floor(
                    excessReduction
                  )}% Orb Speed`;
                } else {
                  effectText = `-${totalSpeedReduction}% Cooldown`;
                }
              } else if (key === "range") {
                effectText = `+${level * 12}% Range`;
              } else if (key === "multishot") {
                effectText = `+${level * 15}% Multi Orb`;
              } else if (key === "splash") {
                effectText = `${2 + level * 0.5} Radius, ${Math.floor((0.5 + level * 0.1) * 100)}% Damage`;
              }

              // Calculate cost
              const cost = Math.floor(
                (key === "multishot" || key === "splash" ? 15 : 10) *
                  Math.pow(1.5, level)
              );
              const maxLevel = key === "multishot" || key === "splash" ? 5 : 10;

              return (
                <div
                  key={key}
                  className="skill-item"
                  style={
                    {
                      "--skill-color": color,
                    } as React.CSSProperties
                  }
                >
                  <div className="skill-header">
                    <Icon className="skill-icon" />
                    <div className="skill-info">
                      <h3>{name}</h3>
                      <p className="skill-description">{description}</p>
                    </div>
                  </div>

                  <div className="skill-footer">
                    <div className="skill-level">
                      <div className="level-text">
                        Level {level}
                        <span className="max-level">/{maxLevel}</span>
                      </div>
                      <div className="effect-text">{effectText}</div>
                    </div>

                    <button
                      className="upgrade-button"
                      onClick={() => upgradeSkill(key as keyof typeof upgrades)}
                      disabled={
                        skillPoints < cost || level >= maxLevel
                      }
                    >
                      <FaStar className="cost-icon" />
                      <span>{cost}</span>
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
