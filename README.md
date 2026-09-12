# FraudFlow AI — Predictive Cybercrime Intelligence & Cash Withdrawal Location Forecasting

Smart India Hackathon prototype. **All data is synthetic** — no real accounts, UPI IDs, PII,
or financial data is used anywhere in this project.

```
fraudflow-ai/
├── frontend/     React + Vite + Tailwind CSS dashboard
└── backend/      FastAPI + SQLite + mock ML prediction pipeline
```

## Quick start

Open two terminals in VS Code (or use the built-in split terminal).

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed_data         # creates fraudflow.db and loads synthetic data
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

The frontend calls the backend at `http://localhost:8000` by default (see
`frontend/src/api.js`). Change `VITE_API_URL` in a `.env` file inside `frontend/`
if your backend runs elsewhere.

## What's real vs. mocked

- **Real**: FastAPI REST API, SQLite persistence via SQLAlchemy, JWT-based login,
  request validation, a working (if simple) risk-scoring and location-ranking
  algorithm, an audit log.
- **Mocked / simplified for a hackathon demo**: the ML "model" in
  `backend/app/ml/predictor.py` is a transparent, explainable heuristic rather
  than a trained scikit-learn model — it's built so you can swap in a real
  `.pkl` model later without changing the API contract. All complaints,
  accounts, transactions and locations are generated fictional data (see
  `backend/app/seed_data.py`).

## Project structure

```
backend/
  app/
    main.py            FastAPI app + CORS + router registration
    database.py         SQLAlchemy engine/session setup (SQLite)
    models.py            ORM tables: Users, Complaints, Accounts, Transactions,
                          MoneyTrail, Locations, Predictions, RiskScores, Alerts,
                          Reports, AuditLogs
    schemas.py            Pydantic request/response models
    seed_data.py          Generates 20 complaints, 50 transactions, 15 accounts,
                          20 locations + writes them into fraudflow.db
    ml/predictor.py       Risk scoring + ranked location prediction + explainability
    routers/
      auth.py             POST /auth/login
      complaints.py       /complaints CRUD + /complaints/{id}/analyze + /predict
      money_trail.py      GET /money-trail/{case_id}
      risk.py             GET /risk-score/{case_id}
      locations.py        GET /locations/predicted/{case_id}
      analytics.py        GET /analytics/dashboard
      reports.py          POST /reports/generate

frontend/
  src/
    App.jsx              Full dashboard UI (login, dashboard, complaints, money
                          trail graph, prediction engine, GIS-style map, cases,
                          alerts, analytics, admin panel)
    api.js               Thin fetch wrapper around the backend endpoints
    main.jsx, index.css  Vite/React/Tailwind entry points
```

## Disclaimer

This is a decision-support prototype. Predictions are probabilistic signals
generated from synthetic pattern data, not certainty — any real deployment
must keep a human investigator in the loop before action is taken.
