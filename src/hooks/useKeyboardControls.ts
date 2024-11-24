import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function useKeyboardControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  const phase = useGameStore(state => state.phase);

  const handleKeyChange = useCallback((event: KeyboardEvent, pressed: boolean) => {
    if (phase === 'prep') return;  // Only allow movement during combat phase
    
    const { key } = event;
    const keyMap: { [key: string]: keyof typeof keys } = {
      'w': 'forward',
      'W': 'forward',
      'ArrowUp': 'forward',
      's': 'backward',
      'S': 'backward',
      'ArrowDown': 'backward',
      'a': 'left',
      'A': 'left',
      'ArrowLeft': 'left',
      'd': 'right',
      'D': 'right',
      'ArrowRight': 'right',
      ' ': 'jump',
    };

    const mappedKey = keyMap[key];
    if (mappedKey) {
      event.preventDefault();
      setKeys(prev => ({
        ...prev,
        [mappedKey]: pressed,
      }));
    }
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => handleKeyChange(event, true);
    const handleKeyUp = (event: KeyboardEvent) => handleKeyChange(event, false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyChange]);

  // Reset all keys when phase changes to prep
  useEffect(() => {
    if (phase === 'prep') {
      setKeys({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
      });
    }
  }, [phase]);

  return keys;
}