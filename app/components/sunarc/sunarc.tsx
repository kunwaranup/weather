"use client";

// Signature visual: draws the sunrise-to-sunset arc and marks where the
// sun sits right now.

interface SunArcProps {
  sunrise: string;
  sunset: string;
  now: string;
  isDay: boolean;
}

interface Point {
  x: number;
  y: number;
}

const P0: Point = { x: 16, y: 108 };
const P1: Point = { x: 140, y: 6 };
const P2: Point = { x: 264, y: 108 };

function pointOnArc(t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x,
    y: mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y,
  };
}

export default function SunArc({ sunrise, sunset, now, isDay }: SunArcProps) {
  const sunriseMs = new Date(sunrise).getTime();
  const sunsetMs = new Date(sunset).getTime();
  const nowMs = new Date(now).getTime();

  let progress = (nowMs - sunriseMs) / (sunsetMs - sunriseMs);
  progress = Math.min(1, Math.max(0, progress));

  const marker = pointOnArc(progress);
  const arcPath = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

  const fmtTime = (iso: string): string =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <svg
      viewBox="0 0 280 132"
      className="sun-arc"
      role="img"
      aria-label={`Sun position: ${isDay ? "daytime" : "nighttime"}, ${Math.round(progress * 100)}% through daylight hours`}
    >
      <defs>
        <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--slate-500)" />
          <stop offset="50%" stopColor="var(--amber-400)" />
          <stop offset="100%" stopColor="var(--slate-500)" />
        </linearGradient>
      </defs>

      <line
        x1={P0.x}
        y1={P0.y}
        x2={P2.x}
        y2={P2.y}
        stroke="var(--hairline)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      <path
        d={arcPath}
        fill="none"
        stroke="url(#arcGradient)"
        strokeWidth="1.5"
        opacity={isDay ? 1 : 0.35}
      />

      <circle
        cx={marker.x}
        cy={marker.y}
        r={isDay ? 6 : 4}
        fill={isDay ? "var(--amber-400)" : "var(--slate-400)"}
      />
      {isDay && (
        <circle cx={marker.x} cy={marker.y} r="11" fill="var(--amber-400)" opacity="0.18" />
      )}

      <text x={P0.x} y="128" className="sun-arc-label" textAnchor="start">
        {fmtTime(sunrise)}
      </text>
      <text x={P2.x} y="128" className="sun-arc-label" textAnchor="end">
        {fmtTime(sunset)}
      </text>

      <style>{`
        .sun-arc-label {
          font-family: var(--font-mono);
          font-size: 10px;
          fill: var(--slate-400);
        }
      `}</style>
    </svg>
  );
}