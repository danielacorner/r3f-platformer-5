import { useGameStore } from '../store/gameStore';
import { animated, useSpring } from '@react-spring/web';

export const WaveIndicator = () => {
  const { currentWave, totalWaves, showWaveIndicator } = useGameStore();

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
          fontSize: '48px', 
          opacity: 0.8, 
          marginBottom: '20px',
          letterSpacing: '8px',
          fontWeight: 'normal',
        }}>
          Wave
        </div>
        <div style={{ 
          fontSize: '180px', 
          letterSpacing: '8px',
          fontWeight: 'normal',
          lineHeight: '1',
        }}>
          {currentWave} / {totalWaves}
        </div>
      </div>
    </animated.div>
  );
};
