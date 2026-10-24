/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import { useState, type FormEvent } from "react";
import { predict } from "../api";
import type { Applicant, Prediction } from "../types";

interface SampleItem {
  applicant: Applicant;
  icon: string;
  badge: string;
}

const SAMPLES: Record<string, SampleItem> = {
  "Strong profile": {
    applicant: { full_name: "Sample Strong", annual_income: 115000, total_debt: 18500, net_worth: 221500, missed_payments_24m: 0, credit_score: 795 },
    icon: "✨",
    badge: "Low Risk",
  },
  "Borderline profile": {
    applicant: { full_name: "Sample Borderline", annual_income: 64000, total_debt: 27500, net_worth: 24500, missed_payments_24m: 2, credit_score: 620 },
    icon: "⚖️",
    badge: "Moderate Risk",
  },
  "High-risk profile": {
    applicant: { full_name: "Sample Risky", annual_income: 28000, total_debt: 22100, net_worth: -17600, missed_payments_24m: 6, credit_score: 495 },
    icon: "⚠️",
    badge: "High Risk",
  },
};

const EMPTY = { full_name: "", annual_income: "", total_debt: "", net_worth: "", missed_payments_24m: "", credit_score: "" };
type FormState = typeof EMPTY;

const FIELDS: { key: keyof FormState; label: string; hint: string; min?: number; max?: number; prefix?: string; suffix?: string }[] = [
  { key: "annual_income", label: "Annual Income", hint: "Gross yearly income", min: 0, prefix: "$" },
  { key: "total_debt", label: "Total Debt", hint: "Loans, credit cards, mortgages", min: 0, prefix: "$" },
  { key: "net_worth", label: "Net Worth", hint: "Assets minus liabilities (can be negative)", prefix: "$" },
  { key: "missed_payments_24m", label: "Missed Payments (24m)", hint: "Count over past 24 months", min: 0, max: 24, suffix: "times" },
  { key: "credit_score", label: "Credit Score", hint: "FICO range 300 to 850", min: 300, max: 850, suffix: "pts" },
];

export default function PredictForm({ onResult }: { onResult: (r: Prediction) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);

  const fill = (name: string, a: Applicant) => {
    setActiveSample(name);
    setForm({
      full_name: a.full_name ?? "",
      annual_income: String(a.annual_income),
      total_debt: String(a.total_debt),
      net_worth: String(a.net_worth),
      missed_payments_24m: String(a.missed_payments_24m),
      credit_score: String(a.credit_score),
    });
  };

  const handleInputChange = (key: keyof FormState, value: string) => {
    setActiveSample(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Applicant = {
        full_name: form.full_name.trim() || undefined,
        annual_income: Number(form.annual_income),
        total_debt: Number(form.total_debt),
        net_worth: Number(form.net_worth),
        missed_payments_24m: Number(form.missed_payments_24m),
        credit_score: Number(form.credit_score),
      };
      onResult(await predict(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while scoring");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <div className="card-header-row">
        <div>
          <h2>Applicant Assessment</h2>
          <p className="card-subtitle">Test credit eligibility using AI scoring parameters</p>
        </div>
      </div>

      <div className="presets-block">
        <span className="presets-title">Quick preset profiles:</span>
        <div className="chips">
          {Object.entries(SAMPLES).map(([label, item]) => (
            <button
              type="button"
              key={label}
              className={`chip ${activeSample === label ? "chip-active" : ""}`}
              onClick={() => fill(label, item.applicant)}
              title={`Load ${label}`}
            >
              <span className="chip-icon">{item.icon}</span>
              <span className="chip-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-fields">
        <label className="field-group">
          <span className="field-label">Applicant Name (optional)</span>
          <div className="input-wrap">
            <input
              placeholder="e.g. Jane Doe"
              value={form.full_name}
              maxLength={100}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
            />
          </div>
        </label>

        {FIELDS.map((f) => (
          <label key={f.key} className="field-group">
            <span className="field-label">{f.label}</span>
            <div className="input-wrap">
              {f.prefix && <span className="input-adornment prefix">{f.prefix}</span>}
              <input
                type="number"
                required
                step="1"
                min={f.min}
                max={f.max}
                placeholder="0"
                className={f.prefix ? "has-prefix" : f.suffix ? "has-suffix" : ""}
                value={form[f.key]}
                onChange={(e) => handleInputChange(f.key, e.target.value)}
              />
              {f.suffix && <span className="input-adornment suffix">{f.suffix}</span>}
            </div>
            <small className="field-hint">{f.hint}</small>
          </label>
        ))}
      </div>

      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button className="primary submit-btn" disabled={loading}>
        {loading ? (
          <span className="btn-loading">
            <span className="btn-spinner" />
            <span>Evaluating Creditworthiness…</span>
          </span>
        ) : (
          <span className="btn-content">
            <span>Assess Creditworthiness</span>
            <span className="btn-arrow">→</span>
          </span>
        )}
      </button>
    </form>
  );
}
