# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .predictor import CreditPredictor
from .schemas import Applicant, BatchRequest, HistoryItem, Prediction

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["predictor"] = CreditPredictor()  # load the .pkl once at startup
    db.init_db()
    yield
    state.clear()


app = FastAPI(
    title="CreditLogic",
    description="Predicts creditworthiness from financial history.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # add your deployed frontend URL here
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": state["predictor"].model_name}


@app.post("/api/predict", response_model=Prediction)
def predict(applicant: Applicant):
    result = state["predictor"].predict([applicant.model_row()])[0]
    db.log_prediction(applicant.model_dump(), result)
    return result


@app.post("/api/predict/batch", response_model=list[Prediction])
def predict_batch(req: BatchRequest):
    rows = [a.model_row() for a in req.applicants]
    results = state["predictor"].predict(rows)
    for a, r in zip(req.applicants, results):
        db.log_prediction(a.model_dump(), r)
    return results


@app.get("/api/model/info")
def model_info():
    return state["predictor"].info()


@app.get("/api/history", response_model=list[HistoryItem])
def history(limit: int = 20):
    if not 1 <= limit <= 200:
        raise HTTPException(status_code=422, detail="limit must be between 1 and 200")
    return db.recent(limit)
