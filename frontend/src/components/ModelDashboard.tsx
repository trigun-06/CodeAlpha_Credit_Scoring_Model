/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import { useEffect, useState } from "react";
import { getModelInfo } from "../api";
import type { ModelInfo } from "../types";

/**
 * Transforms raw snake_case feature keys into human-readable Title Case strings.
 * Replaces all underscores with spaces and capitalizes the first letter of each word.
 * E.g., 'annual_income' -> 'Annual Income', 'fe_credit_score_normalized' -> 'Fe Credit Score Normalized'
 */
function formatFeatureName(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats model class name into spaced human readable name.
 * E.g. 'RandomForestClassifier' -> 'Random Forest Classifier'
 */
function formatModelName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function ModelDashboard() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getModelInfo().then(setInfo).catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="card error-alert">
        <span className="error-icon">⚠️</span>
        <div>
          <strong>Failed to load model diagnostics</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="card loading-card">
        <div className="spinner" />
        <p>Loading model performance telemetry…</p>
      </div>
    );
  }

  const holdout = info.metrics.holdout ?? [];
  const cms = info.metrics.confusion_matrices ?? {};
  const maxImp = Math.max(...info.feature_importance.map((f) => f.importance), 0.0001);
  const cols = ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"] as const;

  return (
    <div className="stack">
      <div className="card model-hero-card">
        <div className="model-hero-header">
          <div>
            <div className="pill-tag">Production Engine</div>
            <h2>Deployed Model: {formatModelName(info.model)}</h2>
          </div>
          <div className="model-stats-pills">
            <div className="stat-pill">
              <span className="stat-num">{info.metrics.dataset_rows ?? 200}</span>
              <span className="stat-label">Training Records</span>
            </div>
            <div className="stat-pill highlight">
              <span className="stat-num">≥ {(info.thresholds.approve_at * 100).toFixed(0)}%</span>
              <span className="stat-label">Auto-Approve Cutoff</span>
            </div>
            <div className="stat-pill danger">
              <span className="stat-num">&lt; {(info.thresholds.deny_below * 100).toFixed(0)}%</span>
              <span className="stat-label">Auto-Deny Cutoff</span>
            </div>
          </div>
        </div>
        <p className="card-subtitle">
          Inference operates on calibrated probability thresholds. Applicants falling between{" "}
          {(info.thresholds.deny_below * 100).toFixed(0)}% and {(info.thresholds.approve_at * 100).toFixed(0)}% are routed to manual credit underwriter review.
        </p>
      </div>

      {holdout.length > 0 && (
        <div className="card">
          <div className="card-header-row">
            <div>
              <h2>Holdout Evaluation (30% Test Split)</h2>
              <p className="card-subtitle">Benchmark performance against competing classification architectures</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Model Architecture</th>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdout.map((row) => {
                  const isCurrent = row.Model.toLowerCase().includes("random") || row.Model === info.model;
                  return (
                    <tr key={row.Model} className={isCurrent ? "row-highlight" : ""}>
                      <td>
                        <strong>{row.Model}</strong>
                        {isCurrent && <span className="best-badge">Active Best</span>}
                      </td>
                      {cols.map((c) => (
                        <td key={c} className="numeric-col">
                          {row[c].toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header-row">
            <div>
              <h2>Feature Importance</h2>
              <p className="card-subtitle">Relative weight contribution in Random Forest decision trees</p>
            </div>
          </div>
          <div className="importance-list">
            {info.feature_importance.map((f, i) => {
              const formattedName = formatFeatureName(f.feature);
              return (
                <div key={f.feature} className="bar-row">
                  <span className="bar-label" title={formattedName}>
                    {formattedName}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(f.importance / maxImp) * 100}%`,
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  </div>
                  <span className="bar-val">{(f.importance * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <div>
              <h2>Confusion Matrices</h2>
              <p className="card-subtitle">Classification breakdown of test ground truth vs predictions</p>
            </div>
          </div>
          <div className="cm-list">
            {Object.entries(cms).map(([name, m]) => (
              <div key={name} className="cm-box">
                <div className="cm-title">{name}</div>
                <div className="cm-grid">
                  <div className="cm-cell good" title="True Negative: Risky borrower correctly denied">
                    <span className="cm-cell-label">True Negative</span>
                    <span className="cm-cell-val">{m.tn}</span>
                  </div>
                  <div className="cm-cell bad" title="False Positive: Risky borrower erroneously approved">
                    <span className="cm-cell-label">False Positive</span>
                    <span className="cm-cell-val">{m.fp}</span>
                  </div>
                  <div className="cm-cell bad" title="False Negative: Creditworthy borrower erroneously denied">
                    <span className="cm-cell-label">False Negative</span>
                    <span className="cm-cell-val">{m.fn}</span>
                  </div>
                  <div className="cm-cell good" title="True Positive: Creditworthy borrower correctly approved">
                    <span className="cm-cell-label">True Positive</span>
                    <span className="cm-cell-val">{m.tp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="muted small cm-note">
            Note: False Positives represent costly underwriting risk (default exposure), while False Negatives represent missed revenue opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
