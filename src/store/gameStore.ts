import { create } from 'zustand';
import { RapierRigidBody } from '@react-three/rapier';

export type ElementType =
  | 'storm1' | 'storm2' | 'storm3' | 'storm4' | 'storm5'
  | 'fire1' | 'fire2' | 'fire3' | 'fire4' | 'fire5'
  | 'ice1' | 'ice2' | 'ice3' | 'ice4' | 'ice5'
  | 'nature1' | 'nature2' | 'nature3' | 'nature4' | 'nature5'
  | 'water1' | 'water2' | 'water3' | 'water4' | 'water5'
  | 'dark1' | 'dark2' | 'dark3' | 'dark4' | 'dark5';

type PlaceableObjectType = ElementType;
interface CreepState {
  position: [number, number, number];
  type: string;
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
  value: number;
  id: string;
  waveId: number;
  effects: {
    [key: string]: {
      value: number;
      duration: number;
      startTime: number;
      stacks?: number;
    };
  };
}


interface PathSegment {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

interface GameState {
  phase: 'prep' | 'combat' | 'victory';
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  selectedObjectType: PlaceableObjectType | null;
  selectedObjectLevel: number | null;
  skillLevels: {
    [key: string]: number;
  };
  money: number;
  score: number;
  lives: number;
  experience: number;
  level: number;
  skillPoints: number;
  upgrades: {
    damage: number;
    speed: number;
    range: number;
    multishot: number;
  };
  wave: number;
  creeps: CreepState[];
  playerRef: RapierRigidBody | null;
  orbSpeed: number;
  highlightedPathSegment: PathSegment | null;
  currentWave: number;
  totalWaves: number;
  showWaveIndicator: boolean;
  cameraZoom: number;
  cameraAngle: number;
  setPhase: (phase: 'prep' | 'combat' | 'victory') => void;
  setCurrentLevel: (level: number) => void;
  setTimer: (timer: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  setWave: (wave: number) => void;
  addCreep: (creep: CreepState) => void;
  incrementLevel: () => void;
  addMoney: (amount: number) => void;
  setWaveStartTime: (startTime: number) => void;
  removeCreep: (creepId: string) => void;
  removeProjectile: (projectileId: number) => void;
  setPlayerRef: (ref: RapierRigidBody) => void;
  setOrbSpeed: (speed: number) => void;
  setHighlightedPathSegment: (segment: PathSegment | null) => void;
  setShowWaveIndicator: (show: boolean) => void;
  setCameraZoom: (zoom: number) => void;
  setCameraAngle: (angle: number) => void;
  loseLife: () => void;
  reset: () => void;
  addExperience: (amount: number) => void;
  addScore: (amount: number) => void;
  updateCreep: (creepId: string, updates: Partial<CreepState>) => void;
  upgradeSkill: (skillName: string, cost: number) => void;
}

const initialState: GameState = {
  phase: 'prep' as 'prep' | 'combat' | 'victory',
  currentLevel: 1,
  timer: 0,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  selectedObjectType: null,
  selectedObjectLevel: null,
  skillLevels: {},
  money: 1000,
  score: 0,
  lives: 20,
  experience: 0,
  level: 1,
  skillPoints: process.env.NODE_ENV === 'development' ? 99 : 9,
  upgrades: {
    damage: 0,
    speed: 0,
    range: 0,
    multishot: 0,
  },
  wave: 0,
  creeps: [],
  playerRef: null,
  orbSpeed: 1,
  highlightedPathSegment: null,
  currentWave: 0,
  totalWaves: 12,
  showWaveIndicator: false,
  cameraZoom: 1,
  cameraAngle: 0.5, // Default angle (0 is horizontal, 1 is vertical)
  setPhase: () => { },
  setCurrentLevel: () => { },
  setTimer: () => { },
  setEnemiesAlive: () => { },
  setIsSpawning: () => { },
  setLevelComplete: () => { },
  setWave: () => { },
  addCreep: () => { },
  incrementLevel: () => { },
  addMoney: () => { },
  setWaveStartTime: () => { },
  removeCreep: () => { },
  removeProjectile: () => { },
  setPlayerRef: () => { },
  setOrbSpeed: () => { },
  setHighlightedPathSegment: () => { },
  setShowWaveIndicator: () => { },
  setCameraZoom: () => { },
  setCameraAngle: () => { },
  loseLife: () => { },
  reset: () => { },
  addExperience: () => { },
  addScore: () => { },
  updateCreep: () => { },
  upgradeSkill: () => { }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setPhase: (phase) => {
    console.log(`Setting phase to: ${phase}`);
    set({ phase });
  },

  setCurrentLevel: (level) => {
    console.log(`Setting level to: ${level}`);
    set({ currentLevel: level });
  },

  setTimer: (timer) => set({ timer }),

  setEnemiesAlive: (count) => {
    console.log(`Setting enemies alive to: ${count}`);
    console.log(`Enemies alive before: ${get().enemiesAlive}`);
    set({ enemiesAlive: count });
    console.log(`Enemies alive after: ${count}`);
  },

  setIsSpawning: (isSpawning) => {
    console.log(`Setting isSpawning to: ${isSpawning}`);
    set({ isSpawning });
  },

  setLevelComplete: (complete) => set({ levelComplete: complete }),

  setWave: (wave) => {
    console.log(`Setting wave to: ${wave}`);
    set({ wave });
  },

  setSelectedObjectType: (type, level = null) => set({ selectedObjectType: type, selectedObjectLevel: level }),

  addMoney: (amount) => set(state => ({ money: state.money + amount })),

  spendMoney: (amount) => set(state => ({ money: state.money - amount })),

  addScore: (amount) => set(state => ({ score: state.score + amount })),

  loseLife: () => set(state => {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      return {
        ...initialState,
        phase: 'prep',
        currentLevel: 1
      };
    }
    return { lives: newLives };
  }),

