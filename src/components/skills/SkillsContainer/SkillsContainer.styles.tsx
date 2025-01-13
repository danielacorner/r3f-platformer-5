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
    box-shadow: 0 0 10px ${(props) => props.color}, 0 0 20px ${(props) =>
  props.color}40;
    border-color: ${(props) => props.color}cc;
  }
  50% {
    box-shadow: 0 0 15px ${(props) => props.color}, 0 0 30px ${(props) =>
  props.color}60;
    border-color: ${(props) => props.color};
  }
  100% {
    box-shadow: 0 0 10px ${(props) => props.color}, 0 0 20px ${(props) =>
  props.color}40;
    border-color: ${(props) => props.color}cc;
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

export const SkillsContainerWrapper = styled.div`
  position: fixed;
  right: 0;
  bottom: 12px;
  z-index: 999999999999999;
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

export const PrimarySkillButton = styled.div<{
  color?: string;
  empty?: boolean;
  isActive?: boolean;
}>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${(props) =>
    props.empty
      ? "rgba(20, 20, 30, 0.4)"
      : props.isActive
      ? `${props.color}22`
      : "rgba(20, 20, 30, 0.8)"};
  border: 3px solid
    ${(props) =>
      props.empty ? "rgba(255, 255, 255, 0.1)" : props.color || "#60a5fa"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: ${(props) =>
    props.empty
      ? "inset 0 0 15px rgba(255, 255, 255, 0.05)"
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
      : "none"};

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
  }

  &:hover {
    background: ${(props) =>
      props.empty
        ? "rgba(30, 30, 40, 0.5)"
        : props.isActive
        ? `${props.color}33`
        : "rgba(30, 30, 40, 0.9)"};
    box-shadow: ${(props) =>
      props.empty
        ? "inset 0 0 20px rgba(255, 255, 255, 0.08)"
        : props.isActive
        ? `0 0 30px ${props.color}cc, 0 0 40px ${props.color}60, inset 0 0 25px ${props.color}60`
        : `0 0 25px ${props.color || "#60a5fa"}60, inset 0 0 20px ${
            props.color || "#60a5fa"
          }30`};
    svg {
      opacity: ${(props) => (props.empty ? 0.4 : 1)};
      transform: ${(props) => (props.isActive ? "scale(1.15)" : "scale(1.1)")};
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
  }
`;
