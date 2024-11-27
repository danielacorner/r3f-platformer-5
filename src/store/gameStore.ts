import { create } from 'zustand';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

interface PlacedBox {
  id: number;
  position: Vector3;
  type: 'block' | 'tower' | 'cannon';
}

interface GameState {
  currentLevel: number;
  phase: 'prep' | 'combat';
  timer: number;
  enemiesAlive: number;
  isSpawning: boolean;
  levelComplete: boolean;
  placedBoxes: PlacedBox[];
  selectedObjectType: 'block' | 'tower' | 'cannon';
  playerRef: React.MutableRefObject<RapierRigidBody | null>;
  setCurrentLevel: (level: number) => void;
  setPhase: (phase: 'prep' | 'combat') => void;
  setTimer: (timer: number) => void;
  setEnemiesAlive: (count: number) => void;
  setIsSpawning: (isSpawning: boolean) => void;
  setLevelComplete: (complete: boolean) => void;
  addPlacedBox: (position: Vector3, type: 'block' | 'tower' | 'cannon') => void;
  removePlacedBox: (id: number) => void;
  setSelectedObjectType: (type: 'block' | 'tower' | 'cannon') => void;
  setPlayerRef: (ref: React.MutableRefObject<RapierRigidBody | null>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentLevel: 1,
  phase: 'prep',
  timer: 4,
  enemiesAlive: 0,
  isSpawning: false,
  levelComplete: false,
  placedBoxes: [],
  selectedObjectType: 'block',
  playerRef: { current: null },
  setPlayerRef: (ref) => set({ playerRef: ref }),
  setCurrentLevel: (level) => set({ 
    currentLevel: level,
    timer: 4,
    enemiesAlive: 0,
    isSpawning: false,
    levelComplete: false,
    phase: 'prep',
    placedBoxes: []
  }),
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
  addPlacedBox: (position, type) => set((state) => {
    if (state.placedBoxes.length >= 20) return state;
    return {
      placedBoxes: [...state.placedBoxes, {
        id: state.placedBoxes.length,
        position: position.clone(),
        type
      }]
    };
  }),
  removePlacedBox: (id) => set((state) => ({
    placedBoxes: state.placedBoxes.filter((box) => box.id !== id)
  })),
  setSelectedObjectType: (type) => set({ selectedObjectType: type }),
}));