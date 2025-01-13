import React, { useRef, useState } from 'react';
import { JoystickContainer, JoystickButton, DirectionalArrow } from './Joystick.styles';
import { useGameStore } from '../../../store/gameStore';

export const Joystick: React.FC = () => {
  const { setJoystickMovement } = useGameStore();
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;

    const container = joystickRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = { x: clientX - centerX, y: clientY - centerY };
  };

  const handleJoystickMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    const container = joystickRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const radius = rect.width / 2;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > radius - 30) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = (radius - 30) * Math.cos(angle);
      deltaY = (radius - 30) * Math.sin(angle);
    }

    const normalizedX = deltaX / (radius - 30);
    const normalizedY = deltaY / (radius - 30);

    setJoystickPosition({ x: deltaX, y: deltaY });
    setJoystickMovement({ x: normalizedX, y: normalizedY });
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    setJoystickPosition({ x: 0, y: 0 });
    setJoystickMovement({ x: 0, y: 0 });
  };

  React.useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      handleJoystickMove(e);
    };

    const handleEnd = () => {
      handleJoystickEnd();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, []);

  return (
    <JoystickContainer
      ref={joystickRef}
      onMouseDown={handleJoystickStart}
      onTouchStart={handleJoystickStart}
      onContextMenu={(e) => e.preventDefault()}
      className="joystick-area"
    >
      <DirectionalArrow direction="up" />
      <DirectionalArrow direction="right" />
      <DirectionalArrow direction="down" />
      <DirectionalArrow direction="left" />
      <JoystickButton
        style={{
          transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
        }}
      />
    </JoystickContainer>
  );
};
