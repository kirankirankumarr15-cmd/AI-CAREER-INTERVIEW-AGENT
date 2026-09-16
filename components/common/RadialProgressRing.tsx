'use client';

interface RadialProgressRingProps {
  score: number;       // 0–100
  size?: number;       // SVG width/height in px (default 120)
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;      // stroke color (default indigo)
  trackColor?: string;
  className?: string;
}

export function RadialProgressRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = '#6366F1',
  trackColor = '#1F1F27',
  className = '',
}: RadialProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);
  const center = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="progress-ring"
        aria-label={`${score}% ${label || 'progress'}`}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-black text-[#FAFAFA] leading-none tabular-nums"
          style={{ fontSize: size * 0.175 }}>
          {score}%
        </span>
        {sublabel && (
          <span className="text-[#71717A] font-semibold leading-tight text-center"
            style={{ fontSize: size * 0.09, maxWidth: size * 0.65, lineHeight: 1.2 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
