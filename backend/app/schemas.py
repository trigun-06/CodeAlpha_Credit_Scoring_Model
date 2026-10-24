# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

from typing import Literal

from pydantic import BaseModel, Field


class Applicant(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    annual_income: float = Field(ge=0, le=10_000_000, description="Gross yearly income")
    total_debt: float = Field(ge=0, le=100_000_000)
    net_worth: float = Field(ge=-100_000_000, le=1_000_000_000)
    missed_payments_24m: int = Field(ge=0, le=24)
    credit_score: int = Field(ge=300, le=850)

    def model_row(self) -> dict:
        return self.model_dump(exclude={"full_name"})


class Factor(BaseModel):
    label: str
    impact: Literal["positive", "negative"]
    detail: str


class Prediction(BaseModel):
    creditworthy: bool
    probability: float
    decision: Literal["APPROVE", "REVIEW", "DENY"]
    risk_band: str
    factors: list[Factor]


class BatchRequest(BaseModel):
    applicants: list[Applicant] = Field(min_length=1, max_length=500)


class HistoryItem(BaseModel):
    id: int
    created_at: str
    full_name: str | None
    credit_score: int
    annual_income: float
    probability: float
    decision: str
