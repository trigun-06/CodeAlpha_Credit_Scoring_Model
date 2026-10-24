# ==============================================================================
# CreditLogic - Credit Scoring & Risk Analysis Engine
# Author & Intellectual Property Owner: Trigun Parvathapuram
# All Rights Reserved. Proprietary & Confidential.
# ==============================================================================

import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier


def load_dataset(file_path: str) -> tuple[pd.DataFrame, pd.Series]:
    """
    Loads dataset from CSV, handles missing values in target,
    and identifies features (X) and creditworthiness target (y).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file '{file_path}' not found.")

    df = pd.read_csv(file_path)

    if df.shape[1] < 2:
        raise ValueError("Dataset must contain at least 2 columns (features + target).")

    # Detect target column (prefer recognized names or default to final column)
    target_candidates = ["creditworthy", "creditworthiness", "target", "status", "credit_risk"]
    target_col = None
    for candidate in target_candidates:
        matches = [c for c in df.columns if c.lower() == candidate]
        if matches:
            target_col = matches[0]
            break

    if target_col is None:
        target_col = df.columns[-1]

    # Clean duplicates and rows where target is missing
    df = df.dropna(subset=[target_col]).drop_duplicates()

    X = df.drop(columns=[target_col]).copy()
    y = df[target_col].copy()

    # Ensure binary 0/1 numeric target
    if not pd.api.types.is_numeric_dtype(y):
        y = y.astype("category").cat.codes

    print("=" * 70)
    print("                      DATASET INGESTION")
    print("=" * 70)
    print(f"File Path: {file_path}")
    print(f"Total Observations: {len(df)} | Raw Feature Columns: {X.shape[1]}")
    print(f"Target Column: '{target_col}' | Classes: {np.unique(y).tolist()}")
    class_counts = y.value_counts().to_dict()
    print(f"Class Distribution: {class_counts} (0: High Risk / Deny, 1: Creditworthy / Approve)\n")

    return X, y


def engineer_financial_features(X: pd.DataFrame) -> pd.DataFrame:
    """
    Fulfills Key Feature: 'Feature engineering from financial history'
    Creates domain-specific financial health & risk indicators.
    """
    X_fe = X.copy()
    col_map = {str(c).lower(): c for c in X_fe.columns}

    # 1. Debt-to-Income (DTI) ratio
    if "total_debt" in col_map and "annual_income" in col_map:
        income = X_fe[col_map["annual_income"]].replace(0, np.nan)
        X_fe["fe_debt_to_income"] = (X_fe[col_map["total_debt"]] / income).fillna(0)

    # 2. Financial Leverage / Solvency (Debt to Net Worth)
    if "total_debt" in col_map and "net_worth" in col_map:
        net_worth_adj = X_fe[col_map["net_worth"]].abs() + 1.0
        X_fe["fe_debt_to_networth"] = X_fe[col_map["total_debt"]] / net_worth_adj

    # 3. Wealth Accumulation Ratio (Net Worth relative to Annual Income)
    if "net_worth" in col_map and "annual_income" in col_map:
        income = X_fe[col_map["annual_income"]].replace(0, np.nan)
        X_fe["fe_networth_to_income"] = (X_fe[col_map["net_worth"]] / income).fillna(0)

    # 4. Payment Delinquency Rate (Missed payments out of 24 months)
    if "missed_payments_24m" in col_map:
        X_fe["fe_missed_payment_rate"] = X_fe[col_map["missed_payments_24m"]] / 24.0

    # 5. Composite Credit Score to Income Ratio
    if "credit_score" in col_map and "annual_income" in col_map:
        X_fe["fe_credit_score_normalized"] = (X_fe[col_map["credit_score"]] - 300) / 550.0

    new_features = [c for c in X_fe.columns if c.startswith("fe_")]
    print("=" * 70)
    print("                 FEATURE ENGINEERING SUMMARY")
    print("=" * 70)
    print(f"Domain Features Created ({len(new_features)}): {new_features}\n")

    return X_fe


def build_preprocessor(X: pd.DataFrame) -> tuple[ColumnTransformer, list[str]]:
    """
    Classifies features into numeric and categorical types.
    Properly excludes non-predictive identifiers/names without dropping
    continuous numerical financial data.
    """
    n_rows = len(X)
    dropped_cols = []
    numeric_cols = []
    categorical_cols = []

    id_keywords = ["id", "uuid", "guid", "name", "ssn", "identifier"]

    for col in X.columns:
        col_lower = str(col).lower()
        n_unique = X[col].nunique()
        is_numeric = pd.api.types.is_numeric_dtype(X[col])

        # Match identifier keywords on exact token or prefix/suffix patterns
        is_named_id = any(
            col_lower == kw
            or col_lower.startswith(f"{kw}_")
            or col_lower.endswith(f"_{kw}")
            or f"_{kw}_" in col_lower
            for kw in id_keywords
        )

        # High cardinality filter applies ONLY to categorical / text columns
        is_high_cardinality = (not is_numeric) and ((n_unique / max(1, n_rows)) > 0.6) and (n_unique > 10)

        if (is_named_id and n_unique > 5) or is_high_cardinality:
            dropped_cols.append(col)
        elif is_numeric:
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)

    print("=" * 70)
    print("                  DATA PREPROCESSING PIPELINE")
    print("=" * 70)
    print(f"Excluded Identifier/Metadata Columns: {dropped_cols}")
    print(f"Active Numeric Features ({len(numeric_cols)}): {numeric_cols}")
    print(f"Active Categorical Features ({len(categorical_cols)}): {categorical_cols}\n")

    transformers = []

    if numeric_cols:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("num", num_pipeline, numeric_cols))

    if categorical_cols:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
        transformers.append(("cat", cat_pipeline, categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    return preprocessor, dropped_cols


def build_models(preprocessor: ColumnTransformer) -> dict[str, Pipeline]:
    """
    Constructs the 3 specified classification algorithms wrapped with the preprocessor:
    1. Logistic Regression
    2. Decision Tree Classifier
    3. Random Forest Classifier
    """
    return {
        "Logistic Regression": Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(random_state=42, max_iter=1000, class_weight="balanced")),
        ]),
        "Decision Tree": Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", DecisionTreeClassifier(max_depth=4, min_samples_split=4, random_state=42, class_weight="balanced")),
        ]),
        "Random Forest": Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=150, max_depth=5, min_samples_split=4, random_state=42, class_weight="balanced")),
        ]),
    }


def evaluate_test_set(
    models: dict[str, Pipeline],
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> tuple[pd.DataFrame, dict[str, np.ndarray], dict[str, str]]:
    """Evaluates Accuracy, Precision, Recall, F1-Score, and ROC-AUC on a held-out test split."""
    records = []
    confusion_matrices = {}
    classification_reports = {}

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else y_pred

        records.append({
            "Model": name,
            "Accuracy": accuracy_score(y_test, y_pred),
            "Precision": precision_score(y_test, y_pred, zero_division=0),
            "Recall": recall_score(y_test, y_pred, zero_division=0),
            "F1-Score": f1_score(y_test, y_pred, zero_division=0),
            "ROC-AUC": roc_auc_score(y_test, y_proba),
        })

        confusion_matrices[name] = confusion_matrix(y_test, y_pred)
        classification_reports[name] = classification_report(y_test, y_pred, zero_division=0)

    return pd.DataFrame(records), confusion_matrices, classification_reports


def evaluate_cross_validation(
    models: dict[str, Pipeline],
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5,
) -> pd.DataFrame:
    """Evaluates model generalization across folds using Stratified K-Fold."""
    min_class_count = int(y.value_counts().min())
    actual_splits = min(n_splits, min_class_count)
    if actual_splits < 2:
        return pd.DataFrame()

    cv = StratifiedKFold(n_splits=actual_splits, shuffle=True, random_state=42)
    scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]

    cv_records = []
    for name, pipeline in models.items():
        scores = cross_validate(pipeline, X, y, cv=cv, scoring=scoring)
        cv_records.append({
            "Model": name,
            "CV Accuracy": np.mean(scores["test_accuracy"]),
            "CV Precision": np.mean(scores["test_precision"]),
            "CV Recall": np.mean(scores["test_recall"]),
            "CV F1-Score": np.mean(scores["test_f1"]),
            "CV ROC-AUC": np.mean(scores["test_roc_auc"]),
            "CV ROC-AUC (±Std)": np.std(scores["test_roc_auc"]),
        })

    return pd.DataFrame(cv_records)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Determine CSV file path (CLI argument or default to finance.csv / Financialhistory.csv)
    if len(sys.argv) > 1 and sys.argv[1].endswith(".csv"):
        csv_file_path = sys.argv[1]
    else:
        candidates = ["finance.csv", "Financialhistory.csv", "financial_history.csv"]
        csv_file_path = None
        for cand in candidates:
            cand_path = os.path.join(script_dir, cand)
            if os.path.exists(cand_path):
                csv_file_path = cand_path
                break
        if csv_file_path is None:
            csv_file_path = os.path.join(script_dir, "finance.csv")

    # 1. Ingest Data
    X_raw, y = load_dataset(csv_file_path)

    # 2. Feature Engineering
    X_fe = engineer_financial_features(X_raw)

    # 3. Build Preprocessor
    preprocessor, dropped_cols = build_preprocessor(X_fe)
    X_clean = X_fe.drop(columns=dropped_cols)

    # 4. Stratified Train-Test Split (70% Train, 30% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X_clean, y, test_size=0.3, random_state=42, stratify=y
    )

    # 5. Build Models (Logistic Regression, Decision Tree, Random Forest)
    models = build_models(preprocessor)

    # 6. Evaluate on Holdout Test Set
    print("=" * 70)
    print("                 HOLDOUT TEST EVALUATION (30% SPLIT)")
    print("=" * 70)
    test_results, conf_matrices, reports = evaluate_test_set(models, X_train, X_test, y_train, y_test)
    print(test_results.to_string(index=False, float_format="%.4f"))
    print("\n")

    # 7. Print Confusion Matrices & Credit Risk Interpretation
    print("=" * 70)
    print("                CONFUSION MATRICES & ERROR ANALYSIS")
    print("=" * 70)
    for model_name, cm in conf_matrices.items():
        tn, fp, fn, tp = cm.ravel()
        print(f"[{model_name}]")
        print(f"  • True Negatives  (Correctly flagged Default/Risky): {tn}")
        print(f"  • False Positives (Risky borrower wrongly approved): {fp}")
        print(f"  • False Negatives (Creditworthy wrongly rejected)  : {fn}")
        print(f"  • True Positives  (Creditworthy correctly approved): {tp}\n")

    # 8. Cross-Validation Evaluation
    print("=" * 70)
    print("             STRATIFIED 5-FOLD CROSS-VALIDATION (MEAN SCORES)")
    print("=" * 70)
    cv_results = evaluate_cross_validation(models, X_clean, y, n_splits=5)
    if not cv_results.empty:
        print(cv_results.to_string(index=False, float_format="%.4f"))
    else:
        print("Skipped: Insufficient samples per class for multi-fold validation.")
    print("=" * 70)

    # 9. Model Persistence: Save the Best Model
    best_row = test_results.sort_values(by=["ROC-AUC", "F1-Score"], ascending=False).iloc[0]
    best_model_name = best_row["Model"]
    best_pipeline = models[best_model_name]

    # Fit best model on complete dataset for production export
    best_pipeline.fit(X_clean, y)
    model_save_path = os.path.join(script_dir, "credit_scoring_model.pkl")
    joblib.dump(best_pipeline, model_save_path)

    print("\n" + "=" * 70)
    print("                       MODEL DEPLOYMENT & EXPORT")
    print("=" * 70)
    print(f"Top Performing Model : {best_model_name}")
    print(f"Test ROC-AUC         : {best_row['ROC-AUC']:.4f} | F1-Score: {best_row['F1-Score']:.4f}")
    print(f"Saved Model Path     : {model_save_path}")
    print("The model pipeline includes preprocessing + feature handling and is ready for inference.")
    print("=" * 70)


if __name__ == "__main__":
    main()
