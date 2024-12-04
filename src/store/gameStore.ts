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
}

export interface Projectile {
  id: number;
  startPos: Vector3;
  targetPos: Vector3;
  currentPos: Vector3;
  progress: number;
  targetCreepId: string;
}

export interface TowerState {
  id: string;
  type: string;
  position: [number, number, number];
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  special: string;
  cost: number;
  sellValue: number;
  kills: number;
  damageDealt: number;
  lastAttackTime?: number;
}

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

interface PlacedTower {
  id: number;
  position: Vector3;
  type: ElementType;
  level: number;
  kills: number;
}

interface GameState {
  phase: 'prep' | 'combat' | 'victory';
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  placedTowers: PlacedTower[];
  selectedObjectType: PlaceableObjectType | null;
  selectedObjectLevel: number | null;
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
  projectiles: Projectile[];
  towerStates: TowerState[];
  playerRef: any | null;
  orbSpeed: number;
}

const initialState: GameState = {
  phase: 'prep',
  currentLevel: 1,
  timer: 0,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  placedTowers: [],
  selectedObjectType: null,
  selectedObjectLevel: null,
  money: process.env.NODE_ENV === 'development' ? 10000 : 500,
  score: 0,
  lives: 20,
  experience: process.env.NODE_ENV === 'development' ? 90 : 0,
  level: 1,
  skillPoints: process.env.NODE_ENV === 'development' ? 99 : 0,
  upgrades: {
    damage: 0,
    speed: 0,
    range: 0,
    multishot: 0
  },
  wave: 0,
  creeps: [],
  projectiles: [],
  towerStates: [],
  playerRef: null,
  orbSpeed: 1,
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

  addPlacedTower: (position, type, level) => {
    const state = get();
    const cost = TOWER_STATS[type]?.cost ?? 0;
    if (state.money >= cost) {
      set(state => ({
        placedTowers: [...state.placedTowers, {
          id: Date.now(),
          position,
          type,
          level,
          kills: 0
        }],
        money: state.money - cost
      }));
    }
  },

  removePlacedTower: (id) => set(state => ({
    placedTowers: state.placedTowers.filter(tower => tower.id !== id)
  })),

  upgradeTower: (id) => {
    const state = get();
    const tower = state.placedTowers.find(t => t.id === id);
    if (tower) {
      const upgradeCost = Math.floor((TOWER_STATS[tower.type]?.cost ?? 0) * Math.pow(2, tower.level));
      if (state.money >= upgradeCost) {
        set(state => ({
          placedTowers: state.placedTowers.map(t =>
            t.id === id ? { ...t, level: t.level + 1 } : t
          ),
          money: state.money - upgradeCost
        }));
      }
    }
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

  upgradeSkill: (skill) => {
    set(state => {
      if (state.skillPoints <= 0) return state;

      const newUpgrades = {
        ...state.upgrades,
        [skill]: state.upgrades[skill] + 1
      };

      // Calculate derived stats
      const damageMultiplier = 1 + (newUpgrades.damage * 0.15); // 15% per level
      
      // Calculate speed stats with new mechanics
      let cooldownReduction = 1;
      let orbSpeedBonus = 1;
      
      if (skill === 'speed') {
        const totalSpeedReduction = newUpgrades.speed * 0.12; // 12% per level
        if (totalSpeedReduction >= 1) {
          // Cap cooldown reduction at 100% and convert excess to orb speed
          cooldownReduction = 0; // -100% cooldown
          const excessReduction = totalSpeedReduction - 1;
          orbSpeedBonus = 1 + excessReduction; // Convert excess to orb speed
        } else {
          cooldownReduction = 1 - totalSpeedReduction;
          orbSpeedBonus = 1;
        }
      } else {
        // For other skills, maintain current cooldown reduction
        cooldownReduction = 1 - (newUpgrades.speed * 0.12);
      }
      
      const rangeMultiplier = 1 + (newUpgrades.range * 0.12); // 12% per level
      const multishotChance = newUpgrades.multishot * 0.15; // 15% chance per level

      return {
        skillPoints: state.skillPoints - 1,
        upgrades: newUpgrades,
        // Update derived stats
        damage: damageMultiplier,
        attackSpeed: cooldownReduction,
        orbSpeed: orbSpeedBonus,
        range: rangeMultiplier,
        multishot: multishotChance
      };
    });
  },

  incrementLevel: () => set(state => ({
    currentLevel: state.currentLevel + 1,
    wave: 0
  })),

  addProjectile: (projectile) => set(state => ({
    projectiles: [...state.projectiles, projectile]
  })),

  removeProjectile: (id) => set(state => ({
    projectiles: state.projectiles.filter(p => p.id !== id)
  })),

  updateProjectile: (id, updates) => set(state => ({
    projectiles: state.projectiles.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),

  addTowerState: (towerState) => set(state => ({
    towerStates: [...state.towerStates, towerState]
  })),

  removeTowerState: (id) => set(state => ({
    towerStates: state.towerStates.filter(t => t.id !== id)
  })),

  updateTowerState: (id, updates) => set(state => ({
    towerStates: state.towerStates.map(ts =>
      ts.id === id ? { ...ts, ...updates } : ts
    )
  })),

  setPlayerRef: (ref) => set(state => {
    // Only update if the ref has actually changed
    if (state.playerRef !== ref) {
      return { playerRef: ref };
    }
    return state;
  }),
}));