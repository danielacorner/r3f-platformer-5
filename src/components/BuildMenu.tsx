import { useGameStore, getBoxCost } from '../store/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { GiStoneBlock, GiArrowScope, GiLaserPrecision, GiCannonBall, GiBoomerang } from 'react-icons/gi';
import { FaCoins } from 'react-icons/fa';

function MobileMenu({ 
  items, 
  selectedObjectType, 
  setSelectedObjectType, 
  money 
}: { 
  items: { type: string; label: string; cost: number; icon: React.ReactNode; }[]; 
  selectedObjectType: string | null; 
  setSelectedObjectType: (type: string) => void; 
  money: number; 
}) {
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-black/95 p-2.5 rounded-lg z-50 w-[360px] max-w-[90vw] pointer-events-auto border border-gray-800">
      <div className="flex items-center gap-2 px-2 mb-2">
        <div className="text-yellow-500 font-medium text-sm flex items-center gap-1">
          <FaCoins className="text-xs" /> {money}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {items.map(({ type, label, cost, icon }) => (
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
              relative
              w-14 h-14
              rounded
              ${selectedObjectType === type ? 'bg-gradient-to-br from-blue-900/80 to-blue-600/80' : 'bg-gradient-to-br from-gray-900/80 to-gray-800/80'}
              ${money >= cost ? 'active:from-blue-800/80 active:to-blue-700/80' : 'opacity-50'}
              transition-all
              flex flex-col items-center justify-center
              select-none
              touch-manipulation
              border
              ${selectedObjectType === type ? 'border-blue-500' : money >= cost ? 'border-gray-700 hover:border-gray-600' : 'border-gray-800'}
              group
              overflow-hidden
            `}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            disabled={money < cost}
            title={`${label} (${cost} gold)`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 text-4xl text-white">
              {icon}
            </div>
            <div className="relative flex flex-col items-center">
              <div className="text-white text-lg mb-1">
                {icon}
              </div>
              <div className="text-white text-[10px] font-medium">{label}</div>
              <div className="text-yellow-500 text-[10px] flex items-center gap-0.5">
                <FaCoins className="text-[8px]" /> {cost}
              </div>
            </div>
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
  items: { type: string; label: string; cost: number; icon: React.ReactNode; }[]; 
  selectedObjectType: string | null; 
  setSelectedObjectType: (type: string) => void; 
  money: number; 
}) {
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-black/95 p-2.5 rounded-lg pointer-events-auto border border-gray-800">
      <div className="flex items-center gap-3">
        <div className="text-yellow-500 font-medium text-sm flex items-center gap-1 px-2">
          <FaCoins className="text-xs" /> {money}
        </div>
        <div className="h-8 w-px bg-gray-800"></div>
        <div className="flex gap-2.5">
          {items.map(({ type, label, cost, icon }) => (
            <button
              key={type}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedObjectType(type);
              }}
              className={`
                relative
                w-14 h-14
                rounded
                ${selectedObjectType === type ? 'bg-gradient-to-br from-blue-900/80 to-blue-600/80' : 'bg-gradient-to-br from-gray-900/80 to-gray-800/80'}
                ${money >= cost ? 'hover:from-blue-800/80 hover:to-blue-700/80' : 'opacity-50 cursor-not-allowed'}
                transition-all
                border
                ${selectedObjectType === type ? 'border-blue-500' : money >= cost ? 'border-gray-700 hover:border-gray-600' : 'border-gray-800'}
                group
                overflow-hidden
              `}
              disabled={money < cost}
              title={`${label} (${cost} gold)`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-20 text-4xl text-white">
                {icon}
              </div>
              <div className="relative flex flex-col items-center">
                <div className="text-white text-lg mb-1">
                  {icon}
                </div>
                <div className="text-white text-[10px] font-medium">{label}</div>
                <div className="text-yellow-500 text-[10px] flex items-center gap-0.5 opacity-75 group-hover:opacity-100">
                  <FaCoins className="text-[8px]" /> {cost}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BuildMenu() {
  const { phase, selectedObjectType, setSelectedObjectType, money } = useGameStore();
  const isMobile = useIsMobile();

  if (phase !== 'prep') return null;

  const items = [
    { type: 'block', label: 'Block', cost: getBoxCost('block'), icon: <GiStoneBlock /> },
    { type: 'arrow', label: 'Arrow', cost: getBoxCost('arrow'), icon: <GiArrowScope /> },
    { type: 'tower', label: 'Laser', cost: getBoxCost('laser'), icon: <GiLaserPrecision /> },
    { type: 'cannon', label: 'Cannon', cost: getBoxCost('cannon'), icon: <GiCannonBall /> },
    { type: 'boomerang', label: 'Boom', cost: getBoxCost('boomerang'), icon: <GiBoomerang /> },
  ] as const;

  const menuProps = {
    items,
    selectedObjectType,
    setSelectedObjectType,
    money
  };

  return isMobile ? <MobileMenu {...menuProps} /> : <DesktopMenu {...menuProps} />;
}
