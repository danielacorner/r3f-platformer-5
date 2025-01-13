import { useState, useEffect, useRef } from 'react';
import { useGameStore } from "../store/gameStore";
import { GiMissileSwarm } from 'react-icons/gi';
import { ActiveSkill, activeSkills } from "./skills/skills";
import { castSkill } from './skills/SkillEffects/castSkill';
import { Vector3 } from "three";
import {
  BottomMenuContainer,
  SkillsContainer,
  SkillSlot,
  JoystickContainer,
  PrimarySkillButton,
  JoystickButton,
  DirectionalArrow,
  PrimarySkillContainer,
  SecondarySkillsContainer
} from './BottomMenu.styles';
import { SkillsMenu } from './skills/SkillsMenu/SkillsMenu';

export function BottomMenu() {
  const {
    equippedSkills,
    primarySkill,
    handleSkillClick,
    handlePrimarySkillClick,
    joystickMovement,
    setJoystickMovement,
    maxSkillSlots,
    playerRef,
    money,
    experience,
    level,
    equipSkill,
    baseSkillSlots,
    additionalSkillSlots,
    setJoystickPosition,
  } = useGameStore();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: string]: number }>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joystickPosition, setJoystickPositionState] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Set Magic Missile as default skill in slot 1
  useEffect(() => {
    if (equippedSkills.length === 0 || !equippedSkills[0]) {
      const magicMissile = activeSkills.find(skill => skill.name === 'Magic Missiles');
      if (magicMissile) {
        equipSkill(magicMissile, 0);
      }
    }
  }, []);

  // Handle cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns(prev => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach(key => {
          if (newCooldowns[key] > 0) {
            newCooldowns[key] = Math.max(0, newCooldowns[key] - 0.1);
          }
        });
        return newCooldowns;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCastSkill = (skill: ActiveSkill) => {
    const level = 1; // skillLevels[skill.name] || 0;
    if (level === 0) return;

    if (skill.toggleable) {
      // toggleSkill(skill.name);
      return;
    }

    const cooldown = skillCooldowns[skill.name] || 0;
    if (cooldown > 0) return;

    if (!playerRef) return;
    const playerPosition = playerRef.translation();
    if (!playerPosition) return;

    const position = new Vector3(playerPosition.x, 1, playerPosition.z);
    let direction: Vector3;

    if (window.gameState?.mousePosition) {
      const mousePos = new Vector3(
        window.gameState.mousePosition.x,
        0,
        window.gameState.mousePosition.z
      );
      direction = mousePos.clone().sub(position).normalize();
    } else {
      direction = new Vector3(0, 0, 1);
    }

    castSkill(skill, position, direction, level);

    setSkillCooldowns(prev => ({
      ...prev,
      [skill.name]: skill.cooldown
    }));
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      handleJoystickMove(e);
    };

    const handleEnd = () => {
      handleJoystickEnd();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, []);

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;

    const container = joystickRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = { x: clientX - centerX, y: clientY - centerY };
  };

  const handleJoystickMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    const container = joystickRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const radius = rect.width / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    // Limit the joystick movement to the container radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > radius - 30) { // 30px offset for the joystick button size
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = (radius - 30) * Math.cos(angle);
      deltaY = (radius - 30) * Math.sin(angle);
    }

    // Normalize the movement values to -1 to 1 range
    const normalizedX = deltaX / (radius - 30);
    const normalizedY = deltaY / (radius - 30);

    setJoystickPositionState({ x: deltaX, y: deltaY });
    setJoystickMovement({ x: normalizedX, y: normalizedY });
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    setJoystickPositionState({ x: 0, y: 0 });
    setJoystickMovement({ x: 0, y: 0 });
  };

  return (
    <BottomMenuContainer>
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
            transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`
          }}
        />
      </JoystickContainer>

      <SkillsContainer>
        <PrimarySkillContainer>
          <PrimarySkillButton
            color={primarySkill?.color}
            empty={!primarySkill}
            onClick={(e) => {
              e.stopPropagation();
              if (primarySkill) handlePrimarySkillClick();
            }}
          >
            {primarySkill?.icon}
          </PrimarySkillButton>

          <SecondarySkillsContainer>
            {Array.from({ length: maxSkillSlots }).map((_, index) => {
              const skill = equippedSkills[index + 1];
              return (
                <SkillSlot
                  key={index}
                  color={skill?.color}
                  isActive={skill?.isActive}
                  index={index}
                  total={maxSkillSlots}
                  empty={!skill}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (skill) handleSkillClick(skill);
                  }}
                >
                  {skill?.icon}
                  {skill?.cooldown > 0 && (
                    <div className="cooldown">{skill.cooldown.toFixed(1)}s</div>
                  )}
                </SkillSlot>
              );
            })}
          </SecondarySkillsContainer>
        </PrimarySkillContainer>
      </SkillsContainer>
    </BottomMenuContainer>
  );
}
