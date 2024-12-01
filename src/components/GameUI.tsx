import { useGameStore } from '../store/gameStore';
import { FaPlay, FaPause, FaForward } from 'react-icons/fa';
import '../styles/GameUI.css';

export function GameUI() {
  const { phase, setPhase, lives, money, currentLevel, setIsSpawning } = useGameStore();

  const startWave = () => {
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
          <span className="stat-label">Lives:</span>
          <span className="stat-value">{lives}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Gold:</span>
          <span className="stat-value">{money}</span>
        </div>
      </div>

      <div className="game-controls">
        {phase === 'prep' && (
          <button 
            className="control-button start-wave" 
            onClick={startWave}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaPlay />
            <span data-short-text="Start">Start Wave</span>
          </button>
        )}
      </div>
    </div>
  );
}
