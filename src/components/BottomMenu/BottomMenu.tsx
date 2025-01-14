import { useState, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import {
  BottomMenuContainer,
  JoystickContainer,
  DirectionalArrow,
} from "./BottomMenu.styles";
import { SkillsContainer } from "../skills/SkillsContainer";
import { Portal } from "@mui/material";

export function BottomMenu() {
  const { setJoystickMovement } = useGameStore();
  const [joystickPosition, setJoystickPositionState] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    const position = getEventPosition(e);
    if (!position) return;
    lastPositionRef.current = position;
  };

  const handleJoystickMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !joystickRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const position = getEventPosition(e as any);
    if (!position) return;

    const deltaX = position.x - lastPositionRef.current.x;
    const deltaY = position.y - lastPositionRef.current.y;
    lastPositionRef.current = position;

    setJoystickPositionState((prev) => {
      const newX = Math.max(-50, Math.min(50, prev.x + deltaX));
      const newY = Math.max(-50, Math.min(50, prev.y + deltaY));
      setJoystickMovement({ x: newX / 50, y: -newY / 50 });
      return { x: newX, y: newY };
    });
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    setJoystickPositionState({ x: 0, y: 0 });
    setJoystickMovement({ x: 0, y: 0 });
  };

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!joystickRef.current) return null;
    const rect = joystickRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  };

  return (
    <Portal>
      <BottomMenuContainer>
        <JoystickContainer
          ref={joystickRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          onMouseMove={handleJoystickMove as any}
          onTouchMove={handleJoystickMove as any}
          onMouseUp={handleJoystickEnd}
          onTouchEnd={handleJoystickEnd}
          onMouseLeave={handleJoystickEnd}
        >
          <DirectionalArrow direction="up" />
          <DirectionalArrow direction="right" />
          <DirectionalArrow direction="down" />
          <DirectionalArrow direction="left" />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
            }}
          />
        </JoystickContainer>
        <SkillsContainer />
      </BottomMenuContainer>
    </Portal>
  );
}
