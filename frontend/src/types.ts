/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

export interface Applicant {
  full_name?: string;
  annual_income: number;
  total_debt: number;
  net_worth: number;
  missed_payments_24m: number;
  credit_score: number;
}

export interface Factor {
  label: string;
  impact: "positive" | "negative";
  detail: string;
}

export interface Prediction {
  creditworthy: boolean;
  probability: number;
  decision: "APPROVE" | "REVIEW" | "DENY";
  risk_band: string;
  factors: Factor[];
}

export interface MetricRow {
  Model: string;
  Accuracy: number;
  Precision: number;
  Recall: number;
  "F1-Score": number;
  "ROC-AUC": number;
}

export interface ModelInfo {
  model: string;
  thresholds: { approve_at: number; deny_below: number };
  feature_importance: { feature: string; importance: number }[];
  metrics: {
    dataset_rows?: number;
    holdout?: MetricRow[];
    confusion_matrices?: Record<string, { tn: number; fp: number; fn: number; tp: number }>;
  };
}

export interface HistoryItem {
  id: number;
  created_at: string;
  full_name: string | null;
  credit_score: number;
  annual_income: number;
  probability: number;
  decision: string;
}
