import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

export type TowerType = 'arrow' | 'cannon' | 'laser' | 'boomerang';
type PlaceableObjectType = 'block' | TowerType;

interface PlacedBox {
  id: number;
  position: Vector3;
  type: PlaceableObjectType;
}

interface GameState {
  phase: 'prep' | 'combat';
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  placedBoxes: PlacedBox[];
  selectedObjectType: PlaceableObjectType;
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


export interface Tower {
  id: number;
  type: TowerType;
  position: Vector3;
}

export const towerCosts: Record<TowerType, number> = {
  arrow: 5,
  cannon: 15,
  laser: 8,
  boomerang: 12
};

export const useGameStore = create<GameState & {
  setPhase: (phase: 'prep' | 'combat') => void;
  setCurrentLevel: (level: number) => void;
  setTimer: (timer: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  addPlacedBox: (position: Vector3, type: PlaceableObjectType) => void;
  removePlacedBox: (id: number) => void;
  setSelectedObjectType: (type: PlaceableObjectType) => void;
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
      let cost = 0;
      if (type === 'block') {
        cost = 1;
      } else if (type === 'arrow') {
        cost = towerCosts.arrow;
      } else if (type === 'laser') {
        cost = towerCosts.laser;
      } else if (type === 'cannon') {
        cost = towerCosts.cannon;
      } else if (type === 'boomerang') {
        cost = towerCosts.boomerang;
      }

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
      let refundAmount = 0;
      if (box.type === 'block') {
        refundAmount = 1;
      } else if (box.type === 'arrow') {
        refundAmount = towerCosts.arrow;
      } else if (box.type === 'laser') {
        refundAmount = towerCosts.laser;
      } else if (box.type === 'cannon') {
        refundAmount = towerCosts.cannon;
      } else if (box.type === 'boomerang') {
        refundAmount = towerCosts.boomerang;
      }

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
export const getBoxCost = (type: PlaceableObjectType): number => {
  if (type === 'block') return 1;
  if (type === 'arrow') return towerCosts.arrow;
  if (type === 'laser') return towerCosts.laser;
  if (type === 'cannon') return towerCosts.cannon;
  if (type === 'boomerang') return towerCosts.boomerang;
  return 0;
};