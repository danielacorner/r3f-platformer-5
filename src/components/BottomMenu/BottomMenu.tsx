import { BottomMenuContainer } from "./BottomMenu.styles";
import { SkillsContainer } from "../skills/SkillsContainer";
import { Portal } from "@mui/material";
import { Joystick } from "./Joystick/Joystick";

export function BottomMenu() {
  return (
    <Portal>
      <BottomMenuContainer>
        <Joystick />
        <SkillsContainer />
      </BottomMenuContainer>
    </Portal>
  );
}
