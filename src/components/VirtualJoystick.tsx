import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Position {
  x: number;
  y: number;
}

export function VirtualJoystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [joystickPos, setJoystickPos] = useState<Position>({ x: 0, y: 0 });
  const { setJoystickInput } = useGameStore();
  const maxDistance = 50;

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Initialize joystick at center
    setJoystickPos({ x: 0, y: 0 });
    handleMove(clientX, clientY, centerX, centerY);
  };

  const handleMove = (clientX: number, clientY: number, baseCenterX?: number, baseCenterY?: number) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = baseCenterX ?? (rect.left + rect.width / 2);
    const centerY = baseCenterY ?? (rect.top + rect.height / 2);

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const x = Math.cos(angle) * maxDistance;
      const y = Math.sin(angle) * maxDistance;
      setJoystickPos({ x, y });
    } else {
      setJoystickPos({ x: deltaX, y: deltaY });
    }

    // Convert to normalized -1 to 1 range
    const normalizedX = Math.min(Math.max(deltaX / maxDistance, -1), 1);
    const normalizedY = Math.min(Math.max(deltaY / maxDistance, -1), 1);
    setJoystickInput({ x: normalizedX, z: normalizedY });
  };

  const handleEnd = () => {
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });
    setJoystickInput({ x: 0, z: 0 });
  };

  useEffect(() => {
    const touchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const touchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const mouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const mouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', touchStart);
      container.addEventListener('mousedown', mouseDown);
      window.addEventListener('touchmove', touchMove);
      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mouseup', handleEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', touchStart);
        container.removeEventListener('mousedown', mouseDown);
        window.removeEventListener('touchmove', touchMove);
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('mouseup', handleEnd);
      }
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-8 right-8 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm touch-none"
    >
      <div 
        className={`absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full bg-white/20 backdrop-blur-md transition-transform ${
          isDragging ? 'scale-90' : 'scale-100'
        }`}
        style={{
          transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
        }}
      />
    </div>
  );
}