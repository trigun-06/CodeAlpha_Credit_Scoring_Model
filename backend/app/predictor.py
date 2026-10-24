# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

"""Framework-free prediction service (no FastAPI import, so it is easy to test)."""
import json
from pathlib import Path

import joblib
import numpy as np

from .features import build_frame

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "credit_scoring_model.pkl"
METRICS_PATH = BASE_DIR / "model" / "metrics.json"

# Decision thresholds on P(creditworthy)
APPROVE_AT = 0.65
DENY_BELOW = 0.40


class CreditPredictor:
    def __init__(self, model_path: Path = MODEL_PATH):
        if not model_path.exists():
            raise FileNotFoundError(
                f"{model_path} not found. Run: python model/train.py data/finance.csv"
            )
        self.pipeline = joblib.load(model_path)
        self.model_name = type(self.pipeline.named_steps["classifier"]).__name__
        self.metrics = (
            json.loads(METRICS_PATH.read_text()) if METRICS_PATH.exists() else {}
        )

    # ---------- prediction ----------
    def predict(self, records: list[dict]) -> list[dict]:
        frame = build_frame(records)
        proba = self.pipeline.predict_proba(frame)[:, 1]
        out = []
        for rec, p in zip(records, proba):
            p = float(p)
            if p >= APPROVE_AT:
                decision = "APPROVE"
            elif p < DENY_BELOW:
                decision = "DENY"
            else:
                decision = "REVIEW"
            out.append(
                {
                    "creditworthy": p >= 0.5,
                    "probability": round(p, 4),
                    "decision": decision,
                    "risk_band": self._band(p),
                    "factors": self._factors(rec),
                }
            )
        return out

    @staticmethod
    def _band(p: float) -> str:
        if p >= 0.80:
            return "Low risk"
        if p >= 0.65:
            return "Moderate-low risk"
        if p >= 0.40:
            return "Moderate-high risk"
        return "High risk"

    @staticmethod
    def _factors(r: dict) -> list[dict]:
        """Plain-language rule-of-thumb flags to show next to the score.

        These are transparent heuristics, not model attributions.
        """
        f = []
        income = r["annual_income"] or 0
        dti = (r["total_debt"] / income) if income else 1.0

        def add(label, good, detail):
            f.append({"label": label, "impact": "positive" if good else "negative", "detail": detail})

        add("Credit score", r["credit_score"] >= 700, f"Score of {r['credit_score']}" + (" is strong" if r["credit_score"] >= 700 else " is below 700"))
        add("Missed payments", r["missed_payments_24m"] == 0, f"{r['missed_payments_24m']} missed in the last 24 months")
        add("Debt-to-income", dti <= 0.36, f"{dti:.0%} of income" + (" (healthy, 36% or less)" if dti <= 0.36 else " (above the 36% guideline)"))
        add("Net worth", r["net_worth"] > 0, "Positive net worth" if r["net_worth"] > 0 else "Negative net worth")
        return f

    # ---------- model info ----------
    def feature_importance(self) -> list[dict]:
        clf = self.pipeline.named_steps["classifier"]
        names = self.pipeline.named_steps["preprocessor"].get_feature_names_out()
        if hasattr(clf, "feature_importances_"):
            vals = clf.feature_importances_
        elif hasattr(clf, "coef_"):
            vals = np.abs(clf.coef_[0])
            vals = vals / vals.sum()
        else:
            return []
        pairs = sorted(
            ((n.split("__", 1)[-1], float(v)) for n, v in zip(names, vals)),
            key=lambda x: x[1],
            reverse=True,
        )
        return [{"feature": n, "importance": round(v, 4)} for n, v in pairs]

    def info(self) -> dict:
        return {
            "model": self.model_name,
            "thresholds": {"approve_at": APPROVE_AT, "deny_below": DENY_BELOW},
            "feature_importance": self.feature_importance(),
            "metrics": self.metrics,
        }
