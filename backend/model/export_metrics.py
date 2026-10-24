# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

"""Re-runs your evaluation (same split/seed as train.py) and writes metrics.json
for the dashboard. Usage (from backend/):  python model/export_metrics.py
"""
import contextlib
import io
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from sklearn.model_selection import train_test_split  # noqa: E402

import train  # noqa: E402  (your creditscoremodel.py)

csv_path = HERE.parent / "data" / "finance.csv"

with contextlib.redirect_stdout(io.StringIO()):  # silence train.py prints
    X_raw, y = train.load_dataset(str(csv_path))
    X_fe = train.engineer_financial_features(X_raw)
    pre, dropped = train.build_preprocessor(X_fe)
    X = X_fe.drop(columns=dropped)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    models = train.build_models(pre)
    test_df, cms, _ = train.evaluate_test_set(models, X_tr, X_te, y_tr, y_te)
    cv_df = train.evaluate_cross_validation(models, X, y, n_splits=5)

out = {
    "dataset_rows": int(len(X)),
    "holdout": test_df.round(4).to_dict(orient="records"),
    "cross_validation": cv_df.round(4).to_dict(orient="records"),
    "confusion_matrices": {
        k: {"tn": int(v[0][0]), "fp": int(v[0][1]), "fn": int(v[1][0]), "tp": int(v[1][1])}
        for k, v in cms.items()
    },
}
(HERE / "metrics.json").write_text(json.dumps(out, indent=2))
print("Wrote", HERE / "metrics.json")
