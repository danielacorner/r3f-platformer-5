import { Billboard, Html } from "@react-three/drei";
import { FaCheck, FaTimes } from "react-icons/fa";
import "../styles/TowerSellMenu.css";

interface TowerSellMenuProps {
  onSell: () => void;
  onClose: () => void;
  sellValue: number;
}

export function TowerSellMenu({ onSell, onClose, sellValue }: TowerSellMenuProps) {
  return (
    <Billboard>
      <Html center position={[0, 2, 0]} className="tower-sell-menu-wrapper">
        <div className="tower-sell-menu">
          <button className="sell-btn" onClick={onSell}>
            <FaCheck /> ${sellValue}
          </button>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </Html>
    </Billboard>
  );
}
