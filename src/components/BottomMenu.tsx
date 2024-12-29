import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { FaUser } from "react-icons/fa";
import { RiShieldFlashFill, RiThunderstormsFill, RiFireFill, RiContrastDrop2Fill } from "react-icons/ri";
import "../styles/BottomMenu.css";
import { SkillsMenu } from "./SkillsMenu";

const SKILL_KEYS = ["1", "2", "3", "4"];

const activeSkills = [
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
    skillLevels,
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [skills, setSkills] = useState<ActiveSkill[]>(
    activeSkills.map(skill => ({
      ...skill,
      currentCooldown: 0,
      level: 0,
    }))
  );

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

    // Cast the skill
    switch (skill.name) {
      case 'Shield Burst':
        console.log('Casting Shield Burst');
        // TODO: Implement shield effect
        break;
      case 'Lightning Storm':
        console.log('Casting Lightning Storm');
        // TODO: Implement lightning strikes
        break;
      case 'Inferno':
        console.log('Casting Inferno');
        // TODO: Implement fire ring
        break;
      case 'Time Dilation':
        console.log('Casting Time Dilation');
        // TODO: Implement slow effect
        break;
    }
  };

  // Calculate XP progress
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, level - 1));
  const xpProgress = (experience / xpForNextLevel) * 100;

  return (
    <div className="bottom-menu">
      <div className="status-section">
        <div className="player-info">
          <div className="player-icon">
            <FaUser />
          </div>
          <div className="level-info">
            <div className="level-number">Level {level}</div>
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="xp-text">{experience}/{xpForNextLevel} XP</div>
          </div>
        </div>
        <div className="resources">
          <div className="money">💰 {money}</div>
          <div className="skill-points" onClick={() => setShowSkillsMenu(true)}>
            ✨ {skillPoints} SP
          </div>
        </div>
      </div>

      <div className="skills-section">
        {skills.map((skill, index) => (
          <div
            key={skill.name}
            className={`skill-button ${skill.level === 0 ? 'locked' : ''} ${skill.currentCooldown > 0 ? 'on-cooldown' : ''}`}
            onClick={() => handleSkillClick(index)}
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

      {showSkillsMenu && (
        <SkillsMenu isOpen={showSkillsMenu} onClose={() => setShowSkillsMenu(false)} />
      )}
    </div>
  );
}
