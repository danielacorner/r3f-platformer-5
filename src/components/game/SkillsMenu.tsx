import React from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaBolt,
  FaBullseye,
  FaTimes,
  FaHourglassHalf,
  FaMeteor,
} from "react-icons/fa";
import { 
  GiMultipleTargets, 
  GiSplash, 
  GiArrowDunk, 
  GiChainLightning, 
  GiCrossedSwords,
  GiFireRing,
  GiIceSpellCast,
  GiFrostfire
} from "react-icons/gi";
import { useGameStore } from "../../store/gameStore";
import "../../styles/SkillsMenu.css";

const SKILL_TREES = {
  arcane: {
    title: "Arcane Magic",
    skills: {
      damage: {
        icon: FaBolt,
        name: "Arcane Power",
        description: "Increase magic orb damage by 15%",
        color: "#9333ea",
        requires: [],
      },
      speed: {
        icon: FaHourglassHalf,
        name: "Swift Cast",
        description: "Decrease magic orb cooldown by 12%",
        color: "#22d3ee",
        requires: [],
      },
      multishot: {
        icon: GiMultipleTargets,
        name: "Multi Orb",
        description: "Chance to cast an additional magic orb (+15%)",
        color: "#f97316",
        requires: ["damage"],
      },
    }
  },
  elemental: {
    title: "Elemental Magic",
    skills: {
      splash: {
        icon: GiSplash,
        name: "Arcane Explosion",
        description: "Magic orbs deal splash damage to nearby enemies",
        color: "#ec4899",
        requires: [],
      },
      fireRing: {
        icon: GiFireRing,
        name: "Ring of Fire",
        description: "Creates a ring of fire around hit enemies, dealing 30% damage per second",
        color: "#dc2626",
        requires: ["splash"],
      },
      frostfire: {
        icon: GiFrostfire,
        name: "Frostfire",
        description: "Explosions leave a patch of frost fire, slowing enemies by 30% and dealing damage",
        color: "#2563eb",
        requires: ["fireRing"],
      },
    }
  },
  combat: {
    title: "Combat Magic",
    skills: {
      pierce: {
        icon: GiArrowDunk,
        name: "Piercing Orbs",
        description: "Orbs pierce through enemies, dealing 50% damage to subsequent targets",
        color: "#10b981",
        requires: [],
      },
      chain: {
        icon: GiChainLightning,
        name: "Chain Lightning",
        description: "Orbs chain to nearby enemies, dealing 40% damage per bounce",
        color: "#6366f1",
        requires: ["pierce"],
      },
      crit: {
        icon: GiCrossedSwords,
        name: "Critical Strike",
        description: "15% chance per level to deal double damage",
        color: "#ef4444",
        requires: [],
      },
      meteor: {
        icon: FaMeteor,
        name: "Meteor Strike",
        description: "10% chance to summon a meteor on hit, dealing 300% damage in a large area",
        color: "#b91c1c",
        requires: ["crit"],
      },
    }
  }
};

interface SkillItemProps {
  skill: any;
  isLearned: boolean;
  canLearn: boolean;
  onClick: () => void;
}

interface SkillTreeProps {
  title: string;
  skills: any;
  learnedSkills: string[];
  onSkillClick: (id: string) => void;
}

function SkillItem({ skill, isLearned, canLearn, onClick }: SkillItemProps) {
  const Icon = skill.icon;
  const style = { "--skill-color": skill.color } as React.CSSProperties;

  return (
    <div 
      className={`skill-item ${!canLearn ? "disabled" : ""}`}
      onClick={canLearn ? onClick : undefined}
      style={style}
    >
      <Icon />
      <div className="skill-tooltip">
        <div className="skill-tooltip-title">{skill.name}</div>
        <div className="skill-tooltip-description">{skill.description}</div>
        <div className="skill-tooltip-status">
          {isLearned ? "Learned" : canLearn ? "Available" : "Requires prerequisites"}
        </div>
      </div>
      {skill.requires?.length > 0 && <div className="skill-connector" />}
    </div>
  );
}

function SkillTree({ title, skills, learnedSkills, onSkillClick }: SkillTreeProps) {
  return (
    <div className="skill-tree">
      <h3 className="skill-tree-title">{title}</h3>
      {Object.entries(skills).map(([id, skill]) => {
        const isLearned = learnedSkills.includes(id);
        const canLearn = !isLearned && (!skill.requires?.length || 
          skill.requires.every(req => learnedSkills.includes(req)));
        
        return (
          <SkillItem
            key={id}
            skill={skill}
            isLearned={isLearned}
            canLearn={canLearn}
            onClick={() => onSkillClick(id)}
          />
        );
      })}
    </div>
  );
}

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const upgrades = useGameStore((state) => state.upgrades);
  const upgradeSkill = useGameStore((state) => state.upgradeSkill);
  const skillPoints = useGameStore((state) => state.skillPoints);

  if (!isOpen) return null;

  const learnedSkills = Object.keys(upgrades).filter(skill => upgrades[skill] > 0);

  return createPortal(
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Magic Skills ({skillPoints} points)</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="skills-grid">
          {Object.entries(SKILL_TREES).map(([treeKey, tree]) => (
            <SkillTree
              key={treeKey}
              title={tree.title}
              skills={tree.skills}
              learnedSkills={learnedSkills}
              onSkillClick={(id) => {
                if (skillPoints > 0) {
                  upgradeSkill(id);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
