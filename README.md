# CreditLogic: Credit Scoring & Risk Engine

**Author & Owner:** Trigun Parvathapuram  
*All Rights Reserved. Proprietary & Confidential Project.*

Predicts creditworthiness from financial history. Your scikit-learn model (Random Forest won on holdout ROC-AUC 0.94) is served by a FastAPI backend and used by a React + TypeScript frontend.

```
credit-scoring-app/
├── backend/
│   ├── app/            main.py (API), predictor.py, features.py, schemas.py, db.py
│   ├── model/          train.py (your script), credit_scoring_model.pkl, metrics.json, export_metrics.py
│   ├── data/finance.csv
│   └── tests/          test_core.py, test_api.py
└── frontend/           Vite + React + TypeScript (Assess / Model / History tabs)
```

## Run it locally

Backend (terminal 1):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python model/train.py data/finance.csv                 # re-creates the .pkl with YOUR scikit-learn version
python model/export_metrics.py                         # writes metrics.json for the dashboard
python tests/test_core.py && pytest                    # sanity checks
uvicorn app.main:app --reload                          # http://127.0.0.1:8000/docs
```

Frontend (terminal 2):
```bash
cd frontend
npm install
npm run dev                                            # http://localhost:5173
```

Re-run `train.py` on your machine: a .pkl is only guaranteed to load under the scikit-learn version that created it.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | liveness + model name |
| POST | /api/predict | score one applicant |
| POST | /api/predict/batch | score up to 500 applicants |
| GET | /api/model/info | importances, thresholds, metrics |
| GET | /api/history?limit=20 | recent predictions (SQLite) |

Example:
```bash
curl -X POST http://127.0.0.1:8000/api/predict -H "Content-Type: application/json" \
  -d '{"annual_income":115000,"total_debt":18500,"net_worth":221500,"missed_payments_24m":0,"credit_score":795}'
```

Decision rule: probability >= 0.65 APPROVE, < 0.40 DENY, otherwise REVIEW (edit in `app/predictor.py`).

## Key design note

The saved .pkl contains preprocessing + classifier but NOT your `engineer_financial_features` step. `app/features.py` rebuilds those columns at request time, and `tests/test_core.py` checks it matches `train.py` row by row. If you change feature engineering in training, change `features.py` too.

## Order of work to finish the project

1. Model (done): train, compare 3 algorithms, save best.
2. Backend API (done): FastAPI + validation + tests. Check it at /docs.
3. Frontend (done): form, result gauge, model dashboard, history.
4. Run end to end locally and fix anything environment-specific.
5. Polish for submission: screenshots of each tab, a short demo video, and a results section using the numbers in the Model tab.
6. Deploy: backend on Render or Railway (start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`), frontend on Vercel or Netlify with `VITE_API_BASE` set to the backend URL, then add the frontend URL to `allow_origins` in `app/main.py`.
7. Write-up: problem, data, features, models, metrics, limitations, future work.

## Limitations to state honestly in your report

- Only 200 rows (the last 170 look programmatically generated), so metrics have wide error bars: the 5-fold CV ROC-AUC std is about 0.03 for Random Forest and 0.09 for the Decision Tree.
- Holdout is just 60 rows; one extra mistake moves accuracy by about 1.7 points.
- `credit_score` is itself a credit-risk summary, so the model partly re-learns it. Also check whether `debt_to_income` in the CSV duplicates `fe_debt_to_income` (it does, nearly), which makes some features redundant.
- Not suitable for real lending: fairness, explainability and regulatory requirements are out of scope.

## Ideas for extra marks

SHAP explanations per prediction, CSV batch upload, probability calibration, hyperparameter search (GridSearchCV), Dockerfile + docker-compose, GitHub Actions running the tests.
