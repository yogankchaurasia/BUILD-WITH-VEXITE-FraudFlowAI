from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard_analytics(db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).all()
    total = len(complaints)
    active = sum(1 for c in complaints if c.status in ("Under Investigation", "High Risk"))
    high_risk = sum(1 for c in complaints if c.risk_level in ("CRITICAL", "HIGH"))
    action_required = sum(1 for c in complaints if c.status == "Action Required")
    amount_at_risk = sum(c.amount for c in complaints)

    risk_dist = Counter(c.risk_level for c in complaints)
    fraud_type_dist = Counter(c.fraud_type for c in complaints)
    status_dist = Counter(c.status for c in complaints)

    alerts_count = db.query(models.Alert).count()

    return {
        "total_complaints": total,
        "active_investigations": active,
        "high_risk_cases": high_risk,
        "action_required": action_required,
        "amount_at_risk": amount_at_risk,
        "predicted_locations": db.query(models.Prediction).count(),
        "active_alerts": alerts_count,
        "risk_distribution": dict(risk_dist),
        "fraud_type_distribution": dict(fraud_type_dist),
        "status_distribution": dict(status_dist),
    }
