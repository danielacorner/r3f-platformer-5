import { useState } from "react";
import { useGameStore } from "../store/gameStore";

import { FaCoins, FaUser } from "react-icons/fa";

import {
  GiWaterDrop,
  GiFireBowl,
  GiSnowflake1,
  GiLeafSwirl,
  GiLightningStorm,
  GiSkullCrossedBones,
} from "react-icons/gi";

import { TOWER_STATS, ElementType } from "../store/gameStore";

import "../styles/BuildMenu.css";

import { SkillsMenu } from "./SkillsMenu";

export const TOWER_TYPES: Record<
  string,
  {
    level: number;
    type: ElementType;
    label: string;
    icon: JSX.Element;
    description: string;
    cost: number;
  }
> = {
  // Fire Towers

  fire1: {
    level: 1,
    type: "fire1" as ElementType,
    label: "Fire I",
    icon: <GiFireBowl />,
    description: "Basic fire damage",
    cost: TOWER_STATS.fire1.cost,
  },

  fire2: {
    level: 2,
    type: "fire2" as ElementType,
    label: "Fire II",
    icon: <GiFireBowl />,
    description: "Enhanced fire damage",
    cost: TOWER_STATS.fire2.cost,
  },

  fire3: {
    level: 3,
    type: "fire3" as ElementType,
    label: "Fire III",
    icon: <GiFireBowl />,
    description: "Advanced fire damage",
    cost: TOWER_STATS.fire3.cost,
  },

  fire4: {
    level: 4,
    type: "fire4" as ElementType,
    label: "Fire IV",
    icon: <GiFireBowl />,
    description: "Superior fire damage",
    cost: TOWER_STATS.fire4.cost,
  },

  fire5: {
    level: 5,
    type: "fire5" as ElementType,
    label: "Fire V",
    icon: <GiFireBowl />,
    description: "Ultimate fire damage",
    cost: TOWER_STATS.fire5.cost,
  },

  // Ice Towers

  ice1: {
    level: 1,
    type: "ice1" as ElementType,
    label: "Ice I",
    icon: <GiSnowflake1 />,
    description: "Basic slow effect",
    cost: TOWER_STATS.ice1.cost,
  },

  ice2: {
    level: 2,
    type: "ice2" as ElementType,
    label: "Ice II",
    icon: <GiSnowflake1 />,
    description: "Enhanced slow effect",
    cost: TOWER_STATS.ice2.cost,
  },

  ice3: {
    level: 3,
    type: "ice3" as ElementType,
    label: "Ice III",
    icon: <GiSnowflake1 />,
    description: "Advanced slow effect",
    cost: TOWER_STATS.ice3.cost,
  },

  ice4: {
    level: 4,
    type: "ice4" as ElementType,
    label: "Ice IV",
    icon: <GiSnowflake1 />,
    description: "Superior slow effect",
    cost: TOWER_STATS.ice4.cost,
  },

  ice5: {
    level: 5,
    type: "ice5" as ElementType,
    label: "Ice V",
    icon: <GiSnowflake1 />,
    description: "Ultimate slow effect",
    cost: TOWER_STATS.ice5.cost,
  },

  // Nature Towers

  nature1: {
    level: 1,
    type: "nature1" as ElementType,
    label: "Nature I",
    icon: <GiLeafSwirl />,
    description: "Basic poison damage",
    cost: TOWER_STATS.nature1.cost,
  },

  nature2: {
    level: 2,
    type: "nature2" as ElementType,
    label: "Nature II",
    icon: <GiLeafSwirl />,
    description: "Enhanced poison",
    cost: TOWER_STATS.nature2.cost,
  },

  nature3: {
    level: 3,
    type: "nature3" as ElementType,
    label: "Nature III",
    icon: <GiLeafSwirl />,
    description: "Advanced poison",
    cost: TOWER_STATS.nature3.cost,
  },

  nature4: {
    level: 4,
    type: "nature4" as ElementType,
    label: "Nature IV",
    icon: <GiLeafSwirl />,
    description: "Superior poison",
    cost: TOWER_STATS.nature4.cost,
  },

  nature5: {
    level: 5,
    type: "nature5" as ElementType,
    label: "Nature V",
    icon: <GiLeafSwirl />,
    description: "Ultimate poison",
    cost: TOWER_STATS.nature5.cost,
  },

  // Storm Towers

  storm1: {
    level: 1,
    type: "storm1" as ElementType,
    label: "Storm I",
    icon: <GiLightningStorm />,
    description: "Chain Lightning",
    cost: TOWER_STATS.storm1.cost,
  },

  storm2: {
    level: 2,
    type: "storm2" as ElementType,
    label: "Storm II",
    icon: <GiLightningStorm />,
    description: "Thunder Strike",
    cost: TOWER_STATS.storm2.cost,
  },

  storm3: {
    level: 3,
    type: "storm3" as ElementType,
    label: "Storm III",
    icon: <GiLightningStorm />,
    description: "Static Field",
    cost: TOWER_STATS.storm3.cost,
  },

  storm4: {
    level: 4,
    type: "storm4" as ElementType,
    label: "Storm IV",
    icon: <GiLightningStorm />,
    description: "Overload",
    cost: TOWER_STATS.storm4.cost,
  },

  storm5: {
    level: 5,
    type: "storm5" as ElementType,
    label: "Storm V",
    icon: <GiLightningStorm />,
    description: "Storm Fury",
    cost: TOWER_STATS.storm5.cost,
  },

  // Water Towers

  water1: {
    level: 1,
    type: "water1" as ElementType,
    label: "Water I",
    icon: <GiWaterDrop />,
    description: "Basic splash damage",
    cost: TOWER_STATS.water1.cost,
  },

  water2: {
    level: 2,
    type: "water2" as ElementType,
    label: "Water II",
    icon: <GiWaterDrop />,
    description: "Enhanced splash",
    cost: TOWER_STATS.water2.cost,
  },

  water3: {
    level: 3,
    type: "water3" as ElementType,
    label: "Water III",
    icon: <GiWaterDrop />,
    description: "Advanced splash",
    cost: TOWER_STATS.water3.cost,
  },

  water4: {
    level: 4,
    type: "water4" as ElementType,
    label: "Water IV",
    icon: <GiWaterDrop />,
    description: "Superior splash",
    cost: TOWER_STATS.water4.cost,
  },

  water5: {
    level: 5,
    type: "water5" as ElementType,
    label: "Water V",
    icon: <GiWaterDrop />,
    description: "Ultimate splash",
    cost: TOWER_STATS.water5.cost,
  },

  // Dark Towers

  dark1: {
    level: 1,
    type: "dark1" as ElementType,
    label: "Dark I",
    icon: <GiSkullCrossedBones />,
    description: "Basic armor reduction",
    cost: TOWER_STATS.dark1.cost,
  },

  dark2: {
    level: 2,
    type: "dark2" as ElementType,
    label: "Dark II",
    icon: <GiSkullCrossedBones />,
    description: "Enhanced reduction",
    cost: TOWER_STATS.dark2.cost,
  },

  dark3: {
    level: 3,
    type: "dark3" as ElementType,
    label: "Dark III",
    icon: <GiSkullCrossedBones />,
    description: "Advanced reduction",
    cost: TOWER_STATS.dark3.cost,
  },

  dark4: {
    level: 4,
    type: "dark4" as ElementType,
    label: "Dark IV",
    icon: <GiSkullCrossedBones />,
    description: "Superior reduction",
    cost: TOWER_STATS.dark4.cost,
  },

  dark5: {
    level: 5,
    type: "dark5" as ElementType,
    label: "Dark V",
    icon: <GiSkullCrossedBones />,
    description: "Ultimate reduction",
    cost: TOWER_STATS.dark5.cost,
  },
} as const;

