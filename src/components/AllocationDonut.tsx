import type { Holding } from "../types";
import { useEffect, useState } from "react";
import { formatPct } from "../engine/math";

interface AllocationDonutProps {
  holdings: Holding[];
}

export function AllocationDonut({ holdings }: AllocationDonutProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Re-trigger animation when holdings change significantly
  useEffect(() => {
    setAnimated(false);
    const t = window.setTimeout(() => setAnimated(true), 60);
    return () => window.clearTimeout(t);
  }, [holdings.map((h) => h.weight).join(",")]);

  const size = 220;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 2; // px gap between segments
  let offset = 0;

  const hovered = hoveredId ? holdings.find((h) => h.id === hoveredId) : null;

  return (
    <div className="donut-container">
      {/* SVG donut */}
      <div className="donut-wrap" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Asset allocation donut chart"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />
          {/* Segments */}
          {holdings.map((holding) => {
            const length = Math.max(0, circumference * holding.weight - gap);
            const dashOffset = -offset;
            const circle = (
              <circle
                key={holding.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={holding.color}
                strokeWidth={stroke}
                strokeDasharray={
                  animated ? `${length} ${circumference - length}` : `0 ${circumference}`
                }
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                opacity={hoveredId && hoveredId !== holding.id ? 0.3 : 1}
                style={{
                  transition: animated
                    ? `stroke-dasharray 0.75s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease`
                    : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredId(holding.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
            offset += circumference * holding.weight;
            return circle;
          })}
        </svg>

        {/* Center label */}
        <div className="donut-center">
          {hovered ? (
            <div>
              <div className="donut-center-val" style={{ color: hovered.color }}>
                {formatPct(hovered.weight, 1)}
              </div>
              <div className="donut-center-label">{hovered.name}</div>
            </div>
          ) : (
            <div>
              <div className="donut-center-val">100%</div>
              <div className="donut-center-label">Allocated NAV</div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="donut-legend">
        {holdings.map((holding) => (
          <div
            key={holding.id}
            className="legend-item"
            onMouseEnter={() => setHoveredId(holding.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              opacity: hoveredId && hoveredId !== holding.id ? 0.45 : 1,
              transition: "opacity 0.18s ease",
              cursor: "default",
            }}
          >
            <span
              className="legend-swatch"
              style={{ background: holding.color }}
              aria-hidden="true"
            />
            <span className="legend-name">{holding.name}</span>
            <span className="legend-pct">{formatPct(holding.weight, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
