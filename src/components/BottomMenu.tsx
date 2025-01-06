import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { FaUser } from "react-icons/fa";
import "../styles/BottomMenu.css";
import { ActiveSkill, activeSkills, SkillsMenu } from "./SkillsMenu";
import { castLightningStorm } from './skills/SkillEffects/castLightningStorm';
import { castTimeDilation } from './skills/SkillEffects/castTimeDilation';
import { castMagicMissiles } from './skills/SkillEffects/castMagicMissiles';
import { castMagicBoomerang } from './skills/SkillEffects/castMagicBoomerang';
import { castArcaneNova } from './skills/SkillEffects/castArcaneNova';
import { castArcaneMultiplication } from './skills/SkillEffects/castArcaneMultiplication';
import { Vector3 } from "three";
import { Tooltip } from "@mui/material";
import { GiMagicSwirl } from "react-icons/gi";

const SKILL_KEYS = ["1", "2", "3", "4", "5", "6"];


interface CooldownOverlayProps {
  remainingTime: number;
  totalTime: number;
  color: string;
}

function CooldownOverlay({ remainingTime, totalTime, color }: CooldownOverlayProps) {
  const progress = remainingTime / totalTime;
  const angle = progress * 360;

  const conicGradient = `conic-gradient(
    rgba(0, 0, 0, 0.5) ${angle}deg,
    rgba(0, 0, 0, 0.2) ${angle}deg
  )`;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="w-full h-full rounded-lg"
        style={{
          background: conicGradient,
          transform: 'rotate(-90deg)'
        }}
      />
      <div className="absolute text-white font-bold text-lg">
        {Math.ceil(remainingTime)}
      </div>
    </div>
  );
}

export function BottomMenu() {
  const {
    money,
    experience,
    level,
    skillPoints,
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [skills, setSkills] = useState<(ActiveSkill & { currentCooldown: number })[]>(activeSkills.map(skill => ({
    ...skill,
    currentCooldown: 0,
    // level: skill.level ?? (process.env.NODE_ENV === 'development' ? 1 : 0),
  })));


  // Update skills based on levels
  useEffect(() => {
    setSkills(prev => prev.map(skill => ({
      ...skill,
      level: useGameStore.getState().skillLevels[skill.name] || (process.env.NODE_ENV === 'development' ? 1 : 0),
    })));
  }, [useGameStore.getState().skillLevels]);


  // Handle cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setSkills(prev => prev.map(skill => ({
        ...skill,
        currentCooldown: Math.max(0, (skill.currentCooldown ?? 0.1) - 0.1),
      })));
    }, 100);

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

    if (skill.level === 0) {
      console.log('Skill not learned yet');
      return;
    }

    if ((skill.currentCooldown ?? 0) > 0) {
      console.log('Skill on cooldown');
      return;
    }

    // Get player position
    const playerRef = useGameStore.getState().playerRef;
    if (!playerRef) {
      console.log('No player ref found in game store!');
      return;
    }

    const playerPosition = playerRef.translation();
    if (!playerPosition) {
      console.log('No player position found!');
      return;
    }

    const position = new Vector3(playerPosition.x, 1, playerPosition.z);
    let direction: Vector3;

    // Try to get mouse position, use default direction if not available
    if (window.gameState?.mousePosition) {
      const mousePos = new Vector3(
        window.gameState.mousePosition.x,
        0,
        window.gameState.mousePosition.z
      );
      direction = mousePos.clone().sub(position).normalize();
    } else {
      // Default direction when mouse position not available (facing forward)
      direction = new Vector3(0, 0, 1);
    }

    // Cast the appropriate skill
    console.log('Casting skill:', skill.name, 'at position:', position.toArray(), 'direction:', direction.toArray());
    switch (skill.name) {
      case 'Magic Boomerang':
        castMagicBoomerang(position, direction, skill.level);
        break;
      case 'Magic Missiles':
        castMagicMissiles(position, skill.level);
        break;
      case 'Arcane Nova':
        castArcaneNova(position, skill.level);
        break;
      case 'Lightning Storm':
        castLightningStorm(position, skill.level);
        break;
      case 'Arcane Multiplication':
        castArcaneMultiplication(position, skill.level);
        break;
      case 'Time Dilation':
        castTimeDilation(position, skill.level);
        break;
    }

    // Start cooldown
    setSkills(prev => prev.map((s, i) =>
      i === index ? { ...s, currentCooldown: s.cooldown } : s
    ));
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
              className={`relative group skill-button ${skill.level === 0 ? 'locked' : ''} ${skill.currentCooldown > 0 ? 'on-cooldown' : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSkillClick(index);
              }}
              style={{ borderColor: skill.color }}
            >
              <Tooltip title={<>
                <div className="skill-name">{skill.name}</div>
                <div className="skill-description">{skill.description}</div>
              </>} placement="top" arrow>
                <button
                  className={`w-full h-full rounded-sm flex items-center justify-center text-4xl transition-all
                  ${skill.currentCooldown > 0 ? 'opacity-50' : 'hover:scale-110'}`}
                  style={{ backgroundColor: skill.color }}
                >
                  {<skill.icon />}
                </button>
              </Tooltip>
              {
                skill.currentCooldown > 0 && (
                  <CooldownOverlay
                    remainingTime={skill.currentCooldown}
                    totalTime={skill.cooldown}
                    color={skill.color}
                  />
                )
              }
              < div className="skill-key" > {SKILL_KEYS[index]}</div>
            </div>
          ))}
        </div >
      </div >
      {showSkillsMenu && (
        <SkillsMenu
          isOpen={showSkillsMenu}
          onClose={() => setShowSkillsMenu(false)}
        />
      )
      }
    </>
  );
}
