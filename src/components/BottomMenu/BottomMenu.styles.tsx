import styled from "@emotion/styled";
import { keyframes, css } from "@emotion/react";

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
    box-shadow: 0 0 15px rgba(255, 255    box-shadow: 0 0 10px ${(props) =>
      props.color}, 0 0 20px ${(props) => props.color}40;
    border-color: ${(props) => props.color}cc;
  }
  50% {
    box-shadow: 0 0 15px ${(props) => props.color}, 0 0 30px ${(props) =>
  props.color}60;
    border-color: ${(props) => props.color};
  }
  100% {
    box-shadow: 0 0 10px ${(props) => props.color}    border-color: ${(props) =>
  props.color}cc;
  }
`;

const activeGlowAnimation = keyframes`
  0% {
    box-shadow: 0 0 15px ${(props) => props.color}80, 0 0 25px ${(props) =>
  props.color}40, inset 0 0 15px ${(props) => props.color}40;
    border-color: ${(props) => props.color};
  }
  50% {
    box-shadow: 0 0 25px ${(props) => props.color}cc, 0 0 35px ${(props) =>
  props.color}60, inset 0 0 25px ${(props) => props.color}60;
    border-color: ${(props) => props.color}ff;
  }
  100% {
    box-shadow: 0 0 15px ${(props) => props.color}80, 0 0 25px ${(props) =>
  props.color}40, inset 0 0 15px ${(props) => props.color}40;
    border-color: ${(props) => props.color};
  }
`;

const mediaQueries = {
  tablet: "@media (min-width: 768px)",
  desktop: "@media (min-width: 1024px)",
};

export const BottomMenuContainer = styled.div`
  position: fixed;
  bottom: 12px;
  right: 0px;
  left: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
  height: 240px;
  z-index: 1100;
`;

export const SkillSlot = styled.div<{
  color?: string;
  isActive?: boolean;
  index: number;
  total: number;
  empty?: boolean;
}>`
  position: absolute;
  width: 60px;
  height: 60px;
  right: 16px;
  bottom: 34px;
  border: 2px solid
    ${(props) =>
      props.empty ? "rgba(255, 255, 255, 0.1)" : props.color || "#60a5fa"};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.empty
      ? "rgba(20, 20, 30, 0.4)"
      : props.isActive
      ? `${props.color}33`
      : "rgba(20, 20, 30, 0.8)"};
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  box-shadow: ${(props) =>
    props.empty
      ? "inset 0 0 10px rgba(255, 255, 255, 0.05)"
      : props.isActive
      ? `0 0 20px ${props.color}80, 0 0 30px ${props.color}40, inset 0 0 15px ${props.color}40`
      : `0 0 15px ${props.color || "#60a5fa"}40, inset 0 0 10px ${
          props.color || "#60a5fa"
        }20`};
  pointer-events: auto;
  transform-origin: center bottom;
  transform: ${(props) => `
    rotate(${8 + -140 * (props.index / props.total)}deg)
    translateY(-${140 - 30}px)
  `};
  animation: ${(props) =>
    props.isActive
      ? css`
          ${activeGlowAnimation} 2s infinite
        `
      : "none"};

  svg {
    width: 60%;
    height: 60%;
    color: ${(props) =>
      props.empty
        ? "rgba(255, 255, 255, 0.2)"
        : props.isActive
        ? props.color
        : "#fff"};
    filter: ${(props) =>
      props.empty
        ? "none"
        : props.isActive
        ? `brightness(1.3) drop-shadow(0 0 8px ${props.color})`
        : "drop-shadow(0 0 3px currentColor)"};
    opacity: ${(props) => (props.empty ? 0.3 : props.isActive ? 1 : 0.9)};
    transition: all 0.3s ease;
    transform: ${(props) =>
      `rotate(-${8 + -140 * (props.index / props.total)}deg) ${
        props.isActive ? "scale(1.1)" : "scale(1)"
      }`};
  }

  &:hover {
    background: ${(props) =>
      props.empty
        ? "rgba(30, 30, 40, 0.5)"
        : props.isActive
        ? `${props.color}44`
        : "rgba(30, 30, 40, 0.9)"};
    box-shadow: ${(props) =>
      props.empty
        ? "inset 0 0 15px rgba(255, 255, 255, 0.08)"
        : props.isActive
        ? `0 0 25px ${props.color}cc, 0 0 35px ${props.color}60, inset 0 0 20px ${props.color}60`
        : `0 0 20px ${props.color || "#60a5fa"}60, inset 0 0 15px ${
            props.color || "#60a5fa"
          }30`};
    svg {
      opacity: ${(props) => (props.empty ? 0.4 : 1)};
      transform: ${(props) =>
        `rotate(-${8 + -140 * (props.index / props.total)}deg) ${
          props.isActive ? "scale(1.15)" : "scale(1.1)"
        }`};
    }
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    transform: ${(props) => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${120 - 30}px)
    `};
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    transform: ${(props) => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${100 - 30}px)
    `};
  }

  @media (max-width: 320px) {
    width: 40px;
    height: 40px;
    transform: ${(props) => `
      rotate(${8 + -140 * (props.index / props.total)}deg)
      translateY(-${90 - 30}px)
    `};
  }
`;

export const DirectionalArrow = styled.div<{
  direction: "up" | "right" | "down" | "left";
}>`
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 215, 150, 0.4);
  font-size: 24px;
  pointer-events: none; /* Allow events to pass through to main container */

  ${(props) => {
    switch (props.direction) {
      case "up":
        return "top: 15px; left: 50%; transform: translateX(-50%);";
      case "right":
        return "right: 15px; top: 50%; transform: translateY(-50%);";
      case "down":
        return "bottom: 15px; left: 50%; transform: translateX(-50%);";
      case "left":
        return "left: 15px; top: 50%; transform: translateY(-50%);";
    }
  }}

  &::before {
    content: "▲";
    transform: ${(props) => {
      switch (props.direction) {
        case "right":
          return "rotate(90deg)";
        case "down":
          return "rotate(180deg)";
        case "left":
          return "rotate(-90deg)";
        default:
          return "none";
      }
    }};
  }
`;

export const StatusSection = styled("div", {
  label: "StatusSection",
})`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  height: 1.75rem;
  padding: 0 0.5rem;
  background: linear-gradient(to bottom, #1e293b, #1e2837);
  border: 1px solid #3b5998;
  border-radius: 4px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3),
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

export const PlayerInfo = styled("div", {
  label: "PlayerInfo",
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const PlayerIcon = styled("button", {
  label: "PlayerIcon",
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

export const SkillPointsBadge = styled("div", {
  label: "SkillPointsBadge",
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

export const LevelInfo = styled("div", {
  label: "LevelInfo",
})`
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const LevelNumber = styled("div", {
  label: "LevelNumber",
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

export const XPProgressBar = styled("div", {
  label: "XPProgressBar",
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

export const XPProgressFill = styled("div", {
  label: "XPProgressFill",
})<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  width: ${(props) => props.progress}%;
`;

export const XPText = styled("div", {
  label: "XPText",
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

export const Resources = styled("div", {
  label: "Resources",
})`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  padding-right: 1rem;
`;

export const Money = styled("div", {
  label: "Money",
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

export const SkillSlots = styled("div", {
  label: "SkillSlots",
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
