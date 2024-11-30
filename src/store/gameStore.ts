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
    type: 'slow' | 'amplify' | 'poison' | 'splash' | 'armor_reduction' | 'chain_amplify' | 'aura_amplify' | 'purify' | 'burn' | 'meteor' | 'inferno' | 'phoenix' | 'apocalypse' | 'frozen_ground' | 'shatter' | 'blizzard' | 'absolute_zero' | 'spores' | 'thorns' | 'plague' | 'pandemic' | 'tsunami' | 'whirlpool' | 'flood' | 'maelstrom' | 'curse' | 'void' | 'nightmare' | 'oblivion';
    value: number;
    bounces?: number;
    radius?: number;
    heal_block?: number;
    explosion?: number;
    tick_damage?: number;
    stack_multiplier?: number;
    cooldown?: number;
    charge_rate?: number;
    duration?: number;
    shatter_threshold?: number;
    knockback?: number;
    pull_strength?: number;
    slow_value?: number;
    damage_multiplier?: number;
    curse_damage?: number;
    mana_burn?: number;
    fear_chance?: number;
    soul_harvest?: boolean;
  };
  description?: string;
}

export const TOWER_STATS: Record<ElementType, TowerStats> = {
  // Light Towers - Holy Magic
  light1: { damage: 15, range: 8, attackSpeed: 1.0, cost: 100, special: { type: 'amplify', value: 0.15 }, color: '#fef3c7', emissive: '#fcd34d', description: "Blessing - Marks enemies to take increased damage" },
  light2: { damage: 25, range: 8.5, attackSpeed: 1.1, cost: 250, special: { type: 'chain_amplify', value: 0.25, bounces: 2 }, color: '#fef3c7', emissive: '#fcd34d', description: "Holy Chain - Blessing jumps to nearby enemies" },
  light3: { damage: 40, range: 9, attackSpeed: 1.2, cost: 500, special: { type: 'aura_amplify', value: 0.35, radius: 4 }, color: '#fef3c7', emissive: '#fcd34d', description: "Sanctify - Creates an aura that amplifies all damage" },
  light4: { damage: 60, range: 9.5, attackSpeed: 1.3, cost: 1000, special: { type: 'purify', value: 0.45, heal_block: 5 }, color: '#fef3c7', emissive: '#fcd34d', description: "Purification - Prevents enemy healing and amplifies damage" },
  light5: { damage: 90, range: 10, attackSpeed: 1.4, cost: 2000, special: { type: 'divine_mark', value: 0.60, explosion: 100 }, color: '#fef3c7', emissive: '#fcd34d', description: "Divine Judgment - Marked enemies explode on death" },

  // Fire Towers - Destructive Force
  fire1: { damage: 40, range: 6, attackSpeed: 0.8, cost: 100, special: { type: 'burn', value: 10 }, color: '#fecaca', emissive: '#ef4444', description: "Ignite - Sets enemies on fire" },
  fire2: { damage: 85, range: 6.5, attackSpeed: 0.9, cost: 250, special: { type: 'meteor', value: 50, radius: 2 }, color: '#fecaca', emissive: '#ef4444', description: "Meteor - Occasionally drops meteors on groups" },
  fire3: { damage: 150, range: 7, attackSpeed: 1.0, cost: 500, special: { type: 'inferno', value: 20, stack_multiplier: 1.5 }, color: '#fecaca', emissive: '#ef4444', description: "Inferno - Burns stack and intensify" },
  fire4: { damage: 250, range: 7.5, attackSpeed: 1.1, cost: 1000, special: { type: 'phoenix', value: 300, cooldown: 10 }, color: '#fecaca', emissive: '#ef4444', description: "Phoenix - Periodically releases a devastating blast" },
  fire5: { damage: 400, range: 8, attackSpeed: 1.2, cost: 2000, special: { type: 'apocalypse', value: 100, charge_rate: 0.2 }, color: '#fecaca', emissive: '#ef4444', description: "Apocalypse - Damage increases while attacking same target" },

  // Ice Towers - Control and Debuff
  ice1: { damage: 20, range: 7, attackSpeed: 1.2, cost: 100, special: { type: 'slow', value: 0.2 }, color: '#e0f2fe', emissive: '#38bdf8', description: "Frost - Slows enemy movement" },
  ice2: { damage: 35, range: 7.5, attackSpeed: 1.3, cost: 250, special: { type: 'frozen_ground', value: 0.3, duration: 3 }, color: '#e0f2fe', emissive: '#38bdf8', description: "Frozen Ground - Creates slowing fields" },
  ice3: { damage: 55, range: 8, attackSpeed: 1.4, cost: 500, special: { type: 'shatter', value: 0.4, shatter_threshold: 0.5 }, color: '#e0f2fe', emissive: '#38bdf8', description: "Shatter - Extra damage to slowed enemies" },
  ice4: { damage: 80, range: 8.5, attackSpeed: 1.5, cost: 1000, special: { type: 'blizzard', value: 0.5, tick_damage: 20 }, color: '#e0f2fe', emissive: '#38bdf8', description: "Blizzard - Creates damaging snow storms" },
  ice5: { damage: 120, range: 9, attackSpeed: 1.6, cost: 2000, special: { type: 'absolute_zero', value: 0.65, freeze_chance: 0.2 }, color: '#e0f2fe', emissive: '#38bdf8', description: "Absolute Zero - Chance to temporarily freeze enemies" },

  // Nature Towers - Poison and Growth
  nature1: { damage: 25, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'poison', value: 10 }, color: '#dcfce7', emissive: '#22c55e', description: "Toxin - Basic poison damage over time" },
  nature2: { damage: 45, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'spores', value: 15, spread_chance: 0.3 }, color: '#dcfce7', emissive: '#22c55e', description: "Spores - Poison can spread to nearby enemies" },
  nature3: { damage: 70, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'thorns', value: 25, thorns_damage: 0.5 }, color: '#dcfce7', emissive: '#22c55e', description: "Thorns - Creates damaging zones on the path" },
  nature4: { damage: 100, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'plague', value: 40, multiplier: 1.2 }, color: '#dcfce7', emissive: '#22c55e', description: "Plague - Poison damage increases with number of infected" },
  nature5: { damage: 150, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'pandemic', value: 60, evolve_time: 5 }, color: '#dcfce7', emissive: '#22c55e', description: "Pandemic - Poison evolves and becomes stronger over time" },

  // Water Towers - Area Control
  water1: { damage: 30, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'splash', value: 0.5 }, color: '#dbeafe', emissive: '#3b82f6', description: "Splash - Basic area damage" },
  water2: { damage: 50, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'tsunami', value: 0.6, knockback: 2 }, color: '#dbeafe', emissive: '#3b82f6', description: "Tsunami - Pushes enemies back" },
  water3: { damage: 80, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'whirlpool', value: 0.7, pull_strength: 0.5 }, color: '#dbeafe', emissive: '#3b82f6', description: "Whirlpool - Creates vortexes that pull enemies" },
  water4: { damage: 120, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'flood', value: 0.8, slow_value: 0.3 }, color: '#dbeafe', emissive: '#3b82f6', description: "Flood - Creates persistent water zones that slow" },
  water5: { damage: 180, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'maelstrom', value: 0.9, damage_multiplier: 2 }, color: '#dbeafe', emissive: '#3b82f6', description: "Maelstrom - Damage increases for grouped enemies" },

  // Dark Towers - Debuff and Curse
  dark1: { damage: 35, range: 7, attackSpeed: 1.0, cost: 100, special: { type: 'armor_reduction', value: 0.15 }, color: '#f3e8ff', emissive: '#a855f7', description: "Shadow - Reduces enemy armor" },
  dark2: { damage: 60, range: 7.5, attackSpeed: 1.1, cost: 250, special: { type: 'curse', value: 0.25, curse_damage: 0.2 }, color: '#f3e8ff', emissive: '#a855f7', description: "Curse - Cursed enemies take damage when nearby enemies die" },
  dark3: { damage: 90, range: 8, attackSpeed: 1.2, cost: 500, special: { type: 'void', value: 0.35, mana_burn: 0.3 }, color: '#f3e8ff', emissive: '#a855f7', description: "Void - Drains special abilities from enemies" },
  dark4: { damage: 140, range: 8.5, attackSpeed: 1.3, cost: 1000, special: { type: 'nightmare', value: 0.45, fear_chance: 0.2 }, color: '#f3e8ff', emissive: '#a855f7', description: "Nightmare - Chance to fear enemies, making them retreat" },
  dark5: { damage: 200, range: 9, attackSpeed: 1.4, cost: 2000, special: { type: 'oblivion', value: 0.60, soul_harvest: true }, color: '#f3e8ff', emissive: '#a855f7', description: "Oblivion - Harvests souls of fallen enemies for bonus effects" }
};

