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
import { Popover, Button, Text, Stack } from '@mantine/core';
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
      ringOfFire: {
        icon: GiFireRing,
        name: "Ring of Fire",
        description: "Creates a damaging ring around enemies",
        color: "#ef4444",
        requires: [],
      },
      frostfire: {
        icon: GiFrostfire,
        name: "Frostfire",
        description: "Leaves frost fire patches that slow and damage enemies",
        color: "#3b82f6",
        requires: ["ringOfFire"],
      },
      meteor: {
        icon: FaMeteor,
        name: "Meteor Strike",
        description: "Summons a meteor on hit, dealing significant area damage",
        color: "#f97316",
        requires: ["frostfire"],
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
  onHover: () => void;
  isSelected: boolean;
}

function SkillItem({ skill, isLearned, canLearn, onClick, onHover, isSelected }: SkillItemProps) {
  const Icon = skill.icon;

  return (
    <div 
      className={`skill-item ${!canLearn ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
      onClick={canLearn ? onClick : undefined}
      onMouseEnter={onHover}
      style={{ '--skill-color': skill.color } as React.CSSProperties}
    >
      <Icon />
    </div>
  );
}

function SkillInfoPanel({ 
  skill, 
  isLearned, 
  canLearn,
  onUpgrade,
  skillPoints 
}: { 
  skill: any; 
  isLearned: boolean; 
  canLearn: boolean;
  onUpgrade: () => void;
  skillPoints: number;
}) {
  if (!skill) return null;

  return (
    <div className="skill-info-panel" style={{ '--skill-color': skill.color } as React.CSSProperties}>
      <div className="skill-info-header">
        <div className="skill-info-icon">
          <skill.icon size={32} />
        </div>
        <div className="skill-info-title">
          <h3>{skill.name}</h3>
          <div className="skill-info-status">
            {isLearned ? "Learned" : canLearn ? "Available" : "Requires prerequisites"}
          </div>
        </div>
        {canLearn && skillPoints > 0 && (
          <button 
            className="upgrade-button"
            onClick={onUpgrade}
          >
            Learn Skill <FaStar className="cost-icon" />
          </button>
        )}
      </div>
      <p className="skill-info-description">{skill.description}</p>
    </div>
  );
}

interface SkillTreeProps {
  title: string;
  skills: any;
  learnedSkills: string[];
  onSkillClick: (id: string) => void;
  onSkillHover: (id: string) => void;
  selectedSkillId: string | null;
}

function SkillTree({ 
  title, 
  skills, 
  learnedSkills, 
  onSkillClick,
  onSkillHover,
  selectedSkillId 
}: SkillTreeProps) {
  return (
    <div className="skill-tree">
      <h3 className="skill-tree-title">{title}</h3>
      <div className="skill-tree-grid">
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
              onHover={() => onSkillHover(id)}
              isSelected={id === selectedSkillId}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SkillsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillsMenu({ isOpen, onClose }: SkillsMenuProps) {
  const { upgrades, skillPoints, upgradeSkill } = useGameStore();
  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(null);
  const [selectedTreeKey, setSelectedTreeKey] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const learnedSkills = Object.keys(upgrades).filter(skill => upgrades[skill] > 0);
  
  const selectedSkill = selectedTreeKey && selectedSkillId 
    ? SKILL_TREES[selectedTreeKey].skills[selectedSkillId]
    : null;

  const isLearned = selectedSkillId ? learnedSkills.includes(selectedSkillId) : false;
  const canLearn = selectedSkill && selectedSkillId 
    ? !isLearned && (!selectedSkill.requires?.length || 
        selectedSkill.requires.every(req => learnedSkills.includes(req)))
    : false;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Skills ({skillPoints} points available)</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <SkillInfoPanel
          skill={selectedSkill}
          isLearned={isLearned}
          canLearn={canLearn}
          skillPoints={skillPoints}
          onUpgrade={() => {
            if (selectedSkillId && canLearn && skillPoints > 0) {
              upgradeSkill(selectedSkillId);
            }
          }}
        />
        <div className="skills-grid">
          {Object.entries(SKILL_TREES).map(([treeKey, tree]) => (
            <SkillTree
              key={treeKey}
              title={tree.title}
              skills={tree.skills}
              learnedSkills={learnedSkills}
              selectedSkillId={selectedSkillId}
              onSkillClick={(id) => {
                setSelectedSkillId(id);
                setSelectedTreeKey(treeKey);
              }}
              onSkillHover={(id) => {
                setSelectedSkillId(id);
                setSelectedTreeKey(treeKey);
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
