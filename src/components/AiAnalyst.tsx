import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "../state/PortfolioContext";
import { SectionLabel } from "./SectionLabel";
import type { AnalystReport } from "../types";

function composeText(r: AnalystReport): string {
  const v = r.vulnerabilities.map((x) => `• [${x.severity}] ${x.title}\n  ${x.detail}`).join("\n\n");
  const h = r.hedges.map((x, i) => `${String(i+1).padStart(2,"0")} ${x.title}\n   ${x.detail}`).join("\n\n");
  return [r.headline,"",r.thesis,"",`POSTURE: ${r.posture}`,"","── VULNERABILITY BREAKDOWN ──────────────────",v,"","── HEDGING PLAYBOOK ─────────────────────────",h].join("\n");
}

function postureClass(p: string): "defensive"|"selective"|"constructive" {
  if (p.startsWith("Defensive")) return "defensive";
  if (p.startsWith("Selective")) return "selective";
  return "constructive";
}

function ReloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.48 4.48 0 0 1 3.18 1.32L8.5 4.5H11V2L9.88 3.12A5.5 5.5 0 1 0 12 6.5h-1Z" fill="currentColor"/>
    </svg>
  );
}

function StructuredReport({ report }: { report: AnalystReport }) {
  const pc = postureClass(report.posture);
  return (
    <div>
      <h3 className="report-headline">{report.headline}</h3>
      <p className="report-thesis">{report.thesis}</p>
      <div className={`posture-pill ${pc}`}>{report.posture}</div>

      <div className="report-section-title">Vulnerability breakdown</div>
      <div className="vuln-list">
        {report.vulnerabilities.map((item) => (
          <div key={item.title} className="vuln-card">
            <div className="vuln-card-header">
              <span className="vuln-card-title">{item.title}</span>
              <span className={`sev-badge ${item.severity}`}>{item.severity}</span>
            </div>
            <p className="vuln-detail">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="report-section-title">Hedging playbook</div>
      <div className="hedge-list">
        {report.hedges.map((item, idx) => (
          <div key={item.title} className="hedge-card">
            <div className="hedge-num">{String(idx+1).padStart(2,"0")}</div>
            <div>
              <div className="hedge-title">{item.title}</div>
              <p className="hedge-detail">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiAnalyst() {
  const { report, reportNonce, reevaluateReport, scenario } = usePortfolio();
  const [streaming, setStreaming] = useState(true);
  const [cursor, setCursor]       = useState(0);

  const fullText = useMemo(() => composeText(report), [report]);

  useEffect(() => {
    setCursor(streaming ? 0 : fullText.length);
  }, [fullText, reportNonce, streaming]);

  useEffect(() => {
    if (!streaming || cursor >= fullText.length) return;
    const id = window.setTimeout(() => setCursor((c) => Math.min(fullText.length, c + 4)), 10);
    return () => window.clearTimeout(id);
  }, [streaming, cursor, fullText]);

  const visible = streaming ? fullText.slice(0, cursor) : fullText;
  const done    = cursor >= fullText.length;

  return (
    <section aria-labelledby="ai-heading">
      <SectionLabel
        num="05"
        title="AI Macro Analyst"
        description={`Evaluating current portfolio under: ${scenario.name}. Re-run after adjusting weights or switching scenarios.`}
      />

      <div className="terminal-window">
        {/* Title bar */}
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="terminal-dot terminal-dot--red"    aria-hidden="true" />
            <span className="terminal-dot terminal-dot--yellow" aria-hidden="true" />
            <span className="terminal-dot terminal-dot--green"  aria-hidden="true" />
          </div>
          <div className="terminal-titlebar-text">
            AI MACRO ANALYST v2.1 · {scenario.name.toUpperCase()}
          </div>
        </div>

        {/* Body */}
        <div className="terminal-body">
          <div className="report-toolbar">
            <label className="streaming-toggle">
              <input
                type="checkbox"
                checked={streaming}
                onChange={(e) => setStreaming(e.target.checked)}
                id="streaming-toggle-input"
              />
              Streaming animation
            </label>
            <button type="button" className="btn btn-ghost" onClick={reevaluateReport} id="reevaluate-btn">
              <ReloadIcon />
              Re-evaluate book
            </button>
          </div>

          {streaming && !done ? (
            <div className="report-streaming-view" role="status" aria-live="polite">
              {visible}<span className="cursor-blink" aria-hidden="true">▍</span>
            </div>
          ) : (
            <StructuredReport report={report} />
          )}
        </div>
      </div>
    </section>
  );
}
