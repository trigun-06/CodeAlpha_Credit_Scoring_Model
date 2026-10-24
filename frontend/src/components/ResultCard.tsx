/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import type { Prediction } from "../types";
import evalIllustration from "../assets/credit-eval-illustration.svg";

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
          <div className="empty-header-block">
            <div className="empty-icon-wrap">
              <span className="empty-icon">💳</span>
            </div>
            <h2>Credit Assessment Hub</h2>
            <p className="empty-text">
              Enter applicant financials on the left or select a sample profile to evaluate real-time creditworthiness, FICO tier &amp; borrowing limit.
            </p>
            <div className="empty-hint-pills">
              <span className="hint-pill">💳 Prime Card Limits</span>
              <span className="hint-pill">📊 300-850 FICO Scale</span>
              <span className="hint-pill">⚡ Instant Approval Odds</span>
            </div>
          </div>

          {/* Animated Hero Credit Illustration */}
          <div className="empty-visual-container">
            <div className="ambient-pulse-aura" />
            <div className="satellite-pill satellite-tr">
              <span className="sat-dot pulse-emerald" />
              <span>795+ Prime FICO Tier</span>
            </div>
            <div className="satellite-pill satellite-bl">
              <span className="sat-icon">💳</span>
              <span>$35,000 Credit Line Approved</span>
            </div>
            <img
              src={evalIllustration}
              alt="Credit Assessment & Card Illustration"
              className="empty-illustration-img"
              loading="eager"
            />
          </div>

          {/* Animated Credit Score Spectrum (The 5 Official FICO Bands) */}
          <div className="credit-spectrum-card">
            <div className="spectrum-header">
              <span className="spectrum-title">Credit Score Spectrum</span>
              <span className="spectrum-badge">FICO Tiers (300 - 850)</span>
            </div>
            <div className="spectrum-track-wrap">
              <div className="spectrum-track">
                <div className="spectrum-segment poor" title="Poor (300-579)" />
                <div className="spectrum-segment fair" title="Fair (580-669)" />
                <div className="spectrum-segment good" title="Good (670-739)" />
                <div className="spectrum-segment very-good" title="Very Good (740-799)" />
                <div className="spectrum-segment exceptional" title="Exceptional (800-850)" />
              </div>
              <div className="spectrum-indicator">
                <div className="indicator-pin" />
                <div className="indicator-tag">795 &bull; Prime</div>
              </div>
            </div>
            <div className="spectrum-labels">
              <span>Poor (300)</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span className="label-highlight">Exceptional (850)</span>
            </div>
          </div>

          {/* Core Credit Health Pillars */}
          <div className="credit-factors-section">
            <div className="factors-header-row">
              <span className="factors-title">Key Credit Evaluation Pillars</span>
              <span className="factors-weight-badge">Weighted Scoring</span>
            </div>
            <div className="credit-factors-list">
              <div className="credit-factor-card">
                <div className="factor-top">
                  <span className="factor-name">
                    <span className="factor-emoji">💳</span> Payment History (35% weight)
                  </span>
                  <span className="factor-status good">100% On-Time</span>
                </div>
                <div className="credit-bar-track">
                  <div className="credit-bar-fill good" style={{ width: "98%" }} />
                </div>
                <span className="factor-meta">0 missed or delinquent payments in 24 months</span>
              </div>

              <div className="credit-factor-card">
                <div className="factor-top">
                  <span className="factor-name">
                    <span className="factor-emoji">📉</span> Credit Line Utilization (30% weight)
                  </span>
                  <span className="factor-status good">14% Used</span>
                </div>
                <div className="credit-bar-track">
                  <div className="credit-bar-fill good" style={{ width: "24%" }} />
                </div>
                <span className="factor-meta">Significantly below the recommended 30% risk ceiling</span>
              </div>

              <div className="credit-factor-card">
                <div className="factor-top">
                  <span className="factor-name">
                    <span className="factor-emoji">⚖️</span> Debt-To-Income Margin
                  </span>
                  <span className="factor-status good">18% DTI Ratio</span>
                </div>
                <div className="credit-bar-track">
                  <div className="credit-bar-fill warm" style={{ width: "32%" }} />
                </div>
                <span className="factor-meta">Strong free cashflow capacity for ongoing debt service</span>
              </div>
            </div>
          </div>

          {/* Prime Credit Advantage Perks */}
          <div className="credit-perks-bar">
            <span className="perk-star">★</span>
            <span>
              <strong>Prime Borrower Privileges:</strong> 0% Intro APR Eligible &bull; $35,000 Unsecured Credit Limit &bull; Zero Origination Fee
            </span>
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
