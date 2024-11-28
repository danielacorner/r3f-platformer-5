import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

interface PlacedBox {
  id: number;
  position: Vector3;
  type: 'block' | 'tower' | 'cannon';
}

interface GameState {
  phase: 'prep' | 'combat';
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  placedBoxes: PlacedBox[];
  selectedObjectType: 'block' | 'tower' | 'cannon';
  playerRef: React.MutableRefObject<RapierRigidBody | null>;
  money: number;
}

const initialState: GameState = {
  phase: 'prep',
  currentLevel: 1,
  timer: 4,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  placedBoxes: [],
  selectedObjectType: 'block',
  playerRef: { current: null },
  money: 20, // Starting money
};

export const useGameStore = create<GameState & {
  setPhase: (phase: 'prep' | 'combat') => void;
  setCurrentLevel: (level: number) => void;
  setTimer: (timer: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  addPlacedBox: (position: Vector3, type: 'block' | 'tower' | 'cannon') => void;
  removePlacedBox: (id: number) => void;
  setSelectedObjectType: (type: 'block' | 'tower' | 'cannon') => void;
  setPlayerRef: (ref: React.MutableRefObject<RapierRigidBody | null>) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  resetLevel: () => void;
}>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setCurrentLevel: (level) => set({
    currentLevel: level,
    timer: 4,
    enemiesAlive: 0,
    isSpawning: false,
    levelComplete: false,
    phase: 'prep',
    placedBoxes: []
  }),
  setTimer: (timer) => {
    set({ timer });
    if (timer <= 0) {
      set({ isSpawning: false });
    }
  },
  setEnemiesAlive: (count) => {
    console.log('Setting enemies alive:', count);
    set((state) => {
      // Only complete level if no enemies are left and timer has run out
      if (count === 0 && state.phase === 'combat' && !state.isSpawning) {
        console.log('Level complete!');
        return { enemiesAlive: count, levelComplete: true };
      }
      return { enemiesAlive: count };
    });
  },
  setIsSpawning: (isSpawning) => {
    console.log('Setting isSpawning:', isSpawning);
    set({ isSpawning });
  },
  setLevelComplete: (complete) => set({ levelComplete: complete }),

  addPlacedBox: (position, type) => {
    set((state) => {
      // Check if player has enough money
      const cost = getBoxCost(type);
      if (state.money < cost) return state;

      return {
        placedBoxes: [...state.placedBoxes, {
          id: state.placedBoxes.length,
          position: position.clone(),
          type
        }],
        money: state.money - cost
      };
    });
  },

  removePlacedBox: (id) => {
    set((state) => {
      const box = state.placedBoxes.find(box => box.id === id);
      if (!box) return state;
      
      // Refund the cost of the removed box
      const refundAmount = getBoxCost(box.type);
      
      return {
        placedBoxes: state.placedBoxes.filter((box) => box.id !== id),
        money: state.money + refundAmount
      };
    });
  },

  setSelectedObjectType: (type) => set({ selectedObjectType: type }),

  setPlayerRef: (ref) => set({ playerRef: ref }),

  addMoney: (amount) => set((state) => ({
    money: state.money + amount
  })),

  spendMoney: (amount) => set((state) => {
    if (state.money < amount) return { money: state.money };
    return { money: state.money - amount };
  }),

  resetLevel: () => set((state) => ({
    ...initialState,
    currentLevel: state.currentLevel,
    money: 10 // Reset money to starting amount
  })),
}));

// Box costs
export const getBoxCost = (type: 'block' | 'tower' | 'cannon'): number => {
  switch (type) {
    case 'block': return 1;
    case 'tower': return 5;
    case 'cannon': return 8;
    default: return 0;
  }
};