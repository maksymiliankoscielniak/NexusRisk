import { useCallback, useRef } from "react";
import type { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string;
  /** Disable the 3D perspective tilt (use on cards containing charts) */
  disableTilt?: boolean;
}

export function GlowCard({ children, className = "", style, padding = "22px 24px 26px", disableTilt = false }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Border glow + shimmer always track cursor
    el.style.setProperty("--gx", `${x}px`);
    el.style.setProperty("--gy", `${y}px`);
    // 3D tilt only when enabled
    if (!disableTilt) {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      el.style.setProperty("--rotx", `${((y - cy) / cy) * -3}deg`);
      el.style.setProperty("--roty", `${((x - cx) / cx) * 3}deg`);
    }
  }, [disableTilt]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rotx", "0deg");
    el.style.setProperty("--roty", "0deg");
  }, []);

  return (
    <div
      ref={ref}
      className={`glow-card ${className}`}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Gradient border layer */}
      <div className="glow-border" aria-hidden="true" />
      {/* Dark glass inner */}
      <div className="glow-inner" style={{ padding }}>
        {/* Internal shimmer layer */}
        <div className="glow-shimmer" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
