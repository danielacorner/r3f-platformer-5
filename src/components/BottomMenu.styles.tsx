import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const spinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const orbitAnimation = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
    opacity: 0.8;
  }
  25% {
    transform: rotate(90deg) scale(1.1);
    opacity: 0.9;
  }
  50% {
    transform: rotate(180deg) scale(1);
    opacity: 1;
  }
  75% {
    transform: rotate(270deg) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: rotate(360deg) scale(1);
    opacity: 0.8;
  }
`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 10px ${props => props.color}, 0 0 20px ${props => props.color}40;
    border-color: ${props => props.color}cc;
  }
  50% {
    box-shadow: 0 0 15px ${props => props.color}, 0 0 30px ${props => props.color}60;
    border-color: ${props => props.color};
  }
  100% {
    box-shadow: 0 0 10px ${props => props.color}, 0 0 20px ${props => props.color}40;
    border-color: ${props => props.color}cc;
  }
`;

const activeIconAnimation = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(1.2) drop-shadow(0 0 5px currentColor);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.4) drop-shadow(0 0 8px currentColor);
  }
  100% {
    transform: scale(1);
    filter: brightness(1.2) drop-shadow(0 0 5px currentColor);
  }
`;

// Media queries
export const mediaQueries = {
  tablet: '@media screen and (min-width: 640px)',
  desktop: '@media screen and (min-width: 1024px)',
};

export const SkillSlot = styled('div', {
  label: 'SkillSlot'
}) <{ isSelected: boolean; isHighlightEmpty: boolean; isOnCooldown: boolean; borderColor: string; color?: string; isActive?: boolean }>`
  position: relative;
  width: 3rem;
  height: 3rem;
  border: 2px solid ${props => props.color || props.borderColor || '#60a5fa'};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isActive ? `${props.color}33` : props.isSelected ? `rgba(0, 0, 0, 0.6)` : 'rgba(0, 0, 0, 0.5)'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isActive ? `0 0 10px ${props.color}` : props.isSelected ? `0 0 10px ${props.borderColor}` : 'none'};

  ${props => props.isActive && css`
    animation: ${pulseAnimation} 2s ease-in-out infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      border: 2px solid ${props.color}40;
      border-radius: 0.7rem;
      animation: ${orbitAnimation} 3s linear infinite;
      pointer-events: none;
    }

    &::after {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px solid ${props.color}80;
      border-radius: 0.6rem;
      animation: ${orbitAnimation} 3s linear infinite reverse;
      pointer-events: none;
    }

    .skill-icon {
      animation: ${activeIconAnimation} 2s ease-in-out infinite;
      transform-origin: center;
    }
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.isActive 
      ? `0 0 15px ${props.color}` 
      : `0 0 5px ${props.color || props.borderColor || '#60a5fa'}`};
  }

  &:active {
    transform: translateY(0);
  }

  .skill-icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: ${props => props.isActive ? props.color : props.isSelected ? props.borderColor : '#fff'};
    filter: ${props => props.isActive ? 'brightness(1.2)' : 'none'};
    transition: transform 0.2s ease;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  ${props => props.isHighlightEmpty && `
    border-color: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
  `}

  ${props => props.isOnCooldown && `
    filter: grayscale(0.7);
    cursor: not-allowed;
  `}

  &.hover {
    border-color: ${props => props.borderColor};
    transform: scale(1.05);
  }

  &.hover .unequip-button {
    opacity: 1;
  }

  ${mediaQueries.tablet} {
    width: 4.5rem;
    height: 4.5rem;
    border-radius: 0.75rem;
    border-width: 3px;
  }

  ${mediaQueries.desktop} {
    width: 6rem;
    height: 6rem;
    border-radius: 1rem;
    border-width: 4px;
  }
`;

export const UnequipButton = styled('button', {
  label: 'UnequipButton'
})`
  position: absolute;
  top: -0.5rem;
  left: -0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: #ef4444;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;

  &.hover {
    background: #ef4444;
    color: white;
  }

  ${mediaQueries.tablet} {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.9rem;
    top: -0.7rem;
    left: -0.7rem;
  }

  ${mediaQueries.desktop} {
    width: 2rem;
    height: 2rem;
    font-size: 1.1rem;
    top: -0.8rem;
    left: -0.8rem;
  }
`;

export const SkillHotkey = styled('div', {
  label: 'SkillHotkey'
})`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  font-size: 0.7rem;
  pointer-events: none;
  z-index: 1;

  ${mediaQueries.tablet} {
    top: -0.7rem;
    right: -0.7rem;
    font-size: 0.9rem;
    padding: 0.2rem 0.4rem;
  }

  ${mediaQueries.desktop} {
    top: -0.8rem;
    right: -0.8rem;
    font-size: 1.1rem;
    padding: 0.3rem 0.5rem;
  }
`;

export const BottomMenuContainer = styled('div', {
  shouldComponentUpdate: false,
  label: 'BottomMenu'
})`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.95);
  pointer-events: auto;
  user-select: none;
  backdrop-filter: blur(8px);

  ${mediaQueries.tablet} {
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.98);
  }

  ${mediaQueries.desktop} {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }
`;

export const StatusSection = styled('div', {
  label: 'StatusSection'
})`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  height: 1.75rem;
  padding: 0 0.5rem;
  background: linear-gradient(to bottom, #1e293b, #1e2837);
  border: 1px solid #3b5998;
  border-radius: 4px;
  box-shadow:
    inset 0 0 10px rgba(0, 0, 0, 0.3),
    0 0 10px rgba(73, 156, 255, 0.2);

  ${mediaQueries.tablet} {
    height: 2.5rem;
    padding: 0 1rem;
    border-radius: 8px;
  }

  ${mediaQueries.desktop} {
    height: 3rem;
    padding: 0 1.5rem;
    border-radius: 12px;
  }
`;

export const PlayerInfo = styled('div', {
  label: 'PlayerInfo'
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const PlayerIcon = styled('button', {
  label: 'PlayerIcon'
})`
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #60a5fa;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1001;

  &:hover {
    border-color: #60a5fa;
    transform: scale(1.05);
  }

  &::after {
    content: "Click for Skills";
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;

    ${mediaQueries.tablet} {
      font-size: 0.8rem;
      padding: 0.3rem 0.7rem;
    }

    ${mediaQueries.desktop} {
      font-size: 0.9rem;
      padding: 0.4rem 0.8rem;
    }
  }

  &:hover::after {
    opacity: 1;
  }

  ${mediaQueries.tablet} {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    border-width: 3px;
  }

  ${mediaQueries.desktop} {
    width: 4.5rem;
    height: 4.5rem;
    border-radius: 1rem;
    border-width: 4px;
  }

  svg {
    width: 100%;
    height: 100%;
    transform: scale(1.2);
  }
`;

export const SkillPointsBadge = styled('div', {
  label: 'SkillPointsBadge'
})`
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  background: #fbbf24;
  color: black;
  border: 2px solid #000;
  border-radius: 1rem;
  min-width: 1.2rem;
  height: 1.2rem;
  font-size: 0.7rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.2rem;
`;

export const LevelInfo = styled('div', {
  label: 'LevelInfo'
})`
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const LevelNumber = styled('div', {
  label: 'LevelNumber'
})`
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  position: relative;
  padding-bottom: 4px;

  ${mediaQueries.tablet} {
    font-size: 1.5rem;
    padding-bottom: 6px;
  }

  ${mediaQueries.desktop} {
    font-size: 1.8rem;
    padding-bottom: 8px;
  }
`;

export const XPProgressBar = styled('div', {
  label: 'XPProgressBar'
})`
  position: absolute;
  bottom: 0;
  left: 0;
  width: calc(100vw - 12rem);
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
`;

export const XPProgressFill = styled('div', {
  label: 'XPProgressFill'
}) <{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  width: ${props => props.progress}%;
`;

export const XPText = styled('div', {
  label: 'XPText'
})`
  font-size: 0.8rem;
  color: #94a3b8;

  ${mediaQueries.tablet} {
    font-size: 1rem;
  }

  ${mediaQueries.desktop} {
    font-size: 1.2rem;
  }
`;

export const Resources = styled('div', {
  label: 'Resources'
})`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  padding-right: 1rem;
`;

export const Money = styled('div', {
  label: 'Money'
})`
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #fbbf24;
  border-radius: 1rem;
  padding: 0.3rem 0.8rem;
  color: #fbbf24;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.1rem;

  ${mediaQueries.tablet} {
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
  }

  ${mediaQueries.desktop} {
    font-size: 1.5rem;
    padding: 0.5rem 1.2rem;
    border-radius: 1.5rem;
  }
`;

export const SkillSlots = styled('div', {
  label: 'SkillSlots'
})`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  ${mediaQueries.tablet} {
    gap: 1rem;
    padding: 1rem;
    justify-content: center;
  }

  ${mediaQueries.desktop} {
    gap: 1.5rem;
    padding: 1.5rem;
  }
`;
