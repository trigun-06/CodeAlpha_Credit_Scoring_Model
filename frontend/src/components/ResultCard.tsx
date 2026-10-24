/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import type { Prediction } from "../types";

function Gauge({ value, decision }: { value: number; decision: string }) {
  // Semicircle gauge: arc length is proportional to probability
  const r = 80;
  const len = Math.PI * r;
  const pct = Math.round(value * 100);

  // Gradient ID and color choices
  const gradId = `gauge-grad-${decision.toLowerCase()}`;

  return (
    <div className="gauge-container">
      <svg viewBox="0 0 200 120" className="gauge" role="img" aria-label={`Creditworthiness probability ${pct}%`}>
        <defs>
          <linearGradient id="gauge-grad-approve" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gauge-grad-review" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="gauge-grad-deny" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="gauge-track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--line)" />
            <stop offset="100%" stopColor="var(--line)" />
          </linearGradient>
        </defs>

        <path d="M20 100 A80 80 0 0 1 180 100" className="gauge-track" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          className="gauge-fill"
          stroke={`url(#${gradId})`}
          strokeDasharray={`${len * value} ${len}`}
        />

        <text x="100" y="86" textAnchor="middle" className="gauge-num">
          {pct}%
        </text>
        <text x="100" y="104" textAnchor="middle" className="gauge-sublabel">
          Approval Probability
        </text>
      </svg>
    </div>
  );
}

export default function ResultCard({ result }: { result: Prediction | null }) {
  if (!result) {
    return (
      <div className="card result-card empty-result">
        <div className="empty-content">
          <div className="empty-icon-wrap">
            <span className="empty-icon">📊</span>
          </div>
          <h2>Ready to Evaluate</h2>
          <p className="empty-text">
            Choose one of the sample profiles above or customize the applicant numbers to compute an instant ML risk verdict.
          </p>
          <div className="empty-hint-pills">
            <span className="hint-pill">⚡ Instant Scoring</span>
            <span className="hint-pill">🛡️ Risk Tier Analysis</span>
            <span className="hint-pill">🔍 Key Drivers</span>
          </div>
        </div>
      </div>
    );
  }

  const cls = result.decision.toLowerCase();
  const decisionIcons: Record<string, string> = {
    approve: "✓",
    review: "!",
    deny: "✕",
  };

  return (
    <div className="card result-card result-active">
      <div className="result-header">
        <h2>Decision Verdict</h2>
        <span className="result-timestamp">Real-time inference</span>
      </div>

      <Gauge value={result.probability} decision={result.decision} />

      <div className="verdict-section">
        <div className={`badge ${cls} pulse-badge`}>
          <span className="badge-icon">{decisionIcons[cls] ?? "•"}</span>
          <span>{result.decision}</span>
        </div>
        <p className="risk-band-text">
          <span className="risk-band-label">Risk Classification:</span>{" "}
          <strong className="risk-band-value">{result.risk_band}</strong>
        </p>
      </div>

      <div className="factors-section">
        <h3>Primary Risk Drivers</h3>
        <ul className="factors">
          {result.factors.map((f, i) => (
            <li
              key={f.label}
              className={`factor-item ${f.impact}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="factor-bullet" aria-hidden="true">
                {f.impact === "positive" ? "✓" : "!"}
              </span>
              <div className="factor-body">
                <span className="factor-label">{f.label}</span>
                <span className="factor-detail">{f.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="factors-footnote">
        Rule-of-thumb heuristic indicators shown for quick operational context, supplementing the underlying ensemble model.
      </p>
    </div>
  );
}
