# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

import contextlib
import io
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "model"))

from app.features import RAW_FIELDS, build_frame  # noqa: E402
from app.predictor import CreditPredictor  # noqa: E402

GOOD = dict(annual_income=115000, total_debt=18500, net_worth=221500, missed_payments_24m=0, credit_score=795)
BAD = dict(annual_income=28000, total_debt=22100, net_worth=-17600, missed_payments_24m=6, credit_score=495)


def _load_train():
    import train  # your creditscoremodel.py
    return train


def test_feature_parity_with_training_pipeline():
    train = _load_train()
    df = pd.read_csv(ROOT / "data" / "finance.csv")
    with contextlib.redirect_stdout(io.StringIO()):
        trained = train.engineer_financial_features(df.drop(columns=["creditworthy"]))
    mine = build_frame(df[RAW_FIELDS].to_dict("records"))
    cols = [c for c in trained.columns if c.startswith("fe_")] + ["debt_to_income"]
    for c in cols:
        assert np.allclose(trained[c], mine[c], atol=1e-3), f"mismatch in {c}"


def test_predictions_match_direct_pipeline_call():
    p = CreditPredictor()
    df = pd.read_csv(ROOT / "data" / "finance.csv")
    rows = df[RAW_FIELDS].to_dict("records")
    ours = [r["probability"] for r in p.predict(rows)]
    direct = p.pipeline.predict_proba(build_frame(rows))[:, 1]
    assert np.allclose(ours, direct, atol=1e-4)


def test_good_and_bad_applicants():
    p = CreditPredictor()
    good, bad = p.predict([GOOD, BAD])
    assert good["decision"] == "APPROVE" and good["creditworthy"]
    assert bad["decision"] == "DENY" and not bad["creditworthy"]
    assert good["probability"] > bad["probability"]


def test_zero_income_does_not_crash():
    p = CreditPredictor()
    r = p.predict([dict(GOOD, annual_income=0)])[0]
    assert 0.0 <= r["probability"] <= 1.0


def test_model_info_has_importances():
    info = CreditPredictor().info()
    assert info["feature_importance"], "expected feature importances"
    assert abs(sum(f["importance"] for f in info["feature_importance"]) - 1) < 0.01


if __name__ == "__main__":  # run without pytest: python tests/test_core.py
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)
