import React, { useRef } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/TowerConfirmation.css';

interface TowerConfirmationProps {
  position: [number, number, number];
  onConfirm: () => void;
  onCancel: () => void;
}

export function TowerConfirmation({ position, onConfirm, onCancel }: TowerConfirmationProps) {
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
