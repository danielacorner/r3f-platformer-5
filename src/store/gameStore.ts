import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

export type ElementType = 
  | 'light1' | 'light2' | 'light3' | 'light4' | 'light5'
  | 'fire1' | 'fire2' | 'fire3' | 'fire4' | 'fire5'
  | 'ice1' | 'ice2' | 'ice3' | 'ice4' | 'ice5'
  | 'nature1' | 'nature2' | 'nature3' | 'nature4' | 'nature5'
  | 'water1' | 'water2' | 'water3' | 'water4' | 'water5'
  | 'dark1' | 'dark2' | 'dark3' | 'dark4' | 'dark5';

type PlaceableObjectType = ElementType;

interface TowerStats {
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number;
  color?: string;
  emissive?: string;
  special?: {
    type: 'slow' | 'amplify' | 'poison' | 'splash' | 'armor_reduction';
    value: number;
  };
}

export const TOWER_STATS: Record<ElementType, TowerStats> = {
  // Light Towers - Damage Amplification
  light1: { damage: 15, range: 8, attackSpeed: 1.0, cost: 100, special: { type: 'amplify', value: 0.15 }, color: '#fef3c7', emissive: '#fcd34d' },
  light2: { damage: 25, range: 8.5, attackSpeed: 1.1, cost: 250, special: { type: 'amplify', value: 0.25 }, color: '#fef3c7', emissive: '#fcd34d' },
  light3: { damage: 40, range: 9, attackSpeed: 1.2, cost: 500, special: { type: 'amplify', value: 0.35 }, color: '#fef3c7', emissive: '#fcd34d' },
  light4: { damage: 60, range: 9.5, attackSpeed: 1.3, cost: 1000, special: { type: 'amplify', value: 0.45 }, color: '#fef3c7', emissive: '#fcd34d' },
  light5: { damage: 90, range: 10, attackSpeed: 1.4, cost: 2000, special: { type: 'amplify', value: 0.60 }, color: '#fef3c7', emissive: '#fcd34d' },

  // Fire Towers - Pure Damage
  fire1: { damage: 40, range: 6, attackSpeed: 0.8, cost: 100, color: '#fecaca', emissive: '#ef4444' },
  fire2: { damage: 85, range: 6.5, attackSpeed: 0.9, cost: 250, color: '#fecaca', emissive: '#ef4444' },
  fire3: { damage: 150, range: 7, attackSpeed: 1.0, cost: 500, color: '#fecaca', emissive: '#ef4444' },
  fire4: { damage: 250, range: 7.5, attackSpeed: 1.1, cost: 1000, color: '#fecaca', emissive: '#ef4444' },
  fire5: { damage: 400, range: 8, attackSpeed: 1.2, cost: 2000, color: '#fecaca', emissive: '#ef4444' },

  // Ice Towers - Slow Effect
  ice1: { damage: 20, range: 7, attackSpeed: 1.2, cost: 100, special: { type: 'slow', value: 0.2 }, color: '#e0f2fe', emissive: '#38bdf8' },
  ice2: { damage: 35, range: 7.5, attackSpeed: 1.3, cost: 250, special: { type: 'slow', value: 0.3 }, color: '#e0f2fe', emissive: '#38bdf8' },
  ice3: { damage: 55, range: 8, attackSpeed: 1.4, cost: 500, special: { type: 'slow', value: 0.4 }, color: '#e0f2fe', emissive: '#38bdf8' },
  ice4: { damage: 80, range: 8.5, attackSpeed: 1.5, cost: 1000, special: { type: 'slow', value: 0.5 }, color: '#e0f2fe', emissive: '#38bdf8' },
  ice5: { damage: 120, range: 9, attackSpeed: 1.6, cost: 2000, special: { type: 'slow', value: 0.65 }, color: '#e0f2fe', emissive: '#38bdf8' },

  // Nature Towers - Poison Damage
  nature1: { damage: 25, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'poison', value: 10 }, color: '#dcfce7', emissive: '#22c55e' },
  nature2: { damage: 45, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'poison', value: 15 }, color: '#dcfce7', emissive: '#22c55e' },
  nature3: { damage: 70, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'poison', value: 25 }, color: '#dcfce7', emissive: '#22c55e' },
  nature4: { damage: 100, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'poison', value: 40 }, color: '#dcfce7', emissive: '#22c55e' },
  nature5: { damage: 150, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'poison', value: 60 }, color: '#dcfce7', emissive: '#22c55e' },

  // Water Towers - Splash Damage
  water1: { damage: 30, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'splash', value: 0.5 }, color: '#dbeafe', emissive: '#3b82f6' },
  water2: { damage: 50, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'splash', value: 0.6 }, color: '#dbeafe', emissive: '#3b82f6' },
  water3: { damage: 80, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'splash', value: 0.7 }, color: '#dbeafe', emissive: '#3b82f6' },
  water4: { damage: 120, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'splash', value: 0.8 }, color: '#dbeafe', emissive: '#3b82f6' },
  water5: { damage: 180, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'splash', value: 0.9 }, color: '#dbeafe', emissive: '#3b82f6' },

  // Dark Towers - Armor Reduction
  dark1: { damage: 35, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'armor_reduction', value: 0.15 }, color: '#f3e8ff', emissive: '#a855f7' },
  dark2: { damage: 60, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'armor_reduction', value: 0.25 }, color: '#f3e8ff', emissive: '#a855f7' },
  dark3: { damage: 90, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'armor_reduction', value: 0.35 }, color: '#f3e8ff', emissive: '#a855f7' },
  dark4: { damage: 140, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'armor_reduction', value: 0.45 }, color: '#f3e8ff', emissive: '#a855f7' },
  dark5: { damage: 200, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'armor_reduction', value: 0.60 }, color: '#f3e8ff', emissive: '#a855f7' }
};

interface PlacedTower {
  id: number;
  position: Vector3;
  type: ElementType;
  level: number;
  kills: number;
}

interface Creep {
  id: number;
  position: [number, number, number];
  type: string;
  health: number;
  maxHealth: number;
  effects: any;
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
  wave: number;
  creeps: Creep[];
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
  lives: 20,
  wave: 0,
  creeps: []
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
  spendMoney: (amount: number) => void;
  addScore: (amount: number) => void;
  loseLife: () => void;
  resetLevel: () => void;
  setWave: (wave: number) => void;
  addCreep: (creep: Creep) => void;
  removeCreep: (id: number) => void;
  updateCreep: (id: number, updates: Partial<Creep>) => void;
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
    const cost = TOWER_STATS[type].cost; // Get cost from TOWER_STATS
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
    
    const upgradeCost = TOWER_STATS[tower.type].cost * tower.level; // Cost increases with level
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
  })),
  
  setWave: (wave) => set({ wave }),
  
  addCreep: (creep) => set((state) => ({ creeps: [...state.creeps, creep] })),
  
  removeCreep: (id) => set((state) => ({ creeps: state.creeps.filter(c => c.id !== id) })),
  
  updateCreep: (id, updates) => set((state) => ({
    creeps: state.creeps.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
}));