  resetLevel: () => set(state => ({
    ...initialState,
    currentLevel: state.currentLevel
  })),

  addCreep: (creep) => {
    console.log(`Adding creep: ${creep.id}`);
    set(state => ({
      creeps: [...state.creeps, creep],
      enemiesAlive: state.enemiesAlive + 1
    }));
  },

  removeCreep: (id) => {
    console.log(`Removing creep: ${id}`);
    set(state => {
      const remainingCreeps = state.creeps.filter(c => c.id !== id);
      const newEnemiesAlive = remainingCreeps.length;
      console.log(`Enemies alive after removal: ${newEnemiesAlive} (based on ${remainingCreeps.length} remaining creeps)`);

      return {
        creeps: remainingCreeps,
        enemiesAlive: newEnemiesAlive
      };
    });
  },

  updateCreep: (id, updates) => {
    set(state => ({
      creeps: state.creeps.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  },

  damageCreep: (id, damage) => {
    const state = get();
    const creep = state.creeps.find(c => c.id === id);
    if (!creep) return;

    const newHealth = creep.health - damage;
    console.log(`Creep ${id} damaged. Health: ${creep.health} -> ${newHealth}. Enemies alive: ${state.enemiesAlive}`);

    if (newHealth <= 0) {
      console.log(`Creep ${id} died. Enemies alive before: ${state.enemiesAlive}`);
      state.addExperience(10 + creep.waveId * 2);
      state.addMoney(creep.value);
      state.addScore(creep.value);
      state.removeCreep(id);
    } else {
      state.updateCreep(id, { health: newHealth });
    }
  },

  addExperience: (amount) => {
    set(state => {
      const newExperience = state.experience + amount;
      const expForNextLevel = state.level * 100; // Each level requires level * 100 XP

      if (newExperience >= expForNextLevel) {
        // Level up and grant skill point
        return {
          experience: newExperience - expForNextLevel,
          level: state.level + 1,
          skillPoints: state.skillPoints + 1
        };
      }

      return { experience: newExperience };
    });
  },

  upgradeSkill: (skillName: string, cost: number) => {
    const state = get();
    if (state.skillPoints >= cost) {
      set((state) => ({
        skillPoints: state.skillPoints - cost,
        skillLevels: {
          ...state.skillLevels,
          [skillName]: (state.skillLevels[skillName] || 0) + 1,
        },
      }));
    }
  },

  incrementLevel: () => set(state => ({
    currentLevel: state.currentLevel + 1,
    wave: 0
  })),

  setPlayerRef: (ref) => set(state => {
    // Only update if the ref has actually changed
    if (state.playerRef !== ref) {
      return { playerRef: ref };
    }
    return state;
  }),

  setHighlightedPathSegment: (segment) => {
    set({ highlightedPathSegment: segment });
  },

  startWave: () => {
    const state = get();
    console.log('Starting wave, current state:', state);

    set((state) => ({
      currentWave: state.currentWave + 1,
      wave: state.currentWave + 1, // Keep wave and currentWave in sync
      showWaveIndicator: true,
      phase: 'combat',
      isSpawning: true,
    }));

    // Hide the indicator after 1 second to allow for 2 second fade out
    setTimeout(() => {
      console.log('Hiding wave indicator');
      set({ showWaveIndicator: false });
    }, 1000);

    console.log('Wave started, new state:', get());
  },
  adjustCameraZoom: (delta: number) => {
    const currentZoom = get().cameraZoom;
    const newZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
    set({ cameraZoom: newZoom });
  },
  adjustCameraAngle: (delta: number) => {
    const currentAngle = get().cameraAngle;
    const newAngle = Math.max(0.2, Math.min(0.8, currentAngle + delta));
    set({ cameraAngle: newAngle });
  },
}));
