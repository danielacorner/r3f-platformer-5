import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaStar, FaTimes, FaPlus, FaBolt } from "react-icons/fa";
import { useGameStore } from "../../../store/gameStore";
import { Tabs, Tab, Box } from "@mui/material";
import { applyPassiveEffects } from "../SkillEffects/passiveEffects";
import { getMissileCount } from "../SkillEffects/castMagicMissiles";
import { getBoomerangCount } from "../SkillEffects/castMagicBoomerang";
import {
  ActiveSkill,
  activeSkills,
  MagicSchool,
  magicSchools,
  passiveSkills,
} from "../skills";
import { StyledSkillsMenu, StyledSkillItem, MenuBackdrop } from "./styles.tsx";

interface SkillsMenuProps {
  onClose: () => void;
}

export function SkillsMenu({ onClose }: SkillsMenuProps) {
  const [activeSchool, setActiveSchool] = useState<MagicSchool>("arcane");
  const {
    skillPoints,
    upgradeSkill,
    skillLevels,
    equippedSkills,
    selectedSkillSlot,
    selectedSkill,
    setSelectedSkill,
    equipSkill,
    setSelectedSkillSlot,
    level,
  } = useGameStore();

  const implementedSkills = [
    "Magic Orb",
    "Magic Boomerang",
    "Magic Missiles",
    "Arcane Nova",
    "Lightning Storm",
    "Arcane Multiplication",
    "Inferno",
    "Multi Orb",
    "Arcane Power",
  ];

  const handleUpgrade = (skillName: string) => {
    const skills = [...activeSkills, ...passiveSkills];
    const skill = skills.find((s) => s.name === skillName);
    if (!skill) return;

    const currentLevel = skillLevels[skillName] || 0;
    const aboveMaxLevel = currentLevel >= skill.maxLevel;
    if (aboveMaxLevel) return;

    if (skillPoints >= 1) {
      upgradeSkill(skillName);
    }
  };

  const handleSkillClick = (skill: ActiveSkill) => {
    if (!implementedSkills.includes(skill.name)) {
      return; // Don't allow clicking unimplemented skills
    }

    if (selectedSkillSlot !== null) {
      // If a slot is selected, equip the skill directly
      equipSkill(skill, selectedSkillSlot);
      setSelectedSkill(null);
      setSelectedSkillSlot(null);
      onClose();
    } else {
      // Otherwise, select this skill for later equipping
      setSelectedSkill(skill);
      // Clear slot selection when selecting a skill
      setSelectedSkillSlot(null);
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const getSkillStats = (skill: (typeof activeSkills)[0], level: number) => {
    switch (skill.name) {
      case "Magic Missiles":
        return `Missiles: ${getMissileCount(level)}`;
      case "Magic Boomerang":
        return `Boomerangs: ${getBoomerangCount(level)}`;
      case "Arcane Nova":
        return `Damage: ${Math.round((10 + level * 5) * 10) / 10}`;
      case "Lightning Storm":
        return `Lightning Bolts: ${3 + Math.floor(level / 4)}`;
      case "Arcane Multiplication":
        return `Spell Copies: ${1 + Math.floor(level / 4)}`;
      case "Tsunami Wave":
        return `Wave Size: ${Math.round((1 + level * 0.2) * 10) / 10}x`;
      default:
        return "";
    }
  };

  const getSkillDamage = (skill: (typeof activeSkills)[0], level: number) => {
    switch (skill.name) {
      case "Magic Missiles": {
        const baseDamage = 20 + level * 5;
        const damage = applyPassiveEffects(baseDamage, "magic");
        return `${damage} × ${getMissileCount(level)}`;
      }
      case "Magic Boomerang": {
        const baseDamage = 15 + level * 5;
        const damage = applyPassiveEffects(baseDamage, "physical");
        return `${damage} × ${getBoomerangCount(level)}`;
      }
      case "Arcane Nova": {
        const baseDamage = 30 + level * 10;
        return applyPassiveEffects(baseDamage, "magic").toString();
      }
      case "Lightning Storm": {
        const baseDamage = 18 + level * 25;
        return `${applyPassiveEffects(baseDamage, "lightning")} / strike`;
      }
      default:
        return null;
    }
  };

  return createPortal(
    <>
      <MenuBackdrop
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <StyledSkillsMenu
        onClick={(e) => e.stopPropagation()}
        onWheel={handleScroll}
      >
        <div className="skills-header">
          <h2>Magic Skills</h2>
          <div className="header-right">
            <div className="skill-points">
              {window.innerWidth >= 640 && (
                <div className="skill-points-label">
                  SKILL CHOICES REMAINING
                </div>
              )}
              <div className="skill-points-value">
                <FaStar className="skill-points-icon" />
                <span>{skillPoints}</span>
              </div>
            </div>
            <button
              className="close-icon-button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeSchool}
            onChange={(_, newValue) => setActiveSchool(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                flexGrow: 1,
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-selected": {
                  color: magicSchools[activeSchool].color,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: magicSchools[activeSchool].color,
              },
            }}
          >
            {Object.entries(magicSchools).map(([key, school]) => (
              <Tab
                key={key}
                label={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ color: school.color }}>
                      <school.icon
                        style={{
                          color: school.color,
                          width: 36,
                          height: 36,
                        }}
                      />
                    </div>
                  </div>
                }
                value={key}
              />
            ))}
          </Tabs>
        </Box>

        <div className="skills-content">
          <div
            className="school-description"
            style={{ color: magicSchools[activeSchool].color }}
          >
            {magicSchools[activeSchool].description}
          </div>

          <div className="skills-grid">
            {[...activeSkills, ...passiveSkills]
              .filter((skill) => skill.school === activeSchool)
              .map((skill) => {
                const isSelected = selectedSkill === skill;
                const isEquipped = Object.values(equippedSkills)
                  .map((s) => s?.name)
                  .includes(skill?.name);
                const currentLevel = (skill && skillLevels[skill.name]) || 0;
                const canAfford = skillPoints >= 1;
                const nextLevelReq =
                  "levelRequirements" in skill &&
                  skill.levelRequirements &&
                  currentLevel < skill.maxLevel
                    ? skill.levelRequirements[currentLevel]
                    : null;
                const meetsLevelReq =
                  !nextLevelReq ||
                  nextLevelReq === null ||
                  level >= nextLevelReq;

                return (
                  <StyledSkillItem
                    key={skill.name}
                    onClick={() =>
                      !("effect" in skill) &&
                      handleSkillClick(skill as ActiveSkill)
                    }
                    isSelected={isSelected}
                    color={skill.color}
                    isImplemented={implementedSkills.includes(skill.name)}
                  >
                    {"levelRequirements" in skill && nextLevelReq && (
                      <div
                        className={`level-requirement ${
                          meetsLevelReq ? "met" : ""
                        }`}
                      >
                        {meetsLevelReq ? "" : `Requires Level ${nextLevelReq}`}
                      </div>
                    )}
                    <div className="skill-background-icon">
                      <skill.icon />
                    </div>
                    <div
                      className="skill-icon"
                      data-skill-type={"effect" in skill ? "passive" : "active"}
                    >
                      <skill.icon />
                      {!("effect" in skill) &&
                        getSkillDamage(
                          skill as (typeof activeSkills)[0],
                          currentLevel
                        ) && (
                          <div className="damage-indicator">
                            <FaBolt />
                            {getSkillDamage(
                              skill as (typeof activeSkills)[0],
                              currentLevel
                            )}
                          </div>
                        )}
                    </div>
                    <div className="skill-info">
                      <h3>{skill.name}</h3>
                      <p>{skill.description}</p>
                      {"effect" in skill && (
                        <p className="skill-effect">
                          {Object.entries(skill.effect?.(currentLevel))
                            .map(([key, value]) => {
                              const formattedKey = key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase());

                              const formattedValue =
                                key.toLowerCase().includes("chance") ||
                                key.toLowerCase().includes("reduction")
                                  ? `${Math.round(Number(value) * 100)}%`
                                  : Math.round(Number(value) * 10) / 10;

                              return `${formattedKey}: ${formattedValue}`;
                            })
                            .join(" | ")}
                        </p>
                      )}
                      {!("effect" in skill) &&
                        getSkillStats(
                          skill as (typeof activeSkills)[0],
                          currentLevel
                        ) && (
                          <p className="skill-stats">
                            {getSkillStats(
                              skill as (typeof activeSkills)[0],
                              currentLevel
                            )}
                          </p>
                        )}
                    </div>
                    <div className="skill-controls">
                      {currentLevel < skill.maxLevel && (
                        <button
                          className="skill-upgrade-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(skill.name);
                          }}
                          disabled={!canAfford || !meetsLevelReq}
                          title={
                            canAfford
                              ? meetsLevelReq
                                ? "Upgrade"
                                : `Requires Level ${nextLevelReq}`
                              : "Not enough skill points"
                          }
                        >
                          <FaPlus />
                        </button>
                      )}
                      <div className="skill-level">
                        {currentLevel > 0 && currentLevel}
                      </div>
                    </div>
                    {isEquipped && (
                      <div
                        className="equipped-indicator"
                        style={{ color: skill.color }}
                      >
                        (Equipped)
                      </div>
                    )}
                  </StyledSkillItem>
                );
              })}
          </div>
        </div>
      </StyledSkillsMenu>
    </>,
    document.body
  );
}
