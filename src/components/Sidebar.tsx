import type { JSX } from "react";

export interface NavItem {
  id: string;
  label: string;
  num: string;
}

interface SidebarProps {
  items: NavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function IconOverview() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="0.5" y="8.5" width="3" height="6" rx="1" fill="currentColor" opacity="0.55"/>
      <rect x="5.5" y="5" width="3" height="9.5" rx="1" fill="currentColor" opacity="0.8"/>
      <rect x="10.5" y="1.5" width="3" height="13" rx="1" fill="currentColor"/>
    </svg>
  );
}

function IconHoldings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 1a6.5 6.5 0 1 0 6.5 6.5H7.5V1Z" fill="currentColor" opacity="0.5"/>
      <path d="M9 1.6A6.5 6.5 0 0 1 14 7.5H9V1.6Z" fill="currentColor"/>
      <circle cx="7.5" cy="7.5" r="2.5" fill="var(--bg-1)"/>
    </svg>
  );
}

function IconStress() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M9 1L2.5 8.5H7L5.5 14 13 6H8.5L9 1Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  );
}

function IconMonteCarlo() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <polyline
        points="0.5,7.5 2.5,4 4.5,10 6.5,2.5 8.5,10.5 10.5,5 12.5,7.5 14.5,7.5"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAi() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="5.5" y="5.5" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
      <line x1="1" y1="5.5" x2="3.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="1" y1="9.5" x2="3.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="11.5" y1="5.5" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="11.5" y1="9.5" x2="14" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5.5" y1="1" x2="5.5" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="9.5" y1="1" x2="9.5" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5.5" y1="11.5" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="9.5" y1="11.5" x2="9.5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

const ICONS: Record<string, JSX.Element> = {
  "sec-overview":    <IconOverview />,
  "sec-holdings":    <IconHoldings />,
  "sec-stress":      <IconStress />,
  "sec-monte-carlo": <IconMonteCarlo />,
  "sec-ai-analyst":  <IconAi />,
};

export function Sidebar({ items, activeSection, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`} aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 10 10 18 2 10 10 2Z" fill="url(#logo-grad)" />
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00d4aa"/>
                <stop offset="1" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="logo-text">
          <div className="logo-name">NexusRisk</div>
          <div className="logo-tag">AI Portfolio Intelligence</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Sections">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item${isActive ? " nav-item--active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "location" : undefined}
            >
              <span className="nav-num">{item.num}</span>
              <span className="nav-icon">{ICONS[item.id]}</span>
              <span className="nav-label">{item.label}</span>
              {isActive && <span className="nav-active-pip" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Live computation</span>
        </div>
        <span className="sidebar-version">v1.0</span>
      </div>

      {/* Mobile close button */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </aside>
  );
}
