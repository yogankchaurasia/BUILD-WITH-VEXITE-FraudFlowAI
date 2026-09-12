from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, complaints, money_trail, risk, locations, analytics, reports

# Creates tables if they don't exist yet (seed_data.py also does this + populates data).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FraudFlow AI API",
    description="Predictive Cybercrime Intelligence & Cash Withdrawal Location Forecasting — "
                "hackathon prototype API. Synthetic data only.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(money_trail.router)
app.include_router(risk.router)
app.include_router(locations.router)
app.include_router(analytics.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "service": "FraudFlow AI API",
        "status": "ok",
        "docs": "/docs",
        "disclaimer": "Synthetic demo data only. Predictions require human verification.",
    }
