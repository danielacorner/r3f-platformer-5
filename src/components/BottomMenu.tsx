import { useState } from "react";
import { useGameStore } from "../store/gameStore";

import { FaUser } from "react-icons/fa";

import "../styles/BottomMenu.css";

import { SkillsMenu } from "./SkillsMenu";



export function BottomMenu() {
  const {
    money,
    experience,
    level,
    skillPoints,
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);

  // Calculate XP progress

  const expForNextLevel = level * 100;

  const progress = (experience / expForNextLevel) * 100;

  return (
    <div className="bottom-menu" onClick={(e) => e.stopPropagation()}>
      <div className="stats-display">
        <div className="player-stats">
          <button
            className="player-icon"
            onClick={() => setShowSkillsMenu(true)}
          >
            <FaUser />

            {skillPoints > 0 && (
              <div className="skill-points-indicator">{skillPoints}</div>
            )}
          </button>

          <div className="xp-display">
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

              <div className="xp-text">
                Level {level} • {experience}/{expForNextLevel} XP
              </div>
            </div>
          </div>

          <div className="money-display">
            <span>{money}</span>

            <span>🪙</span>
          </div>
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
