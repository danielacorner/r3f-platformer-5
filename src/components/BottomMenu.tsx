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
  DirectionalArrow
} from './BottomMenu.styles';
import { SkillsMenu } from './skills/SkillsMenu/SkillsMenu';

export function BottomMenu() {
  const {
    equippedSkills,
    selectedSkillSlot,
    setSelectedSkillSlot,
    toggleSkill,
    skillLevels,
    playerRef,
    money,
    experience,
    level,
    equipSkill,
    baseSkillSlots,
    additionalSkillSlots,
    setJoystickMovement,
  } = useGameStore();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: string]: number }>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
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
    const level = skillLevels[skill.name] || 0;
    if (level === 0) return;

    if (skill.toggleable) {
      toggleSkill(skill.name);
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

  const handleSkillClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const skill = equippedSkills[index];
    if (!skill) return;

    if (skill.toggleable) {
      toggleSkill(skill.name);
    } else {
      handleCastSkill(skill);
    }
  };

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
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

    setJoystickPosition({ x: deltaX, y: deltaY });
    setJoystickMovement({ x: normalizedX, y: normalizedY });
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    setJoystickPosition({ x: 0, y: 0 });
    setJoystickMovement({ x: 0, y: 0 });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleJoystickMove);
    window.addEventListener('mouseup', handleJoystickEnd);
    window.addEventListener('touchmove', handleJoystickMove);
    window.addEventListener('touchend', handleJoystickEnd);

    return () => {
      window.removeEventListener('mousemove', handleJoystickMove);
      window.removeEventListener('mouseup', handleJoystickEnd);
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
    };
  }, []);

  return (
    <BottomMenuContainer>
      <JoystickContainer
        ref={joystickRef}
        onMouseDown={handleJoystickStart}
        onTouchStart={handleJoystickStart}
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
        {equippedSkills.map((skill, index) => {
          if (!skill) return null;

          return index === 0 ? (
            <PrimarySkillButton
              key={index}
              color={skill.color}
              onClick={(e) => handleSkillClick(e, index)}
            >
              <div className="skill-icon">
                <skill.icon size="100%" />
              </div>
            </PrimarySkillButton>
          ) : (
            <SkillSlot
              key={index}
              color={skill.color}
              isActive={skill.toggleable && skill.isActive}
              onClick={(e) => handleSkillClick(e, index)}
            >
              <div className="skill-icon">
                <skill.icon size="100%" />
              </div>
              {skillCooldowns[skill.name] > 0 && (
                <div className="cooldown">{skillCooldowns[skill.name].toFixed(1)}s</div>
              )}
            </SkillSlot>
          );
        })}
      </SkillsContainer>

      <SkillsMenu isOpen={isSkillsMenuOpen} onClose={() => setIsSkillsMenuOpen(false)} />
    </BottomMenuContainer>
  );
}
