import { useGameStore, getBoxCost } from '../store/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';

function MobileMenu({ 
  items, 
  selectedObjectType, 
  setSelectedObjectType, 
  money 
}: { 
  items: { type: string; label: string; cost: number; }[]; 
  selectedObjectType: string | null; 
  setSelectedObjectType: (type: string) => void; 
  money: number; 
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 p-4 rounded-lg z-50 w-[90%] max-w-md pointer-events-auto">
      <div className="text-yellow-400 text-xl font-bold mb-4 text-center">
        Gold: {money}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ type, label, cost }) => (
          <button
            key={type}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (money >= cost) {
                setSelectedObjectType(type);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (money >= cost) {
                setSelectedObjectType(type);
              }
            }}
            className={`
              p-4 rounded-lg
              ${selectedObjectType === type ? 'bg-blue-500' : 'bg-gray-700'}
              ${money >= cost ? 'active:bg-blue-700' : 'opacity-50'}
              transition-colors
              min-h-[80px]
              flex flex-col items-center justify-center
              select-none
              touch-manipulation
            `}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            disabled={money < cost}
          >
            <div className="text-white text-lg font-bold">{label}</div>
            <div className="text-yellow-400 text-base mt-1">{cost} gold</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DesktopMenu({ 
  items, 
  selectedObjectType, 
  setSelectedObjectType, 
  money 
}: { 
  items: { type: string; label: string; cost: number; }[]; 
  selectedObjectType: string | null; 
  setSelectedObjectType: (type: string) => void; 
  money: number; 
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/50 p-4 rounded-lg pointer-events-auto">
      <div className="text-yellow-400 text-xl font-bold mb-2 text-center">
        Gold: {money}
      </div>
      <div className="flex gap-2">
        {items.map(({ type, label, cost }) => (
          <button
            key={type}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedObjectType(type);
            }}
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

export function BuildMenu() {
  const { phase, selectedObjectType, setSelectedObjectType, money } = useGameStore();
  const isMobile = useIsMobile();

  if (phase !== 'prep') return null;

  const items = [
    { type: 'block', label: 'Block', cost: getBoxCost('block') },
    { type: 'arrow', label: 'Arrow Tower', cost: getBoxCost('arrow') },
    { type: 'tower', label: 'Laser Tower', cost: getBoxCost('laser') },
    { type: 'cannon', label: 'Cannon', cost: getBoxCost('cannon') },
    { type: 'boomerang', label: 'Boomerang Tower', cost: getBoxCost('boomerang') },
  ] as const;

  const menuProps = {
    items,
    selectedObjectType,
    setSelectedObjectType,
    money
  };

  return isMobile ? <MobileMenu {...menuProps} /> : <DesktopMenu {...menuProps} />;
}
