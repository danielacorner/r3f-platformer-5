import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

export type ElementType = 'light' | 'fire' | 'ice' | 'nature' | 'water' | 'dark';
type PlaceableObjectType = ElementType;

interface TowerStats {
  damage: number;
  range: number;
  attackSpeed: number;
  special?: {
    type: 'slow' | 'amplify' | 'poison' | 'splash' | 'armor_reduction';
    value: number;
  };
}

export const TOWER_STATS: Record<ElementType, TowerStats> = {
  light: {
    damage: 15,
    range: 8,
    attackSpeed: 1,
    special: {
      type: 'amplify',
      value: 0.2 // 20% damage amplification
    }
  },
  fire: {
    damage: 40,
    range: 6,
    attackSpeed: 0.8
  },
  ice: {
    damage: 20,
    range: 7,
    attackSpeed: 1.2,
    special: {
      type: 'slow',
      value: 0.3 // 30% slow
    }
  },
  nature: {
    damage: 25,
    range: 7,
    attackSpeed: 1,
    special: {
      type: 'poison',
      value: 10 // 10 damage per second
    }
  },
  water: {
    damage: 30,
    range: 6,
    attackSpeed: 1.1,
    special: {
      type: 'splash',
      value: 0.5 // 50% splash damage
    }
  },
  dark: {
    damage: 35,
    range: 7,
    attackSpeed: 0.9,
    special: {
      type: 'armor_reduction',
      value: 0.2 // 20% armor reduction
    }
  }
};

interface PlacedTower {
  id: number;
  position: Vector3;
  type: ElementType;
  level: number;
  kills: number;
}

interface GameState {
  phase: 'prep' | 'combat';
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  placedTowers: PlacedTower[];
  selectedObjectType: PlaceableObjectType | null;
  money: number;
  score: number;
  lives: number;
}

const initialState: GameState = {
  phase: 'prep',
  currentLevel: 1,
  timer: 4,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  placedTowers: [],
  selectedObjectType: null,
  money: 100, // Starting money
  score: 0,
  lives: 20
};

export const useGameStore = create<GameState & {
  setPhase: (phase: GameState['phase']) => void;
  setCurrentLevel: (level: number) => void;
  setTimer: (timer: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  addPlacedTower: (position: Vector3, type: ElementType) => void;
  removePlacedTower: (id: number) => void;
  upgradeTower: (id: number) => void;
  setSelectedObjectType: (type: PlaceableObjectType | null) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  addScore: (amount: number) => void;
  loseLife: () => void;
  resetLevel: () => void;
}>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  
  setCurrentLevel: (level) => set((state) => ({ 
    currentLevel: level,
    money: state.money + (level * 50) // Bonus money each level
  })),
  
  setTimer: (timer) => set({ timer }),
  
  setEnemiesAlive: (count) => set((state) => {
    if (count === 0 && state.phase === 'combat') {
      return {
        enemiesAlive: count,
        phase: 'prep',
        levelComplete: true
      };
    }
    return { enemiesAlive: count };
  }),
  
  setIsSpawning: (isSpawning) => set({ isSpawning }),
  
  setLevelComplete: (complete) => set({ levelComplete: complete }),
  
  addPlacedTower: (position, type) => set((state) => {
    const cost = 100; // Base tower cost
    if (state.money < cost) return state;
    
    return {
      placedTowers: [
        ...state.placedTowers,
        {
          id: Date.now(),
          position,
          type,
          level: 1,
          kills: 0
        }
      ],
      money: state.money - cost
    };
  }),
  
  removePlacedTower: (id) => set((state) => ({
    placedTowers: state.placedTowers.filter((tower) => tower.id !== id),
    money: state.money + 50 // Refund half the cost
  })),
  
  upgradeTower: (id) => set((state) => {
    const tower = state.placedTowers.find((t) => t.id === id);
    if (!tower) return state;
    
    const upgradeCost = 100 * tower.level; // Cost increases with level
    if (state.money < upgradeCost) return state;
    
    return {
      placedTowers: state.placedTowers.map((t) =>
        t.id === id ? { ...t, level: t.level + 1 } : t
      ),
      money: state.money - upgradeCost
    };
  }),
  
  setSelectedObjectType: (type) => set({ selectedObjectType: type }),
  
  addMoney: (amount) => set((state) => ({ 
    money: state.money + amount 
  })),
  
  spendMoney: (amount) => set((state) => {
    if (state.money < amount) return state;
    return { money: state.money - amount };
  }),
  
  addScore: (amount) => set((state) => ({
    score: state.score + amount
  })),
  
  loseLife: () => set((state) => {
    const lives = state.lives - 1;
    if (lives <= 0) {
      return { ...initialState }; // Game over, reset everything
    }
    return { lives };
  }),
  
  resetLevel: () => set((state) => ({
    ...initialState,
    currentLevel: state.currentLevel
  }))
}));