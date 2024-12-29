import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { FaUser } from "react-icons/fa";
import { RiShieldFlashFill, RiThunderstormsFill, RiFireFill, RiContrastDrop2Fill, RiMagicFill } from "react-icons/ri";
import "../styles/BottomMenu.css";
import { SkillsMenu } from "./SkillsMenu";
import { castShieldBurst, castLightningStorm, castInferno, castTimeDilation, castMagicMissiles } from './skills/SkillEffects';
import { Vector3 } from "three";

const SKILL_KEYS = ["1", "2", "3", "4", "5"];

const activeSkills = [
  {
    name: 'Magic Missiles',
    description: 'Launch multiple homing missiles that deal damage to enemies',
    icon: RiMagicFill,
    color: '#8b5cf6',
    cooldown: 12,
  },
  {
    name: 'Shield Burst',
    description: 'Creates a protective barrier that blocks projectiles',
    icon: RiShieldFlashFill,
    color: '#2563eb',
    cooldown: 15,
    duration: 5,
  },
  {
    name: 'Lightning Storm',
    description: 'Summons lightning strikes on nearby enemies',
    icon: RiThunderstormsFill,
    color: '#7c3aed',
    cooldown: 20,
  },
  {
    name: 'Inferno',
    description: 'Creates a ring of fire damaging nearby enemies',
    icon: RiFireFill,
    color: '#dc2626',
    cooldown: 25,
    duration: 8,
  },
  {
    name: 'Time Dilation',
    description: 'Slows down enemies in an area',
    icon: RiContrastDrop2Fill,
    color: '#0891b2',
    cooldown: 30,
    duration: 6,
  },
];

interface ActiveSkill {
  name: string;
  icon: any;
  cooldown: number;
  currentCooldown: number;
  color: string;
  level: number;
  description: string;
  duration?: number;
}

export function BottomMenu() {
  const {
    money,
    experience,
    level,
    skillPoints,
    skillLevels, playerRef
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [skills, setSkills] = useState<ActiveSkill[]>(activeSkills.map(skill => ({
    ...skill,
    currentCooldown: 0,
    level: 0,
  })));

  // Update skills based on levels
  useEffect(() => {
    setSkills(prev => prev.map(skill => ({
      ...skill,
      level: skillLevels[skill.name] || 0,
    })));
  }, [skillLevels]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const index = SKILL_KEYS.indexOf(e.key);
      if (index !== -1) {
        handleSkillClick(index);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [skills]);

  const handleSkillClick = (index: number) => {
    const skill = skills[index];
    if (skill.level === 0 || skill.currentCooldown > 0) return;

    setSkills(prev => prev.map((s, i) =>
      i === index ? { ...s, currentCooldown: s.cooldown } : s
    ));

    // Get player position
    const playerPosition = playerRef?.translation();
    if (!playerPosition) return;

    const position = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);

    // Cast the appropriate skill
    switch (skill.name) {
      case 'Shield Burst':
        castShieldBurst(position, skill.level);
        break;
      case 'Lightning Storm':
        castLightningStorm(position, skill.level);
        break;
      case 'Inferno':
        castInferno(position, skill.level);
        break;
      case 'Time Dilation':
        castTimeDilation(position, skill.level);
        break;
      case 'Magic Missiles':
        castMagicMissiles(position, skill.level);
        break;
    }
  };

  // Calculate XP progress
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, level - 1));
  const xpProgress = (experience / xpForNextLevel) * 100;

  return (
    <>
      <div
        className="bottom-menu"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="status-section">
          <div className="player-info">
            <div
              className="player-icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSkillsMenu(true);
              }}
              title="Click to open Skills Menu"
            >
              <FaUser />
              {skillPoints > 0 && (
                <div className="skill-points-badge">
                  {skillPoints}
                </div>
              )}
            </div>
            <div className="level-info">
              <div className="level-number">Level {level}</div>
              <div className="xp-bar">
                <div
                  className="xp-progress"
                  style={{ width: `${xpProgress}%` }}
                  title={`${experience.toLocaleString()}/${xpForNextLevel.toLocaleString()} XP`}
                />
              </div>
              <div className="xp-text">
                {experience.toLocaleString()}/{xpForNextLevel.toLocaleString()} XP
              </div>
            </div>
          </div>
          <div className="resources">
            <div className="money" title="Gold">
              {money.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="skills-section">
          {skills.map((skill, index) => (
            <div
              key={skill.name}
              className={`skill-button ${skill.level === 0 ? 'locked' : ''} ${skill.currentCooldown > 0 ? 'on-cooldown' : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSkillClick(index);
              }}
              style={{ borderColor: skill.color }}
            >
              <skill.icon />
              {skill.currentCooldown > 0 && (
                <div className="cooldown-overlay" style={{ height: `${(skill.currentCooldown / skill.cooldown) * 100}%` }} />
              )}
              <div className="skill-key">{SKILL_KEYS[index]}</div>
              {skill.level > 0 && <div className="skill-level">{skill.level}</div>}
              {skill.currentCooldown > 0 && (
                <div className="cooldown-text">{skill.currentCooldown}s</div>
              )}
            </div>
          ))}
        </div>
      </div>
      {showSkillsMenu && (
        <SkillsMenu
          isOpen={showSkillsMenu}
          onClose={() => setShowSkillsMenu(false)}
        />
      )}
    </>
  );
}
