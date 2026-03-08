from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib

app = FastAPI(title="Student Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("../models/random_forest_model.pkl")

@app.get("/")
def home():
    return {"message": "Student Risk API running"}

@app.post("/predict")
def predict(data: dict):

    df = pd.DataFrame([data])

    prediction = model.predict(df)[0]

    if hasattr(model, "predict_proba"):
        probability = model.predict_proba(df)[0][1]
    else:
        probability = 0.5

    return {
        "prediction": int(prediction),
        "probability": float(probability)
    }