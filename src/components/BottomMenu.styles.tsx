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
  50% {
    transform: rotate(180deg) scale(1.1);
    opacity: 1;
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

export const BottomMenuContainer = styled.div`
  position: fixed;
  bottom: -8px;
  right: -40px;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px 40px;
  pointer-events: none;
  height: 240px;
  z-index: 1000;
`;

export const JoystickContainer = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(20, 20, 30, 0.4);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
  }

  @media (max-width: 480px) {
    width: 140px;
    height: 140px;
  }
`;

export const JoystickButton = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
  transition: transform 0.1s ease;

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

export const SkillsContainer = styled.div`
  position: relative;
  width: 240px;
  height: 240px;
  margin-right: 20px;
  pointer-events: auto;

  @media (max-width: 768px) {
    width: 200px;
    height: 200px;
    margin-right: 15px;
  }

  @media (max-width: 480px) {
    width: 180px;
    height: 180px;
    margin-right: 10px;
  }

  @media (max-width: 320px) {
    width: 160px;
    height: 160px;
    margin-right: 8px;
  }
`;

export const PrimarySkillContainer = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 120px;
  height: 120px;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }

  @media (max-width: 480px) {
    width: 90px;
    height: 90px;
  }

  @media (max-width: 320px) {
    width: 80px;
    height: 80px;
  }
`;

export const PrimarySkillButton = styled.div<{ color?: string; empty?: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.empty ? 'rgba(20, 20, 30, 0.4)' : 'rgba(20, 20, 30, 0.8)'};
  border: 3px solid ${props => props.empty ? 'rgba(255, 255, 255, 0.1)' : props.color || '#60a5fa'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: ${props => props.empty ?
    'inset 0 0 15px rgba(255, 255, 255, 0.05)' :
    `0 0 20px ${props.color || '#60a5fa'}40,
     inset 0 0 15px ${props.color || '#60a5fa'}20`
  };
  z-index: 2;

  svg {
    width: 60%;
    height: 60%;
    color: ${props => props.empty ? 'rgba(255, 255, 255, 0.2)' : props.color || '#60a5fa'};
    filter: ${props => props.empty ? 'none' : `drop-shadow(0 0 5px ${props.color || '#60a5fa'})`};
    opacity: ${props => props.empty ? 0.3 : 0.9};
  }

  &:hover {
    background: ${props => props.empty ? 'rgba(30, 30, 40, 0.5)' : 'rgba(30, 30, 40, 0.9)'};
    box-shadow: ${props => props.empty ?
    'inset 0 0 20px rgba(255, 255, 255, 0.08)' :
    `0 0 25px ${props.color || '#60a5fa'}60,
       inset 0 0 20px ${props.color || '#60a5fa'}30`
  };
    svg {
      opacity: ${props => props.empty ? 0.4 : 1};
    }
  }
`;

export const SecondarySkillsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  pointer-events: none;
`;

export const SkillSlot = styled.div<{ color?: string; isActive?: boolean; index: number; total: number; empty?: boolean }>`
  position: absolute;
  width: 60px;
  height: 60px;
  right: 16px;
  bottom: 34px;
  border: 2px solid ${props => props.empty ? 'rgba(255, 255, 255, 0.1)' : props.color || '#60a5fa'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.empty ? 'rgba(20, 20, 30, 0.4)' :
    props.isActive ? `${props.color}33` : 'rgba(20, 20, 30, 0.8)'};
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  box-shadow: ${props => props.empty ?
    'inset 0 0 10px rgba(255, 255, 255, 0.05)' :
    `0 0 15px ${props.color || '#60a5fa'}40,
     inset 0 0 10px ${props.color || '#60a5fa'}20`
  };
  pointer-events: auto;
  transform-origin: center bottom;
  transform: ${props => `
    rotate(${8 + -140 * (props.index / props.total)}deg)
    translateY(-${140 - 30}px)
  `};

  svg {
    width: 60%;
    height: 60%;
    color: ${props => props.empty ? 'rgba(255, 255, 255, 0.2)' :
    props.isActive ? props.color : '#fff'};
    filter: ${props => props.empty ? 'none' :
    props.isActive ? 'brightness(1.2) drop-shadow(0 0 5px currentColor)' : 'drop-shadow(0 0 3px currentColor)'};
    opacity: ${props => props.empty ? 0.3 : 0.9};
    transition: all 0.2s ease;
    transform: ${props => `rotate(-${8 + -140 * (props.index / props.total)}deg)`};
  }

  &:hover {
    background: ${props => props.empty ? 'rgba(30, 30, 40, 0.5)' : 'rgba(30, 30, 40, 0.9)'};
    box-shadow: ${props => props.empty ?
    'inset 0 0 15px rgba(255, 255, 255, 0.08)' :
    `0 0 20px ${props.color || '#60a5fa'}60,
       inset 0 0 15px ${props.color || '#60a5fa'}30`
  };
    svg {
      opacity: ${props => props.empty ? 0.4 : 1};
      transform: ${props => `rotate(-${8 + -140 * (props.index / props.total)}deg) scale(1.1)`};
    }
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    transform: ${props => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${120 - 30}px)
    `};
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    transform: ${props => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${100 - 30}px)
    `};
  }

  @media (max-width: 320px) {
    width: 40px;
    height: 40px;
    transform: ${props => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${90 - 30}px)
    `};
  }

  .cooldown {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;

    @media (max-width: 768px) {
      bottom: -16px;
      font-size: 11px;
    }

    @media (max-width: 480px) {
      bottom: -14px;
      font-size: 10px;
    }

    @media (max-width: 320px) {
      bottom: -12px;
      font-size: 9px;
    }
  }
`;

export const DirectionalArrow = styled.div<{ direction: 'up' | 'right' | 'down' | 'left' }>`
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 215, 150, 0.4);
  font-size: 24px;
  pointer-events: none; /* Allow events to pass through to main container */
  
  ${props => {
    switch (props.direction) {
      case 'up':
        return 'top: 15px; left: 50%; transform: translateX(-50%);';
      case 'right':
        return 'right: 15px; top: 50%; transform: translateY(-50%);';
      case 'down':
        return 'bottom: 15px; left: 50%; transform: translateX(-50%);';
      case 'left':
        return 'left: 15px; top: 50%; transform: translateY(-50%);';
    }
  }}

  &::before {
    content: '▲';
    transform: ${props => {
    switch (props.direction) {
      case 'right': return 'rotate(90deg)';
      case 'down': return 'rotate(180deg)';
      case 'left': return 'rotate(-90deg)';
      default: return 'none';
    }
  }};
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
