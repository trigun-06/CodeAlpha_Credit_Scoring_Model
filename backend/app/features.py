# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

"""Inference-time feature engineering.

Mirrors `engineer_financial_features` in model/train.py exactly (minus the
print statements). The saved .pkl only contains preprocessing + classifier,
so these derived columns MUST be rebuilt before calling the pipeline.
tests/test_features.py checks parity against train.py.
"""
import numpy as np
import pandas as pd

RAW_FIELDS = [
    "annual_income",
    "total_debt",
    "net_worth",
    "missed_payments_24m",
    "credit_score",
]


def build_frame(records: list[dict]) -> pd.DataFrame:
    """Raw applicant dicts -> the exact columns the pipeline was trained on."""
    df = pd.DataFrame(records)[RAW_FIELDS].astype(float)

    income = df["annual_income"].replace(0, np.nan)
    # The training CSV ships a precomputed `debt_to_income` column (rounded to
    # 3 dp); the model was trained on it, so we derive it the same way.
    df["debt_to_income"] = (df["total_debt"] / income).fillna(0).round(3)

    df["fe_debt_to_income"] = (df["total_debt"] / income).fillna(0)
    df["fe_debt_to_networth"] = df["total_debt"] / (df["net_worth"].abs() + 1.0)
    df["fe_networth_to_income"] = (df["net_worth"] / income).fillna(0)
    df["fe_missed_payment_rate"] = df["missed_payments_24m"] / 24.0
    df["fe_credit_score_normalized"] = (df["credit_score"] - 300) / 550.0
    return df
