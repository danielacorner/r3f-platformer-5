import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { generatePath } from '../components/level/PathDecoration';

export type ElementType =
  | 'storm1' | 'storm2' | 'storm3' | 'storm4' | 'storm5'
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
    type: 'slow' | 'chain_lightning' | 'thunder_strike' | 'static_field' | 'overload' | 'poison' | 'splash' | 'armor_reduction' | 'chain_amplify' | 'aura_amplify' | 'purify' | 'burn' | 'meteor' | 'inferno' | 'phoenix' | 'apocalypse' | 'frozen_ground' | 'shatter' | 'blizzard' | 'absolute_zero' | 'spores' | 'thorns' | 'plague' | 'pandemic' | 'tsunami' | 'whirlpool' | 'flood' | 'maelstrom' | 'curse' | 'void' | 'nightmare' | 'oblivion' | 'fireball' | 'inferno_blast' | 'meteor_strike' | 'volcanic_burst' | 'armageddon';
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
    chain_count?: number;
    fork_chance?: number;
    splash_radius?: number;
    burn_duration?: number;
  };
  description?: string;
}

export const TOWER_STATS: Record<ElementType, TowerStats> = {
  // Storm Towers - Lightning Magic
  storm1: { damage: 30, range: 7, attackSpeed: 1.2, cost: 100, special: { type: 'chain_lightning', value: 0.8, chain_count: 2 }, color: '#fef9c3', emissive: '#facc15', description: "Chain Lightning - Damage chains to nearby enemies" },
  storm2: { damage: 50, range: 7.5, attackSpeed: 1.3, cost: 250, special: { type: 'thunder_strike', value: 1.2, fork_chance: 0.3 }, color: '#fef9c3', emissive: '#facc15', description: "Thunder Strike - Chance to fork to additional targets" },
  storm3: { damage: 75, range: 8, attackSpeed: 1.4, cost: 500, special: { type: 'static_field', value: 0.05, radius: 3 }, color: '#fef9c3', emissive: '#facc15', description: "Static Field - Damages enemies based on their max health" },
  storm4: { damage: 100, range: 8.5, attackSpeed: 1.5, cost: 1000, special: { type: 'overload', value: 1.5, explosion: 50 }, color: '#fef9c3', emissive: '#facc15', description: "Overload - Charged enemies explode on death" },
  storm5: { damage: 150, range: 9, attackSpeed: 1.6, cost: 2000, special: { type: 'storm_fury', value: 2.0, tick_damage: 30 }, color: '#fef9c3', emissive: '#facc15', description: "Storm Fury - Continuous lightning damage in area" },

  // Fire Towers - Destructive Force
  fire1: { damage: 40, range: 6, attackSpeed: 0.8, cost: 100, special: { type: 'fireball', value: 15, splash_radius: 1.5 }, color: '#fecaca', emissive: '#ef4444', description: "Fireball - Deals splash damage on impact" },
  fire2: { damage: 85, range: 6.5, attackSpeed: 0.9, cost: 250, special: { type: 'inferno_blast', value: 25, splash_radius: 2, burn_duration: 3 }, color: '#fecaca', emissive: '#ef4444', description: "Inferno Blast - Larger splash and burns enemies" },
  fire3: { damage: 150, range: 7, attackSpeed: 1.0, cost: 500, special: { type: 'meteor_strike', value: 40, splash_radius: 2.5, burn_duration: 4 }, color: '#fecaca', emissive: '#ef4444', description: "Meteor Strike - Massive impact with lasting flames" },
  fire4: { damage: 250, range: 7.5, attackSpeed: 1.1, cost: 1000, special: { type: 'volcanic_burst', value: 60, splash_radius: 3, burn_duration: 5 }, color: '#fecaca', emissive: '#ef4444', description: "Volcanic Burst - Erupts on impact, creating fire zones" },
  fire5: { damage: 400, range: 8, attackSpeed: 1.2, cost: 2000, special: { type: 'armageddon', value: 100, splash_radius: 4, burn_duration: 6 }, color: '#fecaca', emissive: '#ef4444', description: "Armageddon - Devastating explosions and infernos" },

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

export const isTowerOnPath = (position: number[] | { x: number; y: number; z: number },level:number) => {
  const pathData = generatePath(level);
  const towerRadius = 0.35; // Reduced from 0.5 to allow closer placement
  const pathMargin = 0.2; // Added margin to make path hitbox smaller than visual

  // Convert position to [x, y, z] format
  let x: number, y: number, z: number;
  if (Array.isArray(position)) {
    [x, y, z] = position;
  } else {
    x = position.x;
    y = position.y;
    z = position.z;
  }

  for (const segment of pathData.segments) {
    const [segX, , segZ] = segment.position;
    const [scaleX, , scaleZ] = segment.scale;
    const rotation = segment.rotation[1];

    // Transform tower position to segment's local space
    const dx = x - segX;
    const dz = z - segZ;
    const localX = dx * Math.cos(-rotation) - dz * Math.sin(-rotation);
    const localZ = dx * Math.sin(-rotation) + dz * Math.cos(-rotation);

    // Check if tower overlaps with segment bounds, using reduced path size
    const effectiveScaleX = scaleX - pathMargin;
    const effectiveScaleZ = scaleZ - pathMargin;
    
    if (Math.abs(localX) <= (effectiveScaleX / 2 + towerRadius) && 
        Math.abs(localZ) <= (effectiveScaleZ / 2 + towerRadius)) {
      return segment;
    }
  }
  return null;
};

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

export interface CreepState {
  position: [number, number, number];
  rotation?: [number, number, number];
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

interface PathSegment {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

export interface GameState {
  phase: 'prep' | 'combat' | 'victory';
  currentLevel: number;
  timer: number;
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
  playerRef: RapierRigidBody | null;
  orbSpeed: number;
  highlightedPathSegment: PathSegment | null;
  currentWave: number;
  totalWaves: number;
  showWaveIndicator: boolean;
  showTowerConfirmation: boolean;
  pendingTowerPosition: { x: number; y: number; z: number } | null;
  addPlacedTower: (
    position: number[] | { x: number; y: number; z: number },
    type: ElementType,
    level?: number
  ) => void;
  cameraZoom: number;
  cameraAngle: number;
  setSelectedObjectType: (type: PlaceableObjectType | null) => void;
  upgradeSkill: (skill: keyof GameState['upgrades']) => void;
  setWave: (wave: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  setTimer: (timer: number) => void;
  setCurrentLevel: (level: number) => void;
  setTowerStates: (towerStates: TowerState[]) => void;
  addTowerState: (towerState: TowerState) => void;
  removeTowerState: (id: string) => void;
  updateTowerState: (id: string, updates: Partial<TowerState>) => void;
  setPlayerRef: (ref: RapierRigidBody | null) => void;
  setHighlightedPathSegment: (segment: PathSegment | null) => void;
  pathPoints: Vector3[];
  setPathPoints: (points: Vector3[]) => void;
  addCreep: (creep: CreepState) => void;
  addExperience: (amount: number) => void;
  addMoney: (amount: number) => void;
  addScore: (amount: number) => void;
  removeCreep: (id: string) => void;
  updateCreep: (id: string, updates: Partial<CreepState>) => void;
  removePlacedTower: (id: number) => void;
  setPhase: (phase: GameState['phase']) => void;
  loseLife: () => void;
  incrementLevel: () => void;
  isWaveInProgress:  boolean;
  setIsWaveInProgress: (isWaveInProgress: boolean) => void;
  setWaveStartTime: (startTime: number) => void;
}

const initialState: GameState = {
  phase: 'prep',
  currentLevel: 1,
  timer: 0,
  isSpawning: false,
  levelComplete: false,
  placedTowers: [],
  selectedObjectType: null,
  selectedObjectLevel: null,
  money: process.env.NODE_ENV === 'development' ? 9999 : 200,
  score: 0,
  lives: 20,
  experience: process.env.NODE_ENV === 'development' ? 90 : 0,
  level: 1,
  skillPoints: process.env.NODE_ENV === 'development' ? 90 : 5,
  upgrades: {
    damage: 0,
    speed: 0,
    range: 0,
    multishot: 0,
  },
  wave: process.env.NODE_ENV === 'development' ? 0 : 0,
  creeps: [],
  projectiles: [],
  towerStates: [],
  playerRef: null,
  orbSpeed: 1,
  highlightedPathSegment: null,
  currentWave: process.env.NODE_ENV === 'development' ? 0 : 0,
  totalWaves: 4, // Set to 4 waves per level
  showWaveIndicator: false,
  showTowerConfirmation: false,
  pendingTowerPosition: null,
  cameraZoom: 1,
  cameraAngle: 0.5,
  pathPoints: [],
  setSelectedObjectType: () => {},
  upgradeSkill: () => {},
  setWave: () => {},
  setIsSpawning: () => {},
  setLevelComplete: () => {},
  setTimer: () => {},
  setCurrentLevel: () => {},
  setTowerStates: () => {},
  addTowerState: () => {},
  removeTowerState: () => {},
  updateTowerState: () => {},
  setPlayerRef: () => {},
  setHighlightedPathSegment: () => {},
  addCreep: () => {},
    addPlacedTower: () => {},
    setPathPoints: () => {},
    addExperience: () => {},
    addMoney: () => {},
    addScore: () => {},
    removeCreep: () => {},
    updateCreep: () => {},
    removePlacedTower: () => {},
    setPhase: () => {},
    loseLife: () => {},
    incrementLevel: () => {},
isWaveInProgress: false,
    setIsWaveInProgress: () => {},
    setWaveStartTime: () => {},

}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  setPathPoints: (points: Vector3[]) => set({ pathPoints: points }),

  setPhase: (phase: GameState['phase']) => {
    console.log(`Setting phase to: ${phase}`);
    set({ phase });
  },

  setCurrentLevel: (level: GameState['currentLevel']) => {
    console.log(`Setting level to: ${level}`);
    set({ currentLevel: level });
  },

  setTimer: (timer) => set({ timer }),


  setIsSpawning: (isSpawning) => {
    console.log(`Setting isSpawning to: ${isSpawning}`);
    set({ isSpawning });
  },

  setLevelComplete: (complete) => set({ levelComplete: complete }),

  setWave: (wave) => {
    console.log(`Setting wave to: ${wave}`);
    set({ wave });
  },

  addPlacedTower: (position, type, level = 1) => {
    const state = get();
    const cost = TOWER_STATS[type]?.cost ?? 0;
    
    // Convert position to array format if it's a Vector3
    const positionArray = position instanceof Vector3 
      ? position.toArray()
      : Array.isArray(position) 
        ? position 
        : [position.x, position.y, position.z];

    if (state.money >= cost) {
      set(state => ({
        placedTowers: [...state.placedTowers, {
          id: Date.now(),
          position: new Vector3(...positionArray),
          type,
          level,
          kills: 0
        }],
        money: state.money - cost
      }));
    }
  },

  removePlacedTower: (id: number) => set(state => ({
    placedTowers: state.placedTowers.filter(tower => tower.id !== id)
  })),

  upgradeTower: (id: number) => {
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

  setSelectedObjectType: (type: ElementType | null | undefined, level = null as number|null) => set({ selectedObjectType: type, selectedObjectLevel: level }),

  addMoney: (amount: number) => set(state => ({ money: state.money + amount })),

  spendMoney: (amount: number) => set(state => ({ money: state.money - amount })),

  addScore: (amount: number) => set(state => ({ score: state.score + amount })),

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
    }));
  },

  removeCreep: (id: string) => {
    console.log(`Removing creep: ${id}`);
    set(state => {
      const remainingCreeps = state.creeps.filter(c => c.id !== id);

      
      return {
        creeps: remainingCreeps,
      };
    });
  },

  updateCreep: (id: string, updates: Partial<CreepState>) => {
    set(state => ({
      creeps: state.creeps.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  },

  damageCreep: (id: string, damage: number) => {
    const state = get();
    const creep = state.creeps.find(c => c.id === id);
    if (!creep) return;

    const newHealth = creep.health - damage;
    console.log(`Creep ${id} damaged. Health: ${creep.health} -> ${newHealth}`);
    
    if (newHealth <= 0) {
      console.log(`Creep ${id} died. `);
      set(state => {
        // Add experience, money, and score
        const newExperience = state.experience + (10 + creep.waveId * 2);
        const newMoney = state.money + creep.value;
        const newScore = state.score + creep.value;
        
        // Remove creep and update counts
        const remainingCreeps = state.creeps.filter(c => c.id !== id);

        
        return {
          experience: newExperience,
          money: newMoney,
          score: newScore,
          creeps: remainingCreeps,
        };
      });
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

  upgradeSkill: (skill: keyof GameState['upgrades']) => {
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

  incrementLevel: () => {
    const state = get();
    const nextLevel = state.currentLevel + 1;
    console.log(`Incrementing to level ${nextLevel}`);
    
    // Reset wave counter and update level
    set({
      currentLevel: nextLevel,
      wave: 0,
      currentWave: 0,
      totalWaves: 4, // Ensure it stays at 4 waves per level
      isSpawning: false,
      levelComplete: false,
      phase: 'prep'
    });
  },

  addProjectile: (projectile: Projectile) => set(state => ({
    projectiles: [...state.projectiles, projectile]
  })),

  removeProjectile: (id: number) => set(state => ({
    projectiles: state.projectiles.filter(p => p.id !== id)
  })),

  updateProjectile: (id: number, updates: Partial<Projectile>) => set(state => ({
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

  setHighlightedPathSegment: (segment) => {
    set({ highlightedPathSegment: segment });
  },

  startWave: () => {
    const state = get();
    state.setPhase("combat");
    state.setIsSpawning(true);

    // Configure wave properties based on level
    let creepCount, creepSpeed, creepHealth, creepReward;
    const creepTypes = ["normal", "spider", "wither", "enderman", "drowned", "creeper"];
    
    switch (state.currentLevel) {
      // ! ? magic orb attack seems to stop working after 9+ creeps spawned
      case 1:
        creepCount = 6;
        creepSpeed = 2;
        creepHealth = 100;
        creepReward = 10;
        break;
      case 2:
        creepCount = 25;
        creepSpeed = 1.2;
        creepHealth = 120;
        creepReward = 12;
        break;
      case 3:
        creepCount = 15;
        creepSpeed = 3;
        creepHealth = 150;
        creepReward = 15;
        break;
      case 4:
        creepCount = 20;
        creepSpeed = 4;
        creepHealth = 200;
        creepReward = 20;
        break;
      default:
        creepCount = 10;
        creepSpeed = 2;
        creepHealth = 100;
        creepReward = 10;
    }

    // Spawn creeps with a delay
    let spawned = 0;
    const spawnInterval = setInterval(() => {
      if (spawned >= creepCount) {
        clearInterval(spawnInterval);
        state.setIsSpawning(false);
        return;
      }

      // Select a random creep type based on level
      let creepType;
      if (state.currentLevel === 4) {
        // Boss level: more special creeps
        creepType = creepTypes[Math.floor(Math.random() * creepTypes.length)];
      } else if (state.currentLevel === 3) {
        // Level 3: mix of normal and special creeps
        creepType = Math.random() < 0.7 ? "normal" : creepTypes[Math.floor(Math.random() * creepTypes.length)];
      } else if (state.currentLevel === 2) {
        // Level 2: mostly normal creeps with some spiders
        creepType = Math.random() < 0.8 ? "normal" : "spider";
      } else {
        // Level 1: only normal creeps
        creepType = "normal";
      }

      // Adjust health and speed based on creep type
      const typeSpeedMultiplier = creepSpeeds[creepType as keyof typeof creepSpeeds] || 1;
      const adjustedSpeed = creepSpeed * typeSpeedMultiplier;

      // Boss types get more health
      const healthMultiplier = creepType === "wither" ? 2.5 : 
                             creepType === "enderman" ? 1.8 : 
                             creepType === "spider" ? 1.3 : 1;

      state.addCreep({
        id: `creep-${Date.now()}-${Math.random()}`,
        position: [...state.pathPoints[0]] as [number, number, number],
        type: creepType,
        health: creepHealth * healthMultiplier,
        maxHealth: creepHealth * healthMultiplier,
        speed: adjustedSpeed,
        size: 1,
        value: creepReward,
        waveId: state.wave,
        effects: {},
      });

      spawned++;
    }, 500); // Spawn a creep every 500ms
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

const creepSpeeds = {
  normal: 1,
  spider: 1.2,
  wither: 0.8,
  enderman: 1.1,
  drowned: 1.3,
  creeper: 1.4
};
