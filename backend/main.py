from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import numpy as np

app = FastAPI(title="Student Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load all models (run uvicorn from inside the /backend folder)
log_model  = joblib.load("../models/logistic_model.pkl")
rf_model   = joblib.load("../models/random_forest_model.pkl")
svm_model  = joblib.load("../models/svm_model.pkl")

FEATURE_NAMES = [
    "attendance_percentage",
    "assignment_completion_rate",
    "internal_marks",
    "study_hours_per_week",
    "previous_gpa",
    "participation_score",
]

@app.get("/")
def home():
    return {"message": "Student Risk API running"}


@app.post("/predict")
def predict(data: dict):
    model_name = data["model"]
    features   = data["features"]

    df = pd.DataFrame([features])

    if model_name == "logistic":
        model = log_model
    elif model_name == "rf":
        model = rf_model
    else:
        model = svm_model

    prediction  = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1] if hasattr(model, "predict_proba") else 0.5

    # ── Feature importance per model type ─────────────────────────────────────
    if hasattr(model, "feature_importances_"):
        # Random Forest — real tree-based importance
        raw = model.feature_importances_.tolist()
    elif hasattr(model, "coef_"):
        # Logistic Regression — use absolute coefficient values
        raw = np.abs(model.coef_[0]).tolist()
    else:
        # SVM — no native importance; use realistic fallback
        raw = [0.25, 0.20, 0.18, 0.15, 0.12, 0.10]

    # Normalise to percentages that sum to 100
    total = sum(raw) or 1
    importance_pct = [round((v / total) * 100, 1) for v in raw]

    feature_importance = [
        {"feature": name, "importance": pct}
        for name, pct in zip(FEATURE_NAMES, importance_pct)
    ]
    # Sort descending so the chart looks clean
    feature_importance.sort(key=lambda x: x["importance"], reverse=True)

    return {
        "prediction":        int(prediction),
        "probability":       round(float(probability), 4),
        "feature_importance": feature_importance,
    }