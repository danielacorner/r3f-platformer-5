import { useGameStore } from '../store/gameStore';
import { FaCoins } from 'react-icons/fa';
import {
  GiWaterDrop,
  GiFireBowl,
  GiSnowflake1,
  GiLeafSwirl,
  GiSunbeams,
  GiCrownedSkull
} from 'react-icons/gi';
import '../styles/BuildMenu.css';

// Element TD tower definitions
const TOWER_TYPES = {
  light: {
    type: 'light',
    label: 'Light Tower',
    description: 'Amplifies nearby towers',
    cost: 100,
    icon: <GiSunbeams className="text-yellow-300" />,
    color: 'from-yellow-900/80 to-yellow-600/80'
  },
  fire: {
    type: 'fire',
    label: 'Fire Tower',
    description: 'High single target damage',
    cost: 100,
    icon: <GiFireBowl className="text-red-500" />,
    color: 'from-red-900/80 to-red-600/80'
  },
  ice: {
    type: 'ice',
    label: 'Ice Tower',
    description: 'Slows enemies',
    cost: 100,
    icon: <GiSnowflake1 className="text-blue-300" />,
    color: 'from-blue-900/80 to-blue-600/80'
  },
  nature: {
    type: 'nature',
    label: 'Nature Tower',
    description: 'Poison damage over time',
    cost: 100,
    icon: <GiLeafSwirl className="text-green-500" />,
    color: 'from-green-900/80 to-green-600/80'
  },
  water: {
    type: 'water',
    label: 'Water Tower',
    description: 'Area splash damage',
    cost: 100,
    icon: <GiWaterDrop className="text-blue-400" />,
    color: 'from-blue-900/80 to-blue-500/80'
  },
  dark: {
    type: 'dark',
    label: 'Dark Tower',
    description: 'Weakens enemy armor',
    cost: 100,
    icon: <GiCrownedSkull className="text-purple-400" />,
    color: 'from-purple-900/80 to-purple-600/80'
  }
} as const;

function TowerButton({
  tower,
  isSelected,
  canAfford,
  onClick
}: {
  tower: typeof TOWER_TYPES[keyof typeof TOWER_TYPES];
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`tower-button ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={!canAfford}
    >
      <div className="tower-button-icon">{tower.icon}</div>
      <div className="tower-button-label">{tower.label.split(' ')[0]}</div>

      <div className="tower-tooltip">
        <div className="font-medium mb-1">{tower.label}</div>
        <div className="text-gray-400 text-xs mb-1">{tower.description}</div>
        <div className="text-yellow-500 text-xs flex items-center gap-1">
          <FaCoins className="text-xs" /> {tower.cost}
        </div>
      </div>
    </button>
  );
}

export function BuildMenu() {
  const { phase, selectedObjectType, setSelectedObjectType, money } = useGameStore();

  if (phase !== 'prep') return null;

  return (
    <div className="build-menu">
      <div className="money-display">
        <FaCoins className="money-icon" />
        <span>{money}</span>
      </div>
      <div className="tower-grid">
        {Object.values(TOWER_TYPES).map((tower) => (
          <TowerButton
            key={tower.type}
            tower={tower}
            isSelected={selectedObjectType === tower.type}
            canAfford={money >= tower.cost}
            // if it's already selected, unselect it
            onClick={() => {
              if (money >= tower.cost && selectedObjectType !== tower.type) {
                setSelectedObjectType(tower.type);
              } else {
                setSelectedObjectType(null);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
