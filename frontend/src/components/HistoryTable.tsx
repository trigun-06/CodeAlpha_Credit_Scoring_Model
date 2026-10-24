/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import { useEffect, useState } from "react";
import { getHistory } from "../api";
import type { HistoryItem } from "../types";

export default function HistoryTable({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory(20).then(setRows).catch((e: Error) => setError(e.message));
  }, [refreshKey]);

  if (error) {
    return (
      <div className="card error-alert">
        <span className="error-icon">⚠️</span>
        <div>
          <strong>Unable to load assessment history</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="card loading-card">
        <div className="spinner" />
        <p>Retrieving historical assessments…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-row">
        <div>
          <h2>Recent Assessment Activity</h2>
          <p className="card-subtitle">Last 20 evaluated applicants stored in audit log</p>
        </div>
        <span className="history-count-badge">{rows.length} Records</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-history">
          <span className="empty-history-icon">📜</span>
          <p className="muted">No assessments on record yet. Run your first scoring in the Assess tab!</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Applicant Name</th>
                <th>Credit Score</th>
                <th>Annual Income</th>
                <th>Win Probability</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="history-row"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <td className="time-col">{r.created_at.replace("T", " ").slice(0, 16)}</td>
                  <td>
                    <strong>{r.full_name || "Anonymous Applicant"}</strong>
                  </td>
                  <td>
                    <span className="score-pill">{r.credit_score}</span>
                  </td>
                  <td className="numeric-col">${r.annual_income.toLocaleString()}</td>
                  <td className="numeric-col">{(r.probability * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`badge sm ${r.decision.toLowerCase()}`}>
                      {r.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
