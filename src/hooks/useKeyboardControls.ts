import { useState, useEffect, useCallback } from 'react';

export function useKeyboardControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  const handleKeyChange = useCallback((event: KeyboardEvent, pressed: boolean) => {
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
  }, []);

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

  return keys;
}