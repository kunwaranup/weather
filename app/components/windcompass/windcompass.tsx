"use client";

interface WindCompassProps {
  speed: number;
  direction: number;
  unit: string;
}

const CARDINAL_LABELS = ["N", "E", "S", "W"] as const;

export default function WindCompass({ speed, direction, unit }: WindCompassProps) {
  return (
    <div className="wind-compass">
      <svg
        viewBox="0 0 72 72"
        role="img"
        aria-label={`Wind from ${Math.round(direction)} degrees at ${speed} ${unit}`}
      >
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--hairline)" strokeWidth="1" />
        <circle cx="36" cy="36" r="24" fill="none" stroke="var(--hairline)" strokeWidth="1" />
        {CARDINAL_LABELS.map((label, i) => {
          const angle = i * 90 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 36 + 29 * Math.cos(rad);
          const y = 36 + 29 * Math.sin(rad);
          return (
            <text key={label} x={x} y={y + 3} textAnchor="middle" className="compass-tick">
              {label}
            </text>
          );
        })}
        <g transform={`rotate(${direction}, 36, 36)`}>
          <line x1="36" y1="36" x2="36" y2="14" stroke="var(--amber-400)" strokeWidth="2" strokeLinecap="round" />
          <polygon points="36,8 31,18 41,18" fill="var(--amber-400)" />
        </g>
        <circle cx="36" cy="36" r="3" fill="var(--cloud-50)" />
        <style>{`
          .compass-tick {
            font-family: var(--font-mono);
            font-size: 8px;
            fill: var(--slate-400);
          }
        `}</style>
      </svg>
      <div className="wind-reading">
        <span className="wind-value">{Math.round(speed)}</span>
        <span className="wind-unit">{unit}</span>
      </div>
    </div>
  );
}