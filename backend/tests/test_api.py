# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

"""API tests. Needs fastapi + httpx installed (pip install -r requirements.txt)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

GOOD = dict(annual_income=115000, total_debt=18500, net_worth=221500, missed_payments_24m=0, credit_score=795)


def test_health_predict_validation_and_info():
    with TestClient(app) as c:  # context manager runs the lifespan (loads model)
        assert c.get("/api/health").json()["status"] == "ok"

        r = c.post("/api/predict", json=GOOD)
        assert r.status_code == 200
        assert r.json()["decision"] == "APPROVE"

        bad = c.post("/api/predict", json={**GOOD, "credit_score": 900})
        assert bad.status_code == 422

        b = c.post("/api/predict/batch", json={"applicants": [GOOD, GOOD]})
        assert len(b.json()) == 2

        assert c.get("/api/model/info").json()["model"]
        assert len(c.get("/api/history?limit=5").json()) >= 1
