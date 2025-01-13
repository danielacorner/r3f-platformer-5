import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

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

const clickAnimation = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(0.95);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
`;

export const CooldownOverlay = styled.div<{
  progress: number;
  color?: string;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    ${(props) => props.color || "#60a5fa"}40
      ${(props) => props.progress * 360}deg,
    rgba(0, 0, 0, 0.5) ${(props) => props.progress * 360}deg 360deg
  );
  transition: background 0.1s linear;
  pointer-events: none;
  z-index: 3;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 85%;
    height: 85%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.8) 100%
    );
  }
`;

export const CooldownText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  z-index: 4;
  pointer-events: none;
`;

export const PrimarySkillButton = styled.div<{
  color?: string;
  empty?: boolean;
  isActive?: boolean;
  isOnCooldown?: boolean;
  isHighlighted?: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${(props) =>
    props.empty
      ? props.isHighlighted
        ? "rgba(40, 40, 60, 0.6)"
        : "rgba(20, 20, 30, 0.4)"
      : props.isActive
      ? `${props.color}22`
      : "rgba(20, 20, 30, 0.8)"};
  border: ${(props) =>
    props.isHighlighted
      ? "3px solid rgba(255, 255, 255, 0.8)"
      : `3px solid ${
          props.empty ? "rgba(255, 255, 255, 0.1)" : props.color || "#60a5fa"
        }`};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.isOnCooldown ? "not-allowed" : "pointer")};
  backdrop-filter: blur(4px);
  box-shadow: ${(props) =>
    props.empty
      ? props.isHighlighted
        ? "inset 0 0 20px rgba(255, 255, 255, 0.08)"
        : "inset 0 0 15px rgba(255, 255, 255, 0.05)"
      : props.isActive
      ? `0 0 25px ${props.color}80, 0 0 35px ${props.color}40, inset 0 0 20px ${props.color}40`
      : `0 0 20px ${props.color || "#60a5fa"}40, inset 0 0 15px ${
          props.color || "#60a5fa"
        }20`};
  z-index: 2;
  transition: all 0.3s ease;
  animation: ${(props) =>
    props.isActive
      ? css`
          ${activeGlowAnimation} 2s infinite
        `
      : props.isOnCooldown
      ? "none"
      : "none"};

  &.clicked {
    animation: ${clickAnimation} 0.3s ease;
  }

  svg {
    width: 60%;
    height: 60%;
    color: ${(props) =>
      props.empty
        ? "rgba(255, 255, 255, 0.2)"
        : props.isActive
        ? props.color
        : props.color || "#60a5fa"};
    filter: ${(props) =>
      props.empty
        ? "none"
        : props.isActive
        ? `drop-shadow(0 0 8px ${props.color})`
        : `drop-shadow(0 0 5px ${props.color || "#60a5fa"})`};
    opacity: ${(props) => (props.empty ? 0.3 : props.isActive ? 1 : 0.9)};
    transition: all 0.3s ease;
    transform: ${(props) => (props.isActive ? "scale(1.1)" : "scale(1)")};
    filter: ${(props) =>
      props.isOnCooldown ? "grayscale(1) brightness(0.7)" : "none"};
  }

  &:hover {
    background: ${(props) =>
      props.empty
        ? props.isHighlighted
          ? "rgba(50, 50, 70, 0.7)"
          : "rgba(30, 30, 40, 0.5)"
        : props.isActive
        ? `${props.color}33`
        : "rgba(30, 30, 40, 0.9)"};
    box-shadow: ${(props) =>
      props.empty
        ? props.isHighlighted
          ? "inset 0 0 25px rgba(255, 255, 255, 0.1)"
          : "inset 0 0 20px rgba(255, 255, 255, 0.08)"
        : props.isActive
        ? `0 0 30px ${props.color}cc, 0 0 40px ${props.color}60, inset 0 0 25px ${props.color}60`
        : `0 0 25px ${props.color || "#60a5fa"}60, inset 0 0 20px ${
            props.color || "#60a5fa"
          }30`};
    svg {
      opacity: ${(props) => (props.isOnCooldown ? 0.5 : props.empty ? 0.4 : 1)};
      transform: ${(props) => (props.isActive ? "scale(1.15)" : "scale(1.1)")};
    }
  }
`;

export const SkillSlot = styled.div<{
  color?: string;
  isActive?: boolean;
  isOnCooldown?: boolean;
  index: number;
  total: number;
  empty?: boolean;
  isHighlighted?: boolean;
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
  border: ${(props) =>
    props.isHighlighted
      ? "3px solid rgba(255, 255, 255, 0.8)"
      : `3px solid ${
          props.empty ? "rgba(255, 255, 255, 0.1)" : props.color || "#60a5fa"
        }`};
  cursor: ${(props) => (props.isOnCooldown ? "not-allowed" : "pointer")};
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
  transform: ${(props) =>
    `rotate(${8 + -140 * (props.index / props.total)}deg) translateY(-${
      140 - 30
    }px)`};
  animation: ${(props) =>
    props.isActive
      ? css`
          ${activeGlowAnimation} 2s infinite
        `
      : "none"};

  &.clicked {
    animation: ${clickAnimation} 0.3s ease;
  }

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
        : props.isOnCooldown
        ? "grayscale(1) brightness(0.7)"
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
      opacity: ${(props) => (props.isOnCooldown ? 0.5 : props.empty ? 0.4 : 1)};
      transform: ${(props) =>
        `rotate(-${8 + -140 * (props.index / props.total)}deg) ${
          props.isActive ? "scale(1.15)" : "scale(1.1)"
        }`};
    }
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    transform: ${(props) =>
      `rotate(${8 + -140 * (props.index / props.total)}deg) translateY(-${
        120 - 30
      }px)`};
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    transform: ${(props) =>
      `rotate(${8 + -140 * (props.index / props.total)}deg) translateY(-${
        100 - 30
      }px)`};
  }

  @media (max-width: 320px) {
    width: 40px;
    height: 40px;
    transform: ${(props) =>
      `rotate(${8 + -140 * (props.index / props.total)}deg) translateY(-${
        90 - 30
      }px)`};
  }
`;

export const SkillsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-left: auto;
  pointer-events: none;
  padding-right: 1rem;
`;

export const PrimarySkillContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  pointer-events: auto;

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
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
