import styled from "@emotion/styled";

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
  pointer-events: none;

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