import type { FC } from "react";

// Animated neural-network brain. Drop-in replacement for the Globe component.
// Save as: components/ui/brain.tsx
const nodes = [
  { x: 70, y: 55 }, { x: 100, y: 45 }, { x: 130, y: 55 },
  { x: 55, y: 85 }, { x: 85, y: 80 }, { x: 115, y: 80 }, { x: 145, y: 85 },
  { x: 60, y: 120 }, { x: 90, y: 115 }, { x: 110, y: 115 }, { x: 140, y: 120 },
  { x: 80, y: 145 }, { x: 120, y: 145 },
];

const links: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 4], [4, 5], [5, 6], [3, 7], [4, 8], [5, 9], [6, 10],
  [7, 8], [8, 9], [9, 10], [7, 11], [8, 11], [9, 12], [10, 12], [11, 12],
];

const Brain: FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes brainFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes brainGlow { 0%,100% { filter: drop-shadow(0 0 6px rgba(59,130,246,0.35)); } 50% { filter: drop-shadow(0 0 18px rgba(59,130,246,0.8)); } }
          @keyframes nodePulse { 0%,100% { opacity: 0.35; r: 2.5; } 50% { opacity: 1; r: 4; } }
          @keyframes linkFlow { to { stroke-dashoffset: -24; } }
        `}
      </style>
      <div
        className="relative w-[250px] h-[250px]"
        style={{ animation: "brainFloat 5s ease-in-out infinite" }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ animation: "brainGlow 3s ease-in-out infinite" }}
        >
          <defs>
            <linearGradient id="brainStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>

          {/* Left hemisphere */}
          <path
            d="M100 30 C70 20 40 35 35 65 C20 75 18 100 30 112 C25 135 45 155 70 152 C80 165 95 168 100 160 Z"
            fill="rgba(59,130,246,0.08)"
            stroke="url(#brainStroke)"
            strokeWidth="2"
          />
          {/* Right hemisphere */}
          <path
            d="M100 30 C130 20 160 35 165 65 C180 75 182 100 170 112 C175 135 155 155 130 152 C120 165 105 168 100 160 Z"
            fill="rgba(59,130,246,0.08)"
            stroke="url(#brainStroke)"
            strokeWidth="2"
          />
          {/* Brain folds */}
          <path d="M45 70 C60 60 75 70 70 85" fill="none" stroke="#60a5fa" strokeOpacity="0.4" strokeWidth="1.2" />
          <path d="M155 70 C140 60 125 70 130 85" fill="none" stroke="#60a5fa" strokeOpacity="0.4" strokeWidth="1.2" />
          <path d="M40 110 C55 100 70 112 65 128" fill="none" stroke="#60a5fa" strokeOpacity="0.4" strokeWidth="1.2" />
          <path d="M160 110 C145 100 130 112 135 128" fill="none" stroke="#60a5fa" strokeOpacity="0.4" strokeWidth="1.2" />

          {/* Neural connections */}
          {links.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x} y1={nodes[a].y}
              x2={nodes[b].x} y2={nodes[b].y}
              stroke="#60a5fa"
              strokeOpacity="0.7"
              strokeWidth="1"
              strokeDasharray="4 8"
              style={{ animation: `linkFlow ${2 + (i % 4) * 0.5}s linear infinite` }}
            />
          ))}

          {/* Neurons */}
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x} cy={n.y} r="3"
              fill="#93c5fd"
              style={{ animation: `nodePulse ${1.8 + (i % 5) * 0.4}s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </svg>
      </div>
    </>
  );
};

export default Brain;
