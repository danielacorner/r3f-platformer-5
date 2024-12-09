import { useRef } from "react";
import { Billboard, Html } from "@react-three/drei";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useGameStore } from "../../store/gameStore";
import { TOWER_TYPES } from "./BuildMenu";
import { FaCoins } from "react-icons/fa";
import { Tower } from "../towers/Tower";
import "../../styles/TowerConfirmation.css";

interface TowerConfirmationProps {
  position: [number, number, number];
  onConfirm: () => void;
  onCancel: () => void;
}

export function TowerConfirmation({
  position,
  onConfirm,
  onCancel,
}: TowerConfirmationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <group position={position}>
      <Billboard>
        <Html center transform position={[0, 2, 0]}>
          <div ref={containerRef} className="tower-confirmation-container">
            <div className="tower-confirmation">
              <button onClick={onConfirm} className="confirm-btn">
                <FaCheck /> Place
              </button>
              <button onClick={onCancel} className="cancel-btn">
                <FaTimes />
              </button>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

export function TowerConfirmationMobile() {
  const {
    showTowerConfirmation,
    selectedObjectType,
    money,
    pendingTowerPosition,
  } = useGameStore();
  const set = useGameStore.setState;

  if (!showTowerConfirmation || !selectedObjectType || !pendingTowerPosition)
    return null;

  const tower = Object.values(TOWER_TYPES).find(
    (t) => t.type === selectedObjectType
  );
  if (!tower) return null;

  const handleConfirm = () => {
    if (money >= tower.cost) {
      set((state) => ({
        money: state.money - tower.cost,
        placedTowers: [
          ...state.placedTowers,
          {
            position: pendingTowerPosition,
            type: selectedObjectType,
            level: state.selectedObjectLevel || 1,
            id: Math.random().toString(),
          },
        ],
        showTowerConfirmation: false,
        pendingTowerPosition: null,
        selectedObjectType: null,
      }));
    }
  };

  const handleCancel = () => {
    set({ showTowerConfirmation: false, pendingTowerPosition: null });
  };

  return (
    <>
      {/* Preview Tower */}
      <group
        position={[
          pendingTowerPosition.x,
          pendingTowerPosition.y,
          pendingTowerPosition.z,
        ]}
      >
        <Tower
          position={[0, 0, 0]}
          type={selectedObjectType}
          level={1}
          id="preview"
          opacity={0.6}
          isPreview
        />
      </group>

      {/* Confirmation Dialog */}
      <div className="tower-confirmation">
        <div className="confirmation-content">
          <div className="tower-info">
            <div className="tower-icon">{tower.icon}</div>
            <div className="tower-details">
              <div className="tower-name">{tower.label}</div>
              <div className="tower-cost">
                <FaCoins className="text-yellow-400" />
                <span>{tower.cost}</span>
              </div>
            </div>
          </div>
          <div className="confirmation-buttons">
            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={money < tower.cost}
            >
              Place Tower
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
