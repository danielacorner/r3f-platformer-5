import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

interface PlacedBox {
  position: Vector3;
  id: string;
}

interface GameState {
  currentLevel: number;
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  phase: 'prep' | 'combat';
  placedBoxes: PlacedBox[];
  playerRef: React.MutableRefObject<RapierRigidBody | null>;
  setCurrentLevel: (level: number) => void;
  setTimer: (time: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (spawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  setPhase: (phase: 'prep' | 'combat') => void;
  addBox: (position: Vector3) => void;
  removeBox: (id: string) => void;
  clearBoxes: () => void;
  setPlayerRef: (ref: React.MutableRefObject<RapierRigidBody | null>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentLevel: 1,
  timer: 4,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  phase: 'prep',
  placedBoxes: [],
  playerRef: { current: null },
  setCurrentLevel: (level) => set({ 
    currentLevel: level,
    timer: 4,
    enemiesAlive: 0,
    isSpawning: false,
    levelComplete: false,
    phase: 'prep',
    placedBoxes: []
  }),
  setTimer: (time) => {
    set({ timer: time });
    if (time <= 0) {
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
  setIsSpawning: (spawning) => {
    console.log('Setting isSpawning:', spawning);
    set({ isSpawning: spawning });
  },
  setLevelComplete: (complete) => set({ levelComplete: complete }),
  setPhase: (phase) => {
    console.log('Setting phase:', phase);
    set((state) => {
      if (phase === 'combat') {
        return { 
          phase,
          isSpawning: true,
          timer: state.timer,
          levelComplete: false
        };
      }
      return { 
        phase,
        isSpawning: false,
        timer: 4,
        enemiesAlive: 0,
        levelComplete: false
      };
    });
  },
  addBox: (position) => set((state) => {
    if (state.placedBoxes.length >= 20) return state;
    return {
      placedBoxes: [...state.placedBoxes, {
        position: position.clone(),
        id: Math.random().toString(36).substr(2, 9)
      }]
    };
  }),
  removeBox: (id) => set((state) => ({
    placedBoxes: state.placedBoxes.filter(box => box.id !== id)
  })),
  clearBoxes: () => set({ placedBoxes: [] }),
  setPlayerRef: (ref) => set({ playerRef: ref })
}));