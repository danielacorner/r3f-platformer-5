import { Billboard, Html } from "@react-three/drei";
import { FaTimes, FaCoins } from "react-icons/fa";
import "../styles/TowerSellMenu.css";

interface TowerSellMenuProps {
  onSell: () => void;
  onClose: () => void;
  sellValue: number;
}

export function TowerSellMenu({ onSell, onClose, sellValue }: TowerSellMenuProps) {
  const handleSellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSell();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <Billboard>
      <Html center position={[0, 2, 0]} className="tower-sell-menu-wrapper">
        <div className="tower-sell-menu">
          <button className="sell-btn" onClick={handleSellClick}>
            <FaCoins /> ${sellValue}
          </button>
          <button className="close-btn" onClick={handleCloseClick}>
            <FaTimes />
          </button>
        </div>
      </Html>
    </Billboard>
  );
}
