# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

"""Tiny SQLite log of predictions (stdlib only)."""
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "predictions.db"


def _conn(path: Path = DB_PATH):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(path: Path = DB_PATH) -> None:
    with closing(_conn(path)) as c, c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                full_name TEXT,
                credit_score INTEGER NOT NULL,
                annual_income REAL NOT NULL,
                probability REAL NOT NULL,
                decision TEXT NOT NULL
            )"""
        )


def log_prediction(applicant: dict, result: dict, path: Path = DB_PATH) -> None:
    with closing(_conn(path)) as c, c:
        c.execute(
            "INSERT INTO predictions (created_at, full_name, credit_score, annual_income, probability, decision)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
                applicant.get("full_name"),
                applicant["credit_score"],
                applicant["annual_income"],
                result["probability"],
                result["decision"],
            ),
        )


def recent(limit: int = 20, path: Path = DB_PATH) -> list[dict]:
    with closing(_conn(path)) as c:
        rows = c.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]
