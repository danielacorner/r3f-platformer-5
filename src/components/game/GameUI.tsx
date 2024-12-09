import { useGameStore } from "../../store/gameStore";
import { FaPlay, FaArrowRight } from "react-icons/fa";
import "../../styles/GameUI.css";

export function GameUI() {
  const {
    phase,
    lives,
    currentLevel,
    currentWave,
    totalWaves,
    startWave,
    incrementLevel,
  } = useGameStore();

  const isLevelComplete = currentWave === totalWaves;

  return (
    <div className="game-ui">
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Level:</span>
          <span className="stat-value">{currentLevel}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Wave:</span>
          <span className="stat-value">
            {currentWave} / {totalWaves}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lives:</span>
          <span className="stat-value">{lives}</span>
        </div>
      </div>

      {phase === "prep" && (
        <div className="game-controls">
          <button
            className={`start-wave-button ${
              isLevelComplete ? "next-level" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isLevelComplete) {
                incrementLevel();
              } else {
                startWave();
              }
            }}
          >
            {isLevelComplete ? <FaArrowRight /> : <FaPlay />}
            <span>{isLevelComplete ? "Next Level" : "Next Wave"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