function TowerButton({
  tower,

  isSelected,

  canAfford,

  onClick,
  element,
}: {
  tower: (typeof TOWER_TYPES)[keyof typeof TOWER_TYPES];

  isSelected: boolean;

  canAfford: boolean;

  onClick: () => void;

  element: ElementType;
}) {
  return (
    <button
      className={`tower-button ${isSelected ? "selected" : ""} ${
        !canAfford ? "disabled" : ""
      }`}
      onClick={onClick}
      disabled={!canAfford}
      data-element={element}
    >
      <div className="tower-button-icon">{tower.icon}</div>

      <div className="tower-button-label">{tower.label}</div>

      <div className="tower-tooltip">
        <div className="font-medium mb-1">{tower.label}</div>

        <div className="text-gray-400 text-xs mb-1">{tower.description}</div>

        <div className="flex items-center text-yellow-400">
          <FaCoins className="mr-1" />

          {tower.cost}
        </div>

        {TOWER_STATS[tower.type].special && (
          <div className="text-blue-400 text-xs mt-1">
            {TOWER_STATS[tower.type].special?.type}:{" "}
            {(TOWER_STATS[tower.type].special?.value ?? 0) * 100}%
          </div>
        )}
      </div>
    </button>
  );
}

export function BuildMenu() {
  const {
    selectedObjectType,
    setSelectedObjectType,
    money,
    experience,
    level,
    skillPoints,
  } = useGameStore();

  const [showSkillsMenu, setShowSkillsMenu] = useState(false);

  // Calculate XP progress

  const expForNextLevel = level * 100;

  const progress = (experience / expForNextLevel) * 100;

  // Group towers by element

  const towerGroups = Object.values(TOWER_TYPES).reduce((acc, tower) => {
    const element = tower.type.replace(/[0-9]/g, "");

    if (!acc[element]) acc[element] = [];

    acc[element].push(tower);

    return acc;
  }, {} as Record<string, (typeof TOWER_TYPES)[keyof typeof TOWER_TYPES][]>);

  return (
    <div className="build-menu" onClick={(e) => e.stopPropagation()}>
      <div className="stats-display">
        <div className="player-stats">
          <button
            className="player-icon"
            onClick={() => setShowSkillsMenu(true)}
            data-has-skillpoints={skillPoints > 0}
          >
            <FaUser />

            {skillPoints > 0 && (
              <div className="skill-points-indicator">{skillPoints}</div>
            )}
          </button>

          <div className="xp-display">
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

              <div className="xp-text">
                Level {level} • {experience}/{expForNextLevel} XP
              </div>
            </div>
          </div>

          <div className="money-display">
            <span>{money}</span>

            <span>🪙</span>
          </div>
        </div>
      </div>

      <div className="tower-groups">
        {Object.entries(towerGroups).map(([element, towers]) => (
          <div key={element} className="tower-group">
            <button
              className="element-preview"
              data-element={element}
              style={{ touchAction: "none" }}
              onTouchStart={() => {
                const expandedMenu = document.querySelector<HTMLElement>(
                  `[data-element="${element}"] + .tower-expanded`
                );
                if (expandedMenu) {
                  expandedMenu.style.opacity =
                    expandedMenu.style.opacity === "1" ? "0" : "1";
                  expandedMenu.style.visibility =
                    expandedMenu.style.visibility === "visible"
                      ? "hidden"
                      : "visible";
                }
              }}
            >
              {element === "water" && <GiWaterDrop />}
              {element === "fire" && <GiFireBowl />}
              {element === "ice" && <GiSnowflake1 />}
              {element === "nature" && <GiLeafSwirl />}
              {element === "storm" && <GiLightningStorm />}
              {element === "dark" && <GiSkullCrossedBones />}
              <span className="element-name">{element}</span>
            </button>

            <div className="tower-expanded">
              <div className="tower-buttons">
                {towers.map((tower) => (
                  <TowerButton
                    key={tower.type}
                    tower={tower}
                    element={element}
                    isSelected={selectedObjectType === tower.type}
                    canAfford={money >= tower.cost}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (
                        money >= tower.cost &&
                        selectedObjectType !== tower.type
                      ) {
                        setSelectedObjectType(tower.type, tower.level);

                        // Close expanded menu on touch devices

                        // if ('ontouchstart' in window) {

                        const expandedMenu = e.currentTarget
                          .closest(".tower-group")
                          ?.querySelector(".tower-expanded");

                        if (expandedMenu) {
                          expandedMenu.style.opacity = "0";

                          expandedMenu.style.visibility = "hidden";
                        }

                        // }
                      } else {
                        setSelectedObjectType(null);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showSkillsMenu && (
        <SkillsMenu
          isOpen={showSkillsMenu}
          onClose={() => setShowSkillsMenu(false)}
        />
      )}
    </div>
  );
}
