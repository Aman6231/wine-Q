import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from connection import get_connection

model = joblib.load("mero_model_pipeline.joblib")
frontend_dist_dir = Path(__file__).resolve().parent / "frontend" / "dist"


def get_allowed_origins():
    origins_env = os.getenv("CORS_ALLOW_ORIGINS", "*")
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
    return origins if origins else ["*"]


def ensure_table_exists():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS wineQ_table (
            fixed_acidity REAL,
            volatile_acidity REAL,
            citric_acid REAL,
            residual_sugar REAL,
            chlorides REAL,
            free_sulfur_dioxide REAL,
            total_sulfur_dioxide REAL,
            density REAL,
            pH REAL,
            sulphates REAL,
            alcohol REAL,
            Id INTEGER,
            wine_quality INTEGER,
            prediction_ID INTEGER PRIMARY KEY AUTOINCREMENT
        )
        """
    )
    conn.commit()
    conn.close()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WineData(BaseModel):
    fixed_acidity: float
    volatile_acidity: float
    citric_acid: float
    residual_sugar: float
    chlorides: float
    free_sulfur_dioxide: float
    total_sulfur_dioxide: float
    density: float
    pH: float
    sulphates: float
    alcohol: float
    Id: int


@app.post("/predict")
def predict_quality(data: WineData):

    df = pd.DataFrame([data.model_dump()])

    df.columns = [
        "fixed acidity",
        "volatile acidity",
        "citric acid",
        "residual sugar",
        "chlorides",
        "free sulfur dioxide",
        "total sulfur dioxide",
        "density",
        "pH",
        "sulphates",
        "alcohol",
        "Id",
    ]

    prediction = model.predict(df)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO wineQ_table (
            fixed_acidity,
            volatile_acidity,
            citric_acid,
            residual_sugar,
            chlorides,
            free_sulfur_dioxide,
            total_sulfur_dioxide,
            density,
            pH,
            sulphates,
            alcohol,
            Id,
            wine_quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data.fixed_acidity,
            data.volatile_acidity,
            data.citric_acid,
            data.residual_sugar,
            data.chlorides,
            data.free_sulfur_dioxide,
            data.total_sulfur_dioxide,
            data.density,
            data.pH,
            data.sulphates,
            data.alcohol,
            data.Id,
            int(prediction[0]),
        ),
    )
    conn.commit()
    conn.close()

    return {"predicted_quality": int(prediction[0])}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/predictions")
def get_predictions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM wineQ_table")
    rows = cursor.fetchall()
    conn.close()

    return {
        "data": [
            {
                "fixed_acidity": row[0],
                "volatile_acidity": row[1],
                "citric_acid": row[2],
                "residual_sugar": row[3],
                "chlorides": row[4],
                "free_sulfur_dioxide": row[5],
                "total_sulfur_dioxide": row[6],
                "density": row[7],
                "pH": row[8],
                "sulphates": row[9],
                "alcohol": row[10],
                "Id": row[11],
                "wine_quality": row[12],
            }
            for row in rows
        ]
    }


@app.on_event("startup")
def startup_event():
    ensure_table_exists()


if (frontend_dist_dir / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist_dir), html=True), name="frontend")
else:

    @app.get("/")
    def root():
        return {"message": "Wine-Q API is running", "health": "/health"}