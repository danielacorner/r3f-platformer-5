import { useGameStore } from "../store/gameStore";
import { FaLevelUpAlt, FaPlay } from "react-icons/fa";
import { GiSpellBook } from "react-icons/gi";
import "../styles/GameUI.css";
import { Heart, LucideWaves } from "lucide-react";
import { useState } from "react";
import { SkillsMenu } from "./skills/SkillsMenu/SkillsMenu";

export function GameUI() {
  const {
    phase,
    lives,
    currentLevel,
    currentWave,
    totalWaves,
    startWave,
    skillPoints,
  } = useGameStore();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);

  return (
    <div className="game-ui">
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">
            <FaLevelUpAlt />
          </span>
          <span className="stat-value">{currentLevel}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <LucideWaves style={{ color: "cornflowerblue", width: 18 }} />
          </span>
          <span className="stat-value">
            {currentWave} / {totalWaves}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Heart style={{ color: "red", width: 18 }} />
          </span>
          <span className="stat-value">{lives}</span>
        </div>
      </div>

      {phase === "prep" && (
        <div className="game-controls">
          <button
            className="start-wave-button"
            onClick={(e) => {
              e.stopPropagation();
              startWave();
            }}
          >
            <FaPlay />
            <span>Next Wave</span>
          </button>
        </div>
      )}

      <button
        className="skills-menu-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsSkillsMenuOpen(true);
        }}
      >
        <GiSpellBook />
        {skillPoints > 0 && (
          <div className="skill-points-badge">{skillPoints}</div>
        )}
      </button>

      {isSkillsMenuOpen && (
        <SkillsMenu onClose={() => setIsSkillsMenuOpen(false)} />
      )}
    </div>
  );
}
