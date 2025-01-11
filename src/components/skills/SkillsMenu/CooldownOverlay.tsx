interface CooldownOverlayProps {
  remainingTime: number;
  totalTime: number;
  color: string;
}

export function CooldownOverlay({ remainingTime, totalTime, color }: CooldownOverlayProps) {
  const progress = remainingTime / totalTime;
  const angle = 360 - (progress * 360);

  const conicGradient = `conic-gradient(
    rgba(0, 0, 0, 0.2) ${angle}deg,
    rgba(0, 0, 0, 0.5) ${angle}deg
  )`;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="conic-gradient w-full h-full rounded-lg"
        style={{
          background: conicGradient,
        }}
      />
      <div className="absolute text-white font-bold text-lg">
        {Math.ceil(remainingTime)}
      </div>
    </div>
  );
}
