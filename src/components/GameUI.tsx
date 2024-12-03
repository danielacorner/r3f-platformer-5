import { useGameStore } from '../store/gameStore';
import { FaPlay } from 'react-icons/fa';
import '../styles/GameUI.css';

export function GameUI() {
  const { 
    phase, 
    setPhase, 
    lives, 
    currentLevel,
    setIsSpawning,
    wave,
  } = useGameStore();

  const startWave = (e) => {
    e.stopPropagation();
    console.log('Starting wave...');
    setPhase('combat');
    setIsSpawning(true);
  };

  return (
    <div className="game-ui">
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Level:</span>
          <span className="stat-value">{currentLevel}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Wave:</span>
          <span className="stat-value">{wave}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lives:</span>
          <span className="stat-value">{lives}</span>
        </div>
      </div>

      {phase === 'prep' && (
        <div className="game-controls">
          <button
            className="start-wave-button"
            onClick={startWave}
          >
            <FaPlay />
            <span>Next Wave</span>
          </button>
        </div>
      )}
    </div>
  );
}