interface CreepState {
  position: [number, number, number];
  type: string;
  health: number;
  maxHealth: number;
  id: number;
  effects: {
    [key: string]: {
      value: number;
      duration: number;
      startTime: number;
      stacks?: number;
    };
  };
}

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
  wave: number;
  creeps: CreepState[];
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
  money: process.env.NODE_ENV === 'development' ? 10000 : 200, // Starting money
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
  addCreep: (creep: CreepState) => void;
  removeCreep: (id: number) => void;
  updateCreep: (id: number, updates: Partial<CreepState>) => void;
  applyEffectToCreep: (id: number, type: string, value: number, duration: number) => void;
  damageCreep: (id: number, damage: number) => void;
}>((set, get) => ({
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
      money: state.money - cost,
      selectedObjectType: type // Keep the tower type selected
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

  applyEffectToCreep: (id, type, value, duration) => set((state) => ({
    creeps: state.creeps.map((creep) =>
      creep.id === id
        ? {
          ...creep,
          effects: {
            ...creep.effects,
            [type]: {
              value,
              duration,
              startTime: Date.now(),
              stacks: (creep.effects[type]?.stacks || 0) + 1
            }
          }
        }
        : creep
    )
  })),

  damageCreep: (id, damage) => {
    const state = get();
    const creep = state.creeps.find((c) => c.id === id);
    if (!creep) return;

    // Calculate final damage with effects
    let finalDamage = damage;

    // Apply amplification effects
    const amplifyEffect = creep.effects['amplify'];
    if (amplifyEffect && Date.now() - amplifyEffect.startTime < amplifyEffect.duration * 1000) {
      finalDamage *= (1 + amplifyEffect.value);
    }

    // Apply armor reduction
    const armorEffect = creep.effects['armor_reduction'];
    if (armorEffect && Date.now() - armorEffect.startTime < armorEffect.duration * 1000) {
      finalDamage *= (1 + armorEffect.value);
    }

    // Update creep health
    set((state) => ({
      creeps: state.creeps.map((c) =>
        c.id === id
          ? { ...c, health: Math.max(0, c.health - finalDamage) }
          : c
      )
    }));
  },
}));