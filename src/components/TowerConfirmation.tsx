import React from 'react';
import { Html } from '@react-three/drei';
import { FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/TowerConfirmation.css';

interface TowerConfirmationProps {
  position: [number, number, number];
  onConfirm: () => void;
  onCancel: () => void;
}

export function TowerConfirmation({ position, onConfirm, onCancel }: TowerConfirmationProps) {
  return (
    <group position={position}>
      <Html center position={[0, 2, 0]} className="tower-confirmation-container">
        <div className="tower-confirmation">
          <button onClick={onConfirm} className="confirm-btn">
            <FaCheck /> Place
          </button>
          <button onClick={onCancel} className="cancel-btn">
            <FaTimes />
          </button>
        </div>
      </Html>
    </group>
  );
}
