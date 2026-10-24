/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import type { Applicant, HistoryItem, ModelInfo, Prediction } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (Array.isArray(body.detail)) {
        msg = body.detail.map((d: { loc: string[]; msg: string }) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join("; ");
      } else if (body.detail) msg = String(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const predict = (a: Applicant) =>
  request<Prediction>("/api/predict", { method: "POST", body: JSON.stringify(a) });

export const getModelInfo = () => request<ModelInfo>("/api/model/info");

export const getHistory = (limit = 10) => request<HistoryItem[]>(`/api/history?limit=${limit}`);
