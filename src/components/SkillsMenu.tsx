import React from "react";
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
import { useGameStore } from "../store/gameStore";

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

  return createPortal(
    <>
      <div className="skills-menu-overlay" onClick={handleBackdropClick} />
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
                effectText = `${level * 15}% Chance`;
              }

              return (
                <div key={key} className="skill-item">
                  <div
                    className="skill-icon"
                    data-skill={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                      color: "white",
                    }}
                  >
                    <Icon />
                  </div>
                  <div className="skill-info">
                    <div className="skill-name">{name}</div>
                    <div className="skill-description">{description}</div>
                    <div className="skill-level">
                      Level {level} {level > 0 ? `(${effectText})` : ""}
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
              );
            }
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
