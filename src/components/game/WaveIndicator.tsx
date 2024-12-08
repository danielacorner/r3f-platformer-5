import { useGameStore } from '../store/gameStore';
import { animated, useSpring } from '@react-spring/web';
import { useEffect, useState } from 'react';

export const WaveIndicator = () => {
  const { currentWave, totalWaves, showWaveIndicator } = useGameStore();
  const [fontSize, setFontSize] = useState({ wave: '48px', number: '180px' });

  useEffect(() => {
    const updateFontSize = () => {
      const width = window.innerWidth;
      if (width < 480) { // Mobile
        setFontSize({ wave: '32px', number: '96px' });
      } else if (width < 768) { // Tablet
        setFontSize({ wave: '40px', number: '140px' });
      } else { // Desktop
        setFontSize({ wave: '48px', number: '180px' });
      }
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    return () => window.removeEventListener('resize', updateFontSize);
  }, []);

  const springs = useSpring({
    opacity: showWaveIndicator ? 1 : 0,
    scale: showWaveIndicator ? 1 : 0.8,
    config: { 
      tension: 200,
      friction: 20,
      duration: showWaveIndicator ? 300 : 2000
    }
  });

  if (!showWaveIndicator && springs.opacity.get() === 0) return null;

  return (
    <animated.div
      className="wave-indicator"
      style={{
        opacity: springs.opacity,
        transform: springs.scale.to(s => `scale(${s})`),
        position: 'fixed',
        top: "-25vh",
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10000,
      }}
    >
      <div>
        <div style={{ 
          fontSize: fontSize.wave, 
          opacity: 0.8, 
          marginBottom: '20px',
          letterSpacing: '0.2em',
          fontWeight: 'normal',
          textAlign: 'center',
        }}>
          Wave
        </div>
        <div style={{ 
          fontSize: fontSize.number, 
          letterSpacing: '0.1em',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {currentWave}/{totalWaves}
        </div>
      </div>
    </animated.div>
  );
};
