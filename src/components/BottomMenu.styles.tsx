import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
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
`;

export const PlayerInfo = styled('div', {
  label: 'PlayerInfo'
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const PlayerIcon = styled('div', {
  label: 'PlayerIcon'
})`
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #f0f9ff;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1001;

  svg {
    width: 100%;
    height: 100%;
    transform: scale(1.2);
  }

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
  }

  &:hover::after {
    opacity: 1;
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
`;

export const SkillSlots = styled('div', {
  label: 'SkillSlots'
})`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

`;

export const SkillSlot = styled('div', {
  label: 'SkillSlot'
}) <{ isSelected: boolean; isHighlightEmpty: boolean; isOnCooldown: boolean; borderColor: string }>`
  width: 3rem;
  height: 3rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid ${props => props.isSelected ? props.borderColor : '#666'};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.isSelected ? `0 0 10px ${props.borderColor}` : 'none'};

  ${props => props.isHighlightEmpty && `
    border-color: #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
  `}

  ${props => props.isOnCooldown && `
    filter: grayscale(0.7);
    cursor: not-allowed;
  `}

  &:hover {
    border-color: ${props => props.borderColor};
    transform: scale(1.05);
  }
  @media screen and (min-width: 640px)  {
  width: 6rem;
  height: 6rem;
}
`;

export const SkillIcon = styled('img', {
  label: 'SkillIcon'
})`
  width: 80%;
  height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
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

  ${SkillSlot}:hover & {
    opacity: 1;
  }

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

// Media queries
export const mediaQueries = {
  mobile: '@media screen and (max-width: 640px)',
};
