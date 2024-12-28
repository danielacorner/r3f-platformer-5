import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { FaUser, FaBolt, FaHourglassHalf, FaBullseye } from "react-icons/fa";
import { GiMultipleTargets } from "react-icons/gi";
import "../styles/BottomMenu.css";
import { SkillsMenu } from "./SkillsMenu";

const SKILL_KEYS = ["1", "2", "3", "4"];

interface Skill {
  name: string;
  icon: any;
  cooldown: number;
  currentCooldown: number;
  color: string;
  unlocked: boolean;
  level: number;
}

export function BottomMenu() {
  const {
    money,
    experience,
    level,
    skillPoints,
    upgrades,
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([
    {
      name: "Arcane Power",
      icon: FaBolt,
      cooldown: 5,
      currentCooldown: 0,
      color: "#9333ea",
      unlocked: false,
      level: 0,
    },
    {
      name: "Swift Cast",
      icon: FaHourglassHalf,
      cooldown: 8,
      currentCooldown: 0,
      color: "#22d3ee",
      unlocked: false,
      level: 0,
    },
    {
      name: "Mystic Reach",
      icon: FaBullseye,
      cooldown: 12,
      currentCooldown: 0,
      color: "#3b82f6",
      unlocked: false,
      level: 0,
    },
    {
      name: "Multi Orb",
      icon: GiMultipleTargets,
      cooldown: 15,
      currentCooldown: 0,
      color: "#f97316",
      unlocked: false,
      level: 0,
    },
  ]);

  // Update skills based on upgrades
  useEffect(() => {
    setSkills(prev => prev.map((skill, index) => ({
      ...skill,
      unlocked: upgrades[Object.keys(upgrades)[index] as keyof typeof upgrades] > 0,
      level: upgrades[Object.keys(upgrades)[index] as keyof typeof upgrades],
    })));
  }, [upgrades]);

  // Handle cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setSkills(prev => prev.map(skill => ({
        ...skill,
        currentCooldown: Math.max(0, skill.currentCooldown - 1),
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSkillClick = (index: number) => {
    if (!skills[index].unlocked || skills[index].currentCooldown > 0) return;

    setSkills(prev => prev.map((skill, i) => 
      i === index ? { ...skill, currentCooldown: skill.cooldown } : skill
    ));

    // TODO: Implement skill effect
    console.log(`Activated skill: ${skills[index].name}`);
  };

  // Calculate XP progress
  const expForNextLevel = level * 100;
  const progress = (experience / expForNextLevel) * 100;

  return (
    <div className="bottom-menu" onClick={(e) => e.stopPropagation()}>
      <div className="menu-content">
        <div className="menu-top">
          <div className="player-info">
            <button
              className="player-icon"
              onClick={() => setShowSkillsMenu(true)}
            >
              <FaUser />
              {skillPoints > 0 && (
                <div className="skill-points-indicator">{skillPoints}</div>
              )}
            </button>

            <div className="player-stats">
              <div className="xp-display">
                <div className="xp-bar">
                  <div
                    className="xp-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                  <div className="xp-text">
                    Lvl {level} • {experience}/{expForNextLevel}
                  </div>
                </div>
              </div>

              <div className="money-display">
                {money}<span>🪙</span>
              </div>
            </div>
          </div>
        </div>

        <div className="skill-slots">
          {skills.map((skill, index) => (
            <button
              key={index}
              className={`skill-slot ${!skill.unlocked ? 'locked' : ''}`}
              onClick={() => handleSkillClick(index)}
              disabled={!skill.unlocked || skill.currentCooldown > 0}
              style={{
                borderColor: skill.unlocked ? skill.color : undefined,
              }}
            >
              <skill.icon className="skill-icon" />
              {skill.currentCooldown > 0 && (
                <div className="cooldown-overlay">{skill.currentCooldown}s</div>
              )}
              <div className="key-hint">{SKILL_KEYS[index]}</div>
            </button>
          ))}
        </div>
      </div>

      {showSkillsMenu && (
        <SkillsMenu
          isOpen={showSkillsMenu}
          onClose={() => setShowSkillsMenu(false)}
        />
      )}
    </div>
  );
}
