import styled from "@emotion/styled";

export const MenuBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1099;
  pointer-events: all;
`;

export const StyledSkillsMenu = styled.div`
  position: fixed;
  top: calc(50% - 2rem);
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95vw;
  max-width: 1200px;
  max-height: 90vh;
  background: rgba(17, 24, 39, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  @media screen and (max-width: 640px) {
    padding: 1rem;
  }
  color: #e5e7eb;
  z-index: 1100;
  overflow-y: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  .MuiTab-root {
    width: 0px !important;
    min-width: 0px !important;
  }
  .skills-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    h2 {
      font-size: 1.5rem;
      color: #f3f4f6;
      margin: 0;
    }
    @media screen and (max-width: 640px) {
      margin-bottom: 0.5rem;
      padding: 0 0.5rem;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .skill-points {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.9rem;
    color: #e5e7eb;
  }

  .skill-points-label {
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9ca3af;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .skill-points-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #1f2937, #111827);
    border-radius: 0.25rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.9),
      inset 0 0 2px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);

    .skill-points-icon {
      color: #fbbf24;
      font-size: 1rem;
    }

    span {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }

  .close-icon-button {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.2s ease;

    &:hover {
      color: #f3f4f6;
    }
  }

  .skills-content {
    margin-top: 1rem;
    overflow: auto;
    max-height: calc(100vh - 15rem);
  }

  .school-description {
    margin-bottom: 1rem;
    text-shadow: 0px 0px 24px rgba(255, 255, 255, 0.99);
  }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding-right: 1rem;
  }
`;

export const StyledSkillItem = styled.div<{
  isSelected?: boolean;
  color?: string;
}>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgba(17, 24, 39, 0.8);
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-right: 3rem;
  cursor: pointer;
  ${(props) =>
    props.isSelected &&
    `
    box-shadow: 0 0 16px ${props.color} inset;
  `}

  &:hover {
    background: rgba(31, 41, 55, 0.8);
  }

  .skill-background-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.1;
    font-size: 4rem;
    pointer-events: none;
  }

  .skill-icon {
    position: relative;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5rem;
    border: 2px solid ${(props) => props.color || "#60a5fa"};
    color: ${(props) => props.color || "#60a5fa"};
    font-size: 1.5rem;
    
    svg {
      width: 100%;
      height: 100%;
    }

    &::after {
      content: attr(data-skill-type);
      position: absolute;
      bottom: -1.2rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7rem;
      padding: 0.1rem 0.5rem;
      border-radius: 1rem;
      background: ${(props) => props.color || "#60a5fa"};
      color: #111827;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.05em;
      white-space: nowrap;
      opacity: 0.9;
    }
  }

  .skill-info {
    flex: 1;

    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: #f3f4f6;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: #9ca3af;
      line-height: 1.4;
    }

    .skill-effect,
    .skill-stats {
      color: #60a5fa !important;
      margin-top: 0.5rem !important;
    }
  }

  .skill-controls {
    position: absolute;
    right: -3rem;
    bottom: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .skill-level {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(135deg, #2c1810, #3d2317);
    border-radius: 0.25rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.9),
      inset 0 0 2px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.5);
    border: 2px solid #5a3925;
    text-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
    margin-top: 0.5rem;
  }

  .skill-upgrade-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a365d, #2d4a7c);
    border: 2px solid #3b82f6;
    border-radius: 0.25rem;
    color: #fbbf24;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.9),
      inset 0 0 2px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.5);
    margin-bottom: 0.5rem;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #2d4a7c, #3b5998);
      border-color: #60a5fa;
      color: #f59e0b;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #4b5563;
    }
  }

  .equipped-indicator {
    opacity: 0.7;
    margin-left: 8px;
    position: absolute;
    right: 0.4rem;
    top: 0rem;
    z-index: 1;
  }

  .level-requirement {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.8rem;
    color: #ef4444;

    &.met {
      color: #22c55e;
    }
  }
`;
