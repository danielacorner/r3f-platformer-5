import { useGameStore, getBoxCost } from '../store/gameStore';

export function BuildMenu() {
  const { phase, selectedObjectType, setSelectedObjectType, money } = useGameStore();

  if (phase !== 'prep') return null;

  const items = [
    { type: 'block', label: 'Block', cost: getBoxCost('block') },
    { type: 'tower', label: 'Arrow Tower', cost: getBoxCost('tower') },
    { type: 'cannon', label: 'Cannon', cost: getBoxCost('cannon') },
    { type: 'boomerang', label: 'Boomerang Tower', cost: getBoxCost('boomerang') },
  ] as const;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/50 p-4 rounded-lg pointer-events-auto">
      {/* Money Display */}
      <div className="text-yellow-400 text-xl font-bold mb-2 text-center">
        Gold: {money}
      </div>
      
      <div className="flex gap-2">
        {items.map(({ type, label, cost }) => (
          <button
            key={type}
            onClick={() => setSelectedObjectType(type)}
            className={`
              px-4 py-2 rounded
              ${selectedObjectType === type ? 'bg-blue-500' : 'bg-gray-700'}
              ${money >= cost ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'}
              transition-colors
            `}
            disabled={money < cost}
          >
            <div className="text-white">{label}</div>
            <div className="text-yellow-400 text-sm">{cost} gold</div>
          </button>
        ))}
      </div>
    </div>
  );
}
