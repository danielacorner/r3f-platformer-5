import { useGameStore } from '../store/gameStore';

export function BuildMenu() {
  const phase = useGameStore(state => state.phase);
  const selectedObjectType = useGameStore(state => state.selectedObjectType);
  const setSelectedObjectType = useGameStore(state => state.setSelectedObjectType);

  if (phase !== 'prep') return null;

  const items = [
    { type: 'block', name: 'Block', description: 'Basic defensive block' },
    { type: 'tower', name: 'Arrow Tower', description: 'Shoots arrows at enemies' },
    { type: 'cannon', name: 'Cannon', description: 'Launches explosive fireballs' }
  ] as const;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
      {items.map(item => (
        <button
          key={item.type}
          className={`
            w-24 h-24 bg-gray-800/80 rounded-lg p-2 
            flex flex-col items-center justify-center
            transition-all hover:bg-gray-700/80
            ${selectedObjectType === item.type ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => setSelectedObjectType(item.type)}
        >
          <div className="text-white font-bold mb-1">{item.name}</div>
          <div className="text-gray-300 text-xs text-center">{item.description}</div>
        </button>
      ))}
    </div>
  );
}
