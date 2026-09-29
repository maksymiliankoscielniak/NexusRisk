import { useCallback, useEffect, useState } from "react";
import { PortfolioProvider } from "./state/PortfolioContext";
import { Sidebar, type NavItem } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { HoldingsMatrix } from "./components/HoldingsMatrix";
import { StressTester } from "./components/StressTester";
import { MonteCarloPanel } from "./components/MonteCarloPanel";
import { AiAnalyst } from "./components/AiAnalyst";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { PortfolioCustomizer } from "./components/PortfolioCustomizer";
import "./App.css";

const NAV_ITEMS: NavItem[] = [
  { id: "sec-overview",    label: "Overview",     num: "01" },
  { id: "sec-holdings",    label: "Holdings",     num: "02" },
  { id: "sec-stress",      label: "Stress Test",  num: "03" },
  { id: "sec-monte-carlo", label: "Monte Carlo",  num: "04" },
  { id: "sec-ai-analyst",  label: "AI Analyst",   num: "05" },
];

const INTERACTIVE = "button, a, input, label, select, [role='button'], [role='tab']";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function useCursorTracking() {
  useEffect(() => {
    const dot  = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let rafId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      document.documentElement.style.setProperty("--cx", `${mx}px`);
      document.documentElement.style.setProperty("--cy", `${my}px`);
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const target = e.target as Element | null;
      document.body.classList.toggle("cursor--hover", !!target?.closest(INTERACTIVE));
    };

    const animate = () => {
      rx = lerp(rx, mx, 0.11);
      ry = lerp(ry, my, 0.11);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    rafId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.classList.remove("cursor--hover");
    };
  }, []);
}

function Dashboard() {
  const [activeSection, setActiveSection] = useState("sec-overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  useCursorTracking();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  }, []);

  return (
    <>
      {/* Background layers */}
      <ParticleCanvas />
      <div className="aurora" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="bg-pattern"    aria-hidden="true" />
      <div className="bg-vignette"   aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      <div id="spotlight"            aria-hidden="true" />
      <div className="scan-line"     aria-hidden="true" />

      {/* Custom cursor */}
      <div id="cursor-dot"  aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />

      {/* App shell */}
      <div className={`app-root${sidebarOpen ? " sidebar-is-open" : ""}`}>
        <Sidebar
          items={NAV_ITEMS}
          activeSection={activeSection}
          onNavigate={scrollToSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        <div className="content-area">
          <div className="mobile-topbar">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </button>
            <div className="mobile-brand">NexusRisk</div>
          </div>

          <div id="sec-overview"    className="page-section"><Overview /></div>
          <div id="sec-holdings"    className="page-section"><HoldingsMatrix /></div>
          <div id="sec-stress"      className="page-section"><StressTester /></div>
          <div id="sec-monte-carlo" className="page-section"><MonteCarloPanel /></div>
          <div id="sec-ai-analyst"  className="page-section"><AiAnalyst /></div>

          <footer className="app-footer">
            <span>NexusRisk · AI Portfolio Macro &amp; Risk Intelligence</span>
            <span>All computations run in-browser. No data leaves your device.</span>
          </footer>
        </div>
      </div>

      {/* Global overlay: portfolio customizer drawer */}
      <PortfolioCustomizer />
    </>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <Dashboard />
    </PortfolioProvider>
  );
}